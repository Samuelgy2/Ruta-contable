const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { firmar, verificar } = require('../utils/jwt');
const rateLimit = require('express-rate-limit');

const pool = require('../db');                               // raíz/db.js
const { validateInput, logFailedAttempt } = require('../utils/helpers'); // raíz/utils/helpers.js
const authController = require('../controllers/AuthController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Más estricto que el límite general: evita la creación masiva de cuentas.
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Demasiados registros desde esta dirección. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, authController.register);

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    const errors = validateInput(username, password);
    if (errors.length > 0) {
      logFailedAttempt(username, clientIp, 'Validación fallida');
      return res.status(400).json({ success: false, message: 'Error de validación', errors });
    }

    // El bloqueo se calcula en la base (LOCALTIMESTAMP), con el mismo reloj con
    // el que se escribe locked_until, para no depender de la zona horaria del servidor.
    const result = await pool.query(
      `SELECT *,
              (locked_until IS NOT NULL AND locked_until >  LOCALTIMESTAMP) AS bloqueado,
              (locked_until IS NOT NULL AND locked_until <= LOCALTIMESTAMP) AS bloqueo_vencido
         FROM users WHERE username = $1 OR email = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      logFailedAttempt(username, clientIp, 'Usuario no encontrado');
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    const user = result.rows[0];

    if (user.bloqueado) {
      logFailedAttempt(username, clientIp, 'Cuenta bloqueada por intentos fallidos');
      return res.status(429).json({
        success: false,
        message: 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en 15 minutos.',
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      // Si el bloqueo ya venció, la cuenta empieza de cero; si no, un solo fallo
      // más la volvería a bloquear al instante.
      const intentosPrevios = user.bloqueo_vencido ? 0 : (user.failed_attempts || 0);
      const newAttempts = intentosPrevios + 1;

      await pool.query(
        `UPDATE users
            SET failed_attempts = $1,
                locked_until = CASE WHEN $1 >= 5 THEN LOCALTIMESTAMP + INTERVAL '15 minutes' ELSE NULL END
          WHERE id = $2`,
        [newAttempts, user.id]
      );

      logFailedAttempt(username, clientIp, `Contraseña incorrecta (intento ${newAttempts}/5)`);
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    // La cuenta desactivada no entra aunque la clave sea correcta.
    if (!user.active) {
      logFailedAttempt(username, clientIp, 'Usuario inactivo');
      return res.status(403).json({ success: false, message: 'Usuario inactivo' });
    }

    await pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    const token = firmar({ id: user.id, username: user.username, role: user.role });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: { id: user.id, username: user.username, name: user.full_name, email: user.email, role: user.role },
        token
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verificar(token);
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].active) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: { id: user.id, username: user.username, name: user.full_name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    console.error('❌ Error en verify:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;