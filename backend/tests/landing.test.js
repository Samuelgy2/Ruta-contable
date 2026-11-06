// Pruebas del módulo de landing (RF-088 a RF-097).
//
// La base es única (Supabase), así que las pruebas NO tocan el esquema `public`:
// crean un esquema temporal `test_<marca de tiempo>`, aplican ahí la migración de
// landing, corren todo con search_path apuntando solo a ese esquema y lo borran
// al terminar. Corre solo con confirmación explícita:
//
//   TEST_ESQUEMA_TEMPORAL=1 npm test
//
// Usa las variables DB_* del entorno o de backend/.env (puerto 5432 o conexión
// directa; el pooler en modo transacción, puerto 6543, no conserva search_path y
// se rechaza). Sin la confirmación, el archivo se omite.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const habilitado = process.env.TEST_ESQUEMA_TEMPORAL === '1';
if (!habilitado) {
  test('landing: omitido (define TEST_ESQUEMA_TEMPORAL=1 para correrlo en un esquema temporal)', { skip: true }, () => {});
  return;
}
if (!process.env.DB_HOST && !require('dotenv').config().parsed?.DB_HOST) {
  throw new Error('Faltan las variables DB_* (entorno o backend/.env).');
}
if (String(process.env.DB_PORT) === '6543') {
  throw new Error('El pooler en modo transacción (6543) no conserva search_path: usa el puerto 5432.');
}

// Nombre generado aquí, nunca recibido de fuera, y con forma fija: no puede ser `public`.
const ESQUEMA = `test_${Date.now()}`;
assert.match(ESQUEMA, /^test_[0-9]{13}$/);
process.env.JWT_SECRET = 'secreto-solo-para-pruebas-con-longitud-suficiente';

const express = require('express');
const pool = require('../db');
const { firmar } = require('../utils/jwt');
const { validarContenido, limpiarTexto } = require('../controllers/LandingController');

// Toda conexión del pool arranca con search_path = solo el esquema temporal; las
// consultas que se encolan después en esa misma conexión ya lo ven.
pool.on('connect', (cliente) => {
  cliente.query(`SET search_path TO ${ESQUEMA}, pg_temp`).catch((e) => {
    console.error('No se pudo fijar search_path:', e.message);
    process.exit(1);
  });
});

async function verificarAislamiento() {
  const { rows } = await pool.query('SELECT current_schemas(false) AS s');
  assert.deepEqual(rows[0].s, [ESQUEMA], 'search_path debe apuntar solo al esquema temporal');
}

const migracion = (sufijo) => fs.readFileSync(path.join(__dirname, '..', 'migrations', `20261028_landing.${sufijo}.sql`), 'utf8');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

let base, servidor, tokenAdmin, tokenSocio, semilla;

async function api(metodo, ruta, { token, json, cuerpo, tipo } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  if (tipo) headers['Content-Type'] = tipo;
  const res = await fetch(base + ruta, { method: metodo, headers, body: json !== undefined ? JSON.stringify(json) : cuerpo });
  const esJson = (res.headers.get('content-type') || '').includes('json');
  return { status: res.status, headers: res.headers, body: esJson ? await res.json() : Buffer.from(await res.arrayBuffer()) };
}

const conTexto = (contenido, id, cambios) => ({
  ...contenido,
  secciones: contenido.secciones.map(s => (s.id === id ? { ...s, ...cambios } : s)),
});

