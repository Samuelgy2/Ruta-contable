// Pruebas del registro público con OTP (RF-028, RF-107), de la aprobación del
// socio pendiente (RF-108), del alta de usuarios con socio y de las noticias de
// la landing (RF-109).
//
// Corren SOLO contra un PostgreSQL local desechable armado desde las
// migraciones (nunca contra Supabase). Se activan con:
//
//   TEST_BD_LOCAL=1 TEST_DB_NAME=<bd desechable> TEST_DB_USER=... TEST_DB_PASSWORD=... npm test
//
// El correo (Brevo) se reemplaza por un doble que guarda los mensajes en memoria.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

if (process.env.TEST_BD_LOCAL !== '1') {
  test('registro: omitido (define TEST_BD_LOCAL=1 y TEST_DB_* para correrlo en una BD local desechable)', { skip: true }, () => {});
  return;
}
for (const v of ['TEST_DB_NAME', 'TEST_DB_USER', 'TEST_DB_PASSWORD']) {
  if (!process.env[v]) throw new Error(`Falta ${v}`);
}

// Todas las variables DB_* se fijan ANTES de cargar db.js: dotenv no pisa las
// que ya existen, así que backend/.env (producción) no puede colarse.
delete process.env.DB_HOST_IP;
Object.assign(process.env, {
  DB_HOST: 'localhost', DB_PORT: '5432', DB_SSL: 'false',
  DB_NAME: process.env.TEST_DB_NAME, DB_USER: process.env.TEST_DB_USER, DB_PASSWORD: process.env.TEST_DB_PASSWORD,
  JWT_SECRET: 'secreto-solo-para-pruebas-con-longitud-suficiente',
  BREVO_API_KEY: 'prueba', BREVO_SENDER: 'pruebas@example.com',
});

// Doble del correo: se instala en la caché de require antes de cargar los controladores.
const correos = [];
const rutaCorreo = path.join(__dirname, '..', 'utils', 'correo.js');
const correoReal = require(rutaCorreo);
require.cache[rutaCorreo].exports = { ...correoReal, enviarCorreo: async (m) => { correos.push(m); } };

const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { firmar } = require('../utils/jwt');

let servidor, base, tokenAdmin, idImagen;

async function api(metodo, ruta, cuerpo, token) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

const ultimoCodigo = () => {
  const m = correos[correos.length - 1];
  return m.subject.match(/^(\d{6}) /)?.[1];
};

const socioValido = (documento) => ({
  nombre: 'Laura Gómez Pérez', tipo_documento: 'CC', documento,
  fecha_nacimiento: '2010-05-14', telefono: '300 123 4567', direccion: 'Calle 1', nivel_aprendizaje: 'Iniciación',
});

before(async () => {
  const { rows } = await pool.query(`SELECT current_database() AS bd, inet_server_addr()::text AS ip`);
  assert.equal(rows[0].bd, process.env.TEST_DB_NAME);
  assert.ok(rows[0].ip === null || /^(127\.0\.0\.1|::1)/.test(rows[0].ip), 'la BD debe ser local');

  const hash = await bcrypt.hash('admin-prueba-123', 4);
  const admin = await pool.query(
    `INSERT INTO users (username, password, email, full_name, role, active)
     VALUES ('admin_prueba', $1, 'admin.prueba@example.com', 'Admin Prueba', 'admin', true) RETURNING id`, [hash]);
  tokenAdmin = firmar({ id: admin.rows[0].id, username: 'admin_prueba', role: 'admin' });

  const img = await pool.query(
    `INSERT INTO landing_imagen (mime, datos, bytes, alt) VALUES ('image/png', '\\x89504e470d0a1a0a00', 9, 'Podio') RETURNING id`);
  idImagen = img.rows[0].id;

  const app = express();
  app.set('trust proxy', false);
  app.use(express.json());
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/users', require('../routes/users'));
  app.use('/api/socios', require('../routes/Member'));
  app.use('/api/admin/landing', require('../routes/landingAdmin'));
  app.use('/api/landing', require('../routes/landing'));
  await new Promise(r => { servidor = app.listen(0, r); });
  base = `http://127.0.0.1:${servidor.address().port}/api`;
});

after(async () => {
  await new Promise(r => servidor.close(r));
  await pool.end();
});

// ─── Registro público ─────────────────────────────────────────────────────────

test('registro completo: código, verificación y alta de socio pendiente + cuenta vinculada', async () => {
  const email = 'Laura.Gomez@Example.com';
  let r = await api('POST', '/auth/registro/solicitar-codigo', { email });
  assert.equal(r.status, 200);
  const codigo = ultimoCodigo();
  assert.match(codigo, /^\d{6}$/);
  assert.equal(correos.at(-1).to, 'laura.gomez@example.com');

  // Reenvío antes de un minuto.
  r = await api('POST', '/auth/registro/solicitar-codigo', { email });
  assert.equal(r.status, 429);

  r = await api('POST', '/auth/registro/verificar-codigo', { email, otp: codigo === '000000' ? '111111' : '000000' });
  assert.equal(r.status, 400);
  assert.equal(r.body.attemptsLeft, 2);

  r = await api('POST', '/auth/registro/verificar-codigo', { email, otp: codigo });
  assert.equal(r.status, 200);
  const token = r.body.data.registroToken;
  assert.match(token, /^[a-f0-9]{64}$/);

  // El código ya no sirve una segunda vez.
  r = await api('POST', '/auth/registro/verificar-codigo', { email, otp: codigo });
  assert.equal(r.status, 400);

  r = await api('POST', '/auth/register', { registroToken: token, username: 'laura.g', password: 'clave-segura-1', socio: socioValido('1000000001') });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.data.user.email, 'laura.gomez@example.com');

  const { rows } = await pool.query(
    `SELECT s.estado, s.email, s.fecha_ingreso = CURRENT_DATE AS hoy, s.created_by, u.role, sp.id_socio = s.id_socio AS vinculado, sp.telefono
       FROM users u JOIN socio_perfil sp ON sp.user_id = u.id JOIN socio s ON s.id_socio = sp.id_socio
      WHERE u.username = 'laura.g'`);
  assert.deepEqual(rows[0], { estado: 'pendiente', email: 'laura.gomez@example.com', hoy: true, created_by: null, role: 'user', vinculado: true, telefono: '300 123 4567' });
  assert.equal((await pool.query(`SELECT 1 FROM registro_pendiente WHERE email = 'laura.gomez@example.com'`)).rows.length, 0);

  // El token es de un solo uso.
  r = await api('POST', '/auth/register', { registroToken: token, username: 'otra', password: 'clave-segura-1', socio: socioValido('1000000002') });
  assert.equal(r.status, 400);
  assert.equal(r.body.codigo, 'TOKEN_INVALIDO');

  // El socio pendiente no cuenta como activo.
  const activos = await pool.query(`SELECT count(*)::int AS n FROM socio WHERE estado = 'activo' AND documento = '1000000001'`);
  assert.equal(activos.rows[0].n, 0);
});

test('correo ya registrado: misma respuesta, correo de aviso y sin código', async () => {
  const antes = correos.length;
  const r = await api('POST', '/auth/registro/solicitar-codigo', { email: 'laura.gomez@example.com' });
  assert.equal(r.status, 200);
  assert.equal(correos.length, antes + 1);
  assert.match(correos.at(-1).subject, /Ya tienes una cuenta/);
  assert.equal((await pool.query(`SELECT 1 FROM registro_pendiente WHERE email = 'laura.gomez@example.com'`)).rows.length, 0);
});

test('tres códigos incorrectos invalidan el código', async () => {
  const email = 'tres.intentos@example.com';
  await api('POST', '/auth/registro/solicitar-codigo', { email });
  const codigo = ultimoCodigo();
  const malo = codigo === '123456' ? '654321' : '123456';
  await api('POST', '/auth/registro/verificar-codigo', { email, otp: malo });
  await api('POST', '/auth/registro/verificar-codigo', { email, otp: malo });
  const r3 = await api('POST', '/auth/registro/verificar-codigo', { email, otp: malo });
  assert.equal(r3.body.invalidated, true);
  const r4 = await api('POST', '/auth/registro/verificar-codigo', { email, otp: codigo });
  assert.equal(r4.status, 400);
});

async function tokenPara(email) {
  await api('POST', '/auth/registro/solicitar-codigo', { email });
  return (await api('POST', '/auth/registro/verificar-codigo', { email, otp: ultimoCodigo() })).body.data.registroToken;
}

test('documento ya registrado: 409 y no se crea nada', async () => {
  const token = await tokenPara('duplicado@example.com');
  const r = await api('POST', '/auth/register', { registroToken: token, username: 'duplicado', password: 'clave-segura-1', socio: socioValido('1000000001') });
  assert.equal(r.status, 409);
  assert.match(r.body.message, /Comunícate con el club/);
  assert.equal((await pool.query(`SELECT 1 FROM users WHERE username = 'duplicado'`)).rows.length, 0);
  // El token sigue vivo para corregir el documento.
  const ok = await api('POST', '/auth/register', { registroToken: token, username: 'duplicado', password: 'clave-segura-1', socio: socioValido('1000000003') });
  assert.equal(ok.status, 201);
});

test('validaciones del formulario: datos del socio y de la cuenta', async () => {
  // Los campos se validan antes de buscar el token, así que basta uno con formato válido.
  const r = await api('POST', '/auth/register', {
    registroToken: 'a'.repeat(64), username: 'A', password: 'corta',
    socio: { nombre: 'Ana 123', tipo_documento: 'CC', documento: 'ABC', fecha_nacimiento: '2999-01-01', telefono: '' },
  });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.length >= 6, JSON.stringify(r.body.errors));
});

test('límite por IP: a la sexta solicitud de código en 15 minutos responde 429', async () => {
  // Las pruebas anteriores ya pidieron 5 códigos desde 127.0.0.1.
  const r = await api('POST', '/auth/registro/solicitar-codigo', { email: 'limite@example.com' });
  assert.equal(r.status, 429);
  assert.match(r.body.message, /Demasiadas solicitudes/);
});

// ─── Aprobación y alta de usuarios desde el panel ─────────────────────────────

test('el admin aprueba el socio pendiente', async () => {
  const { rows } = await pool.query(`SELECT id_socio FROM socio WHERE documento = '1000000001'`);
  const r = await api('PUT', `/socios/${rows[0].id_socio}`, { estado: 'activo' }, tokenAdmin);
  assert.equal(r.status, 200);
  assert.equal(r.body.data.estado, 'activo');
});

test('alta de cuenta Usuario exige socio: existente sin cuenta o nuevo', async () => {
  const cuenta = { username: 'pedro', password: 'clave123', email: 'pedro@example.com', fullName: 'Pedro Ruiz', role: 'user' };
  let r = await api('POST', '/users', cuenta, tokenAdmin);
  assert.equal(r.status, 400);

  // Socio nuevo creado junto con la cuenta.
  r = await api('POST', '/users', { ...cuenta, socio: socioValido('2000000001') }, tokenAdmin);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const nuevo = await pool.query(`SELECT s.estado FROM socio s JOIN socio_perfil sp ON sp.id_socio = s.id_socio JOIN users u ON u.id = sp.user_id WHERE u.username = 'pedro'`);
  assert.equal(nuevo.rows[0].estado, 'activo');

  // Socio existente sin cuenta.
  const libre = await pool.query(`INSERT INTO socio (nombre, documento, fecha_ingreso) VALUES ('Sin Cuenta', '2000000002', CURRENT_DATE) RETURNING id_socio`);
  const idLibre = libre.rows[0].id_socio;
  r = await api('POST', '/users', { ...cuenta, username: 'sincuenta', email: 'sincuenta@example.com', idSocio: idLibre }, tokenAdmin);
  assert.equal(r.status, 201);

  // La misma ficha no puede tomar una segunda cuenta.
  r = await api('POST', '/users', { ...cuenta, username: 'otra2', email: 'otra2@example.com', idSocio: idLibre }, tokenAdmin);
  assert.equal(r.status, 409);

  // Un administrador no necesita socio.
  r = await api('POST', '/users', { ...cuenta, username: 'admin2', email: 'admin2@example.com', role: 'admin' }, tokenAdmin);
  assert.equal(r.status, 201);
});

