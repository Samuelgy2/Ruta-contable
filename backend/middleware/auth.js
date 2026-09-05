const jwt = require('jsonwebtoken');
const pool = require('../db');

// Consulta de la sesión: sólo columnas de users. El perfil (socio_perfil o
// admin_perfil) se consulta donde haga falta, no en cada petición.
const CONSULTA_SESION = `
  SELECT id, username, email, full_name, role, active
    FROM users
   WHERE id = $1
`;

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, username, role, active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const user = result.rows[0];

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Se requiere rol de administrador.' 
      });
    }

    if (!user.active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario inactivo' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido o expirado' 
      });
    }
    console.error('Error en requireAdmin:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
}

// Valida la sesión sin exigir ningún rol concreto. Deja el usuario en req.user.
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(CONSULTA_SESION, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    console.error('Error en requireAuth:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Valida la sesión y además exige que el rol esté en la lista recibida.
function requireRole(...roles) {
  const permitidos = roles.flat();

  return function (req, res, next) {
    requireAuth(req, res, (error) => {
      if (error) {
        return next(error);
      }

      // requireAuth ya respondió (401 o 403) si la sesión no era válida.
      if (res.headersSent) {
        return;
      }

      if (!permitidos.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. No tienes permisos para esta operación.'
        });
      }

      next();
    });
  };
}

module.exports = { requireAdmin, requireAuth, requireRole };