before(async () => {
  await pool.query(`CREATE SCHEMA ${ESQUEMA}`);
  await verificarAislamiento();
  // La migración de landing referencia users(id): se crea mínima, solo en el esquema temporal.
  await pool.query(`
    CREATE TABLE ${ESQUEMA}.users (
      id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL, full_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'user', active BOOLEAN DEFAULT true)`);
  await pool.query(migracion('up'));
  await pool.query(migracion('seed'));
  await verificarAislamiento();

  const crear = async (usuario, rol) => (await pool.query(
    `INSERT INTO users (username, password, email, full_name, role) VALUES ($1, 'x', $2, $3, $4)
     ON CONFLICT (username) DO UPDATE SET role = EXCLUDED.role, active = true RETURNING id`,
    [usuario, `${usuario}@prueba.test`, `Usuario ${usuario}`, rol])).rows[0].id;
  tokenAdmin = firmar({ id: await crear('admin_prueba', 'admin') });
  tokenSocio = firmar({ id: await crear('socio_prueba', 'user') });

  const app = express();
  app.use(express.json());
  app.use('/api/admin/landing', require('../routes/landingAdmin'));
  app.use('/api/landing', require('../routes/landing'));
  servidor = app.listen(0);
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor?.close();
  try {
    await verificarAislamiento();
    // El rollback de la migración debe borrar las tablas de landing del esquema temporal.
    await pool.query(migracion('down'));
    const quedan = await pool.query(`SELECT to_regclass('landing_version') AS t`);
    assert.equal(quedan.rows[0].t, null, 'el rollback debe borrar las tablas');
  } finally {
    // DROP SCHEMA con nombre calificado: independiente de search_path y solo toca el temporal.
    await pool.query(`DROP SCHEMA IF EXISTS ${ESQUEMA} CASCADE`);
    const resto = await pool.query('SELECT 1 FROM information_schema.schemata WHERE schema_name = $1', [ESQUEMA]);
    await pool.end();
    assert.equal(resto.rows.length, 0, 'el esquema temporal debe quedar borrado');
  }
});

test('sanitización: quita scripts, etiquetas y etiquetas partidas', () => {
  assert.equal(limpiarTexto('Hola <script>alert(1)</script>mundo'), 'Hola mundo');
  assert.equal(limpiarTexto('<b>negrita</b> <img src=x onerror=alert(1)>'), 'negrita');
  assert.doesNotMatch(limpiarTexto('<scr<b>ipt>alert(1)</script>'), /<\s*\/?\s*script/i);
  assert.equal(limpiarTexto('<<b>script>alert(1)<</b>/script>'), '');
  assert.equal(limpiarTexto('Edad < 4 años'), 'Edad < 4 años');
});

test('validación de reglas de negocio', async () => {
  const c = (await api('GET', '/api/admin/landing', { token: tokenAdmin })).body.data.borrador.contenido;
  semilla = c;
  assert.deepEqual(validarContenido(c).errores, [], 'la semilla debe ser válida');

  const campos = (contenido) => validarContenido(contenido).errores.map(e => e.campo);
  assert.ok(campos(conTexto(c, 'club', { titulo: '  ' })).includes('secciones.club.titulo'));
  assert.ok(campos(conTexto(c, 'club', { titulo: 'x'.repeat(101) })).includes('secciones.club.titulo'));
  assert.deepEqual(campos(conTexto(c, 'club', { titulo: 'x'.repeat(100) })), []);
  assert.ok(campos(conTexto(c, 'club', { texto: 'x'.repeat(2001) })).includes('secciones.club.texto'));
  assert.ok(campos(conTexto(c, 'contacto', { visible: false })).includes('secciones.contacto.visible'));
  assert.ok(campos({ ...c, secciones: c.secciones.slice(1) }).includes('secciones'));
  assert.ok(campos({ ...c, contacto: { ...c.contacto, correo: 'no-es-correo' } }).includes('contacto.correo'));
  assert.ok(campos({ ...c, contacto: { ...c.contacto, telefono: '300-123' } }).includes('contacto.telefono'));
  assert.deepEqual(campos({ ...c, contacto: { ...c.contacto, telefono: '+57 300 123 4567' } }), []);
  for (const url of ['http://instagram.com/x', 'javascript:alert(1)', 'https//mal']) {
    assert.ok(campos({ ...c, contacto: { ...c.contacto, redes: [{ nombre: 'X', url }] } }).includes('contacto.redes.0.url'), url);
  }
});

