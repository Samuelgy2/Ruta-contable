const jwt = require('jsonwebtoken');
const pool = require('../db');

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

module.exports = { requireAdmin };