// Pruebas del módulo de landing (RF-088 a RF-097) contra una base de PRUEBAS.
//   TEST_DB_PASSWORD=... npm test
// Variables opcionales: TEST_DB_HOST (localhost), TEST_DB_PORT (5432),
// TEST_DB_USER (postgres), TEST_DB_NAME (ruta_contable_test).
// Se niega a correr si la base no es local o su nombre no termina en _test.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const host = process.env.TEST_DB_HOST || 'localhost';
const name = process.env.TEST_DB_NAME || 'ruta_contable_test';
if (!['localhost', '127.0.0.1'].includes(host) || !name.endsWith('_test')) {
  throw new Error(`Base de pruebas rechazada (${host}/${name}): debe ser local y terminar en _test.`);
}
// Se fijan antes de cargar db.js; dotenv no sobrescribe variables ya definidas.
Object.assign(process.env, {
  DB_HOST: host,
  DB_HOST_IP: host,
  DB_PORT: process.env.TEST_DB_PORT || '5432',
  DB_USER: process.env.TEST_DB_USER || 'postgres',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD || '',
  DB_NAME: name,
  DB_SSL: 'false',
  JWT_SECRET: 'secreto-solo-para-pruebas',
});

const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { validarContenido, limpiarTexto } = require('../controllers/LandingController');

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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL, full_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'user', active BOOLEAN DEFAULT true)`);
  await pool.query(migracion('down'));
  await pool.query(migracion('up'));
  await pool.query(migracion('seed'));

  const crear = async (usuario, rol) => (await pool.query(
    `INSERT INTO users (username, password, email, full_name, role) VALUES ($1, 'x', $2, $3, $4)
     ON CONFLICT (username) DO UPDATE SET role = EXCLUDED.role, active = true RETURNING id`,
    [usuario, `${usuario}@prueba.test`, `Usuario ${usuario}`, rol])).rows[0].id;
  tokenAdmin = jwt.sign({ id: await crear('admin_prueba', 'admin') }, process.env.JWT_SECRET);
  tokenSocio = jwt.sign({ id: await crear('socio_prueba', 'user') }, process.env.JWT_SECRET);

  const app = express();
  app.use(express.json());
  app.use('/api/admin/landing', require('../routes/landingAdmin'));
  app.use('/api/landing', require('../routes/landing'));
  servidor = app.listen(0);
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor?.close();
  await pool.query(migracion('down'));
  const quedan = await pool.query(`SELECT to_regclass('landing_version') AS t`);
  assert.equal(quedan.rows[0].t, null, 'el rollback debe borrar las tablas');
  // Deja la base lista para usarla a mano: migración y semilla de nuevo.
  await pool.query(migracion('up'));
  await pool.query(migracion('seed'));
  await pool.query(`DELETE FROM users WHERE username IN ('admin_prueba', 'socio_prueba')`);
  await pool.end();
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