test('control de acceso: 401 sin sesión, 403 sin rol admin, 200 admin, pública sin sesión', async () => {
  const rutas = [
    ['GET', '/api/admin/landing'], ['GET', '/api/admin/landing/borrador'], ['PUT', '/api/admin/landing/borrador'], ['POST', '/api/admin/landing/publicar'],
    ['GET', '/api/admin/landing/versiones'], ['POST', '/api/admin/landing/versiones/1/restaurar'],
    ['GET', '/api/admin/landing/imagenes'], ['POST', '/api/admin/landing/imagenes'],
    ['GET', '/api/admin/landing/imagenes/1/archivo'], ['DELETE', '/api/admin/landing/imagenes/1'],
  ];
  for (const [metodo, ruta] of rutas) {
    assert.equal((await api(metodo, ruta)).status, 401, `${metodo} ${ruta} sin sesión`);
    assert.equal((await api(metodo, ruta, { token: 'token-falso' })).status, 401, `${metodo} ${ruta} token inválido`);
    assert.equal((await api(metodo, ruta, { token: tokenSocio })).status, 403, `${metodo} ${ruta} rol user`);
  }
  assert.equal((await api('GET', '/api/admin/landing', { token: tokenAdmin })).status, 200);

  assert.equal((await api('GET', '/api/admin/landing/borrador', { token: tokenAdmin })).status, 200);

  // Sin versión publicada: contenido por defecto, válido e igual a la semilla.
  const publica = await api('GET', '/api/landing');
  assert.equal(publica.status, 200);
  assert.equal(publica.body.data.numero, null);
  assert.equal(publica.body.data.porDefecto, true);
  assert.deepEqual(validarContenido(publica.body.data.contenido).errores, []);
  assert.deepEqual(publica.body.data.contenido, semilla);
});

test('flujo completo: borrador, imágenes, publicación, historial y restauración', async () => {
  // Guardar borrador sanitizado; no toca lo público.
  let r = await api('PUT', '/api/admin/landing/borrador', { token: tokenAdmin, json: { contenido: conTexto(semilla, 'club', { texto: 'Hola <script>alert(1)</script>club' }) } });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.contenido.secciones.find(s => s.id === 'club').texto, 'Hola club');
  assert.equal((await api('GET', '/api/landing')).body.data.porDefecto, true, 'guardar borrador no publica');

  r = await api('PUT', '/api/admin/landing/borrador', { token: tokenAdmin, json: { contenido: conTexto(semilla, 'club', { titulo: '' }) } });
  assert.equal(r.status, 400);
  assert.ok(r.body.errores.some(e => e.campo === 'secciones.club.titulo'));

  // Imágenes: tipo real, tamaño y texto alternativo.
  assert.equal((await api('POST', '/api/admin/landing/imagenes', { token: tokenAdmin, cuerpo: PNG, tipo: 'image/png' })).status, 400, 'sin alt');
  assert.equal((await api('POST', '/api/admin/landing/imagenes?alt=x', { token: tokenAdmin, cuerpo: Buffer.from('<svg onload=alert(1)>'), tipo: 'image/png' })).status, 415, 'bytes falsos');
  assert.equal((await api('POST', '/api/admin/landing/imagenes?alt=x', { token: tokenAdmin, cuerpo: Buffer.from('GIF89a'), tipo: 'image/gif' })).status, 415, 'gif');
  assert.equal((await api('POST', '/api/admin/landing/imagenes?alt=x', { token: tokenAdmin, cuerpo: Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]), tipo: 'image/png' })).status, 413, '> 2 MB');

  r = await api('POST', `/api/admin/landing/imagenes?alt=${encodeURIComponent('Podio <b>nacional</b>')}`, { token: tokenAdmin, cuerpo: PNG, tipo: 'image/png' });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.alt, 'Podio nacional');
  const img1 = r.body.data.id;

  // Publicar v1 con la imagen en la portada.
  let contenido = conTexto(semilla, 'inicio', { imagenes: [img1] });
  assert.equal((await api('PUT', '/api/admin/landing/borrador', { token: tokenAdmin, json: { contenido } })).status, 200);
  assert.equal((await api('DELETE', `/api/admin/landing/imagenes/${img1}`, { token: tokenAdmin })).status, 409, 'en uso en el borrador');
  assert.equal((await api('GET', `/api/landing/imagenes/${img1}`)).status, 404, 'aún no publicada');

  r = await api('POST', '/api/admin/landing/publicar', { token: tokenAdmin });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.numero, 1);
  assert.equal((await api('POST', '/api/admin/landing/publicar', { token: tokenAdmin })).status, 409, 'sin cambios');

  const publica = (await api('GET', '/api/landing')).body.data;
  assert.equal(publica.numero, 1);
  assert.deepEqual(publica.imagenes, [{ id: img1, alt: 'Podio nacional' }]);
  const archivo = await api('GET', `/api/landing/imagenes/${img1}`);
  assert.equal(archivo.status, 200);
  assert.equal(archivo.headers.get('content-type'), 'image/png');
  assert.ok(archivo.body.equals(PNG));

  // Reemplazar: no se borra la imagen publicada hasta publicar otra.
  assert.equal((await api('DELETE', `/api/admin/landing/imagenes/${img1}`, { token: tokenAdmin })).status, 409, 'en uso en la publicada');
  const img2 = (await api('POST', '/api/admin/landing/imagenes?alt=Partida', { token: tokenAdmin, cuerpo: PNG, tipo: 'image/png' })).body.data.id;
  contenido = conTexto(semilla, 'inicio', { imagenes: [img2] });
  await api('PUT', '/api/admin/landing/borrador', { token: tokenAdmin, json: { contenido } });
  assert.equal((await api('POST', '/api/admin/landing/publicar', { token: tokenAdmin })).body.data.numero, 2);
  assert.equal((await api('DELETE', `/api/admin/landing/imagenes/${img1}`, { token: tokenAdmin })).status, 200);

  // Restaurar v1: queda como borrador, lo público sigue en v2, y no publica
  // porque la imagen de v1 ya no existe.
  assert.equal((await api('POST', '/api/admin/landing/versiones/1/restaurar', { token: tokenAdmin })).status, 200);
  const estado = (await api('GET', '/api/admin/landing', { token: tokenAdmin })).body.data;
  assert.deepEqual(estado.borrador.contenido.secciones.find(s => s.id === 'inicio').imagenes, [img1]);
  assert.equal(estado.publicado.numero, 2);
  assert.equal(estado.cambiosSinPublicar, true);
  assert.equal(estado.borrador.actualizadoPor, 'Usuario admin_prueba');
  r = await api('POST', '/api/admin/landing/publicar', { token: tokenAdmin });
  assert.equal(r.status, 400);
  assert.match(r.body.errores[0].mensaje, /ya no existe/);
  assert.equal((await api('POST', '/api/admin/landing/versiones/99/restaurar', { token: tokenAdmin })).status, 404);

  // Ocultar y reordenar se respeta tal cual en lo publicado.
  const reordenado = { ...contenido, secciones: [...contenido.secciones].reverse().map(s => (s.id === 'cifras' ? { ...s, visible: false } : s)) };
  await api('PUT', '/api/admin/landing/borrador', { token: tokenAdmin, json: { contenido: reordenado } });
  await api('POST', '/api/admin/landing/publicar', { token: tokenAdmin });
  const secciones = (await api('GET', '/api/landing')).body.data.contenido.secciones;
  assert.equal(secciones[0].id, 'contacto');
  assert.equal(secciones.find(s => s.id === 'cifras').visible, false);
});

test('historial conserva al menos 10 versiones', async () => {
  for (let i = 0; i < 10; i++) {
    await api('PUT', '/api/admin/landing/borrador', { token: tokenAdmin, json: { contenido: conTexto(semilla, 'club', { texto: `Versión de prueba ${i}` }) } });
    assert.equal((await api('POST', '/api/admin/landing/publicar', { token: tokenAdmin })).status, 201);
  }
  const versiones = (await api('GET', '/api/admin/landing/versiones', { token: tokenAdmin })).body.data;
  assert.equal(versiones.length, 13);
  assert.equal(versiones[0].actual, true);
  assert.equal(versiones[0].numero, 13);
});

test('auditoría registra modificaciones y publicaciones con su usuario', async () => {
  const { rows } = await pool.query(`
    SELECT a.accion, COUNT(*)::int AS n FROM auditoria a JOIN users u ON u.id = a.usuario_id
     WHERE a.entidad = 'landing' AND u.username = 'admin_prueba' GROUP BY a.accion`);
  const n = Object.fromEntries(rows.map(r => [r.accion, r.n]));
  assert.equal(n.publicar, 13);
  assert.equal(n.subir_imagen, 2);
  assert.equal(n.eliminar_imagen, 1);
  assert.equal(n.restaurar_version, 1);
  assert.ok(n.guardar_borrador >= 14);
});
