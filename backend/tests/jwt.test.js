// Pruebas de utils/jwt.js: no usan base de datos ni red.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { firmar, verificar, EMISOR, AUDIENCIA } = require('../utils/jwt');

beforeEach(() => {
  process.env.JWT_SECRET = 'secreto-solo-para-pruebas-con-longitud-suficiente';
});

test('firmar y verificar devuelven el payload con emisor y audiencia', () => {
  const decodificado = verificar(firmar({ id: 7, role: 'admin' }));
  assert.equal(decodificado.id, 7);
  assert.equal(decodificado.role, 'admin');
  assert.equal(decodificado.iss, EMISOR);
  assert.equal(decodificado.aud, AUDIENCIA);
  assert.ok(decodificado.exp > decodificado.iat);
});

test('rechaza un token firmado con otro secreto', () => {
  const ajeno = jwt.sign({ id: 1 }, 'otro-secreto', { issuer: EMISOR, audience: AUDIENCIA });
  assert.throws(() => verificar(ajeno), { name: 'JsonWebTokenError' });
});

test('rechaza un token sin emisor o con emisor/audiencia distintos', () => {
  const secreto = process.env.JWT_SECRET;
  assert.throws(() => verificar(jwt.sign({ id: 1 }, secreto)), { name: 'JsonWebTokenError' });
  assert.throws(() => verificar(jwt.sign({ id: 1 }, secreto, { issuer: 'otro', audience: AUDIENCIA })), { name: 'JsonWebTokenError' });
  assert.throws(() => verificar(jwt.sign({ id: 1 }, secreto, { issuer: EMISOR, audience: 'otro' })), { name: 'JsonWebTokenError' });
});

test('rechaza el algoritmo "none" y algoritmos HMAC distintos de HS256', () => {
  const sinFirma = jwt.sign({ id: 1 }, '', { algorithm: 'none', issuer: EMISOR, audience: AUDIENCIA });
  assert.throws(() => verificar(sinFirma), { name: 'JsonWebTokenError' });
  const hs512 = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { algorithm: 'HS512', issuer: EMISOR, audience: AUDIENCIA });
  assert.throws(() => verificar(hs512), { name: 'JsonWebTokenError' });
});

test('rechaza un token vencido', () => {
  const vencido = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: -10, issuer: EMISOR, audience: AUDIENCIA });
  assert.throws(() => verificar(vencido), { name: 'TokenExpiredError' });
});

test('sin JWT_SECRET no se puede firmar', () => {
  delete process.env.JWT_SECRET;
  assert.throws(() => firmar({ id: 1 }));
});