// ─── Noticias de la landing ───────────────────────────────────────────────────

test('noticias: se guardan en el borrador, se publican y su imagen es pública', async () => {
  const estado = (await api('GET', '/admin/landing', undefined, tokenAdmin)).body.data;
  const contenido = estado.borrador?.contenido ?? (await api('GET', '/landing')).body.data.contenido;
  assert.ok(contenido.secciones.some(s => s.id === 'noticias'));
  assert.deepEqual(contenido.noticias, []);

  // Inválida: sin título y con enlace http.
  let r = await api('PUT', '/admin/landing/borrador', { contenido: { ...contenido, noticias: [{ titulo: '', fecha: '2026-11-20', resumen: 'x', enlace: 'http://a', imagen: null }] } }, tokenAdmin);
  assert.equal(r.status, 400);
  assert.ok(r.body.errores.some(e => e.campo === 'noticias.0.titulo'));
  assert.ok(r.body.errores.some(e => e.campo === 'noticias.0.enlace'));

  const noticia = { titulo: 'Podio en la válida', fecha: '2026-11-20', resumen: 'Tres riders en el podio.', enlace: 'https://example.com/nota', imagen: idImagen };
  r = await api('PUT', '/admin/landing/borrador', { contenido: { ...contenido, noticias: [noticia] } }, tokenAdmin);
  assert.equal(r.status, 200, JSON.stringify(r.body));

  r = await api('POST', '/admin/landing/publicar', undefined, tokenAdmin);
  assert.equal(r.status, 201, JSON.stringify(r.body));

  const publica = (await api('GET', '/landing')).body.data;
  assert.deepEqual(publica.contenido.noticias, [noticia]);
  assert.ok(publica.imagenes.some(i => i.id === idImagen));

  const img = await fetch(`${base}/landing/imagenes/${idImagen}`);
  assert.equal(img.status, 200);

  // Una imagen usada por una noticia publicada no se puede borrar.
  r = await api('DELETE', `/admin/landing/imagenes/${idImagen}`, undefined, tokenAdmin);
  assert.equal(r.status, 409);
});

test('noticias: una versión publicada antes de las noticias se lee y se restaura sin errores', async () => {
  const viejo = (await api('GET', '/landing')).body.data.contenido;
  const sinNoticias = { secciones: viejo.secciones.filter(s => s.id !== 'noticias'), contacto: viejo.contacto };
  const { rows } = await pool.query(
    `INSERT INTO landing_version (numero, contenido) SELECT COALESCE(MAX(numero), 0) + 1, $1 FROM landing_version RETURNING numero`,
    [JSON.stringify(sinNoticias)]);

  const publica = (await api('GET', '/landing')).body.data.contenido;
  assert.ok(publica.secciones.some(s => s.id === 'noticias'));
  assert.deepEqual(publica.noticias, []);

  let r = await api('POST', `/admin/landing/versiones/${rows[0].numero}/restaurar`, undefined, tokenAdmin);
  assert.equal(r.status, 200);
  const borrador = (await api('GET', '/admin/landing', undefined, tokenAdmin)).body.data.borrador.contenido;
  r = await api('PUT', '/admin/landing/borrador', { contenido: borrador }, tokenAdmin);
  assert.equal(r.status, 200, JSON.stringify(r.body));
});
