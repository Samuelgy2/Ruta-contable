// Firma y verificación de JWT en un solo lugar, para que ninguna ruta verifique
// con opciones distintas. El secreto sale de JWT_SECRET en cada llamada.
const jwt = require('jsonwebtoken');

const ALGORITMO = 'HS256';
const EMISOR = 'ruta-contable-api';
const AUDIENCIA = 'ruta-contable-frontend';
const EXPIRACION = '1d';

function firmar(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: ALGORITMO,
    expiresIn: EXPIRACION,
    issuer: EMISOR,
    audience: AUDIENCIA,
  });
}

// Lanza JsonWebTokenError / TokenExpiredError si el token no es válido.
function verificar(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: [ALGORITMO],
    issuer: EMISOR,
    audience: AUDIENCIA,
  });
}

module.exports = { firmar, verificar, ALGORITMO, EMISOR, AUDIENCIA, EXPIRACION };
