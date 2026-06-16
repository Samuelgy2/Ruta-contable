const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = require('../db'); // ← pool centralizado, mismo que usa auth.js

const app = express();
const port = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES GLOBALES — deben ir PRIMERO
// ============================================
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ============================================
// RUTAS — van DESPUÉS de los middlewares
// ============================================

const socioRoutes = require('../routes/Member');
app.use('/api/socios', socioRoutes);

// ============================================
// RATE LIMITING para login
// ============================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// UTILIDADES
// ============================================
function validateInput(username, password) {
  const errors = [];
  if (!username || username.trim() === '') errors.push('El usuario es requerido');
  if (!password || password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');
  if (username && username.length > 50) errors.push('El usuario no puede tener más de 50 caracteres');
  if (password && password.length > 100) errors.push('La contraseña no puede tener más de 100 caracteres');
  return errors;
}

function logFailedAttempt(username, ip, reason) {
  const logEntry = `${new Date().toISOString()} | IP: ${ip} | Usuario: ${username} | Razón: ${reason}\n`;
  const logPath = path.join(__dirname, '../logs/security.log');
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logPath, logEntry);
}

// ============================================
// SETUP DE BASE DE DATOS
// ============================================
async function setupDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla users lista');

    const adminExists = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.query(
        `INSERT INTO users (username, password, email, full_name, role, active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['admin', hashedPassword, 'admin@rutacontable.com', 'Administrador', 'admin', true]
      );
      console.log('✅ Usuario admin creado (admin / admin123)');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS socio (
        id_socio SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        documento VARCHAR(50) UNIQUE NOT NULL,
        tipo_documento VARCHAR(10) DEFAULT 'CC',
        email VARCHAR(100),
        telefono VARCHAR(30),
        direccion TEXT,
        fecha_nacimiento DATE,
        fecha_ingreso DATE NOT NULL,
        tipo_membresia VARCHAR(50) DEFAULT 'Básica',
        estado VARCHAR(20) DEFAULT 'activo',
        foto TEXT,
        observaciones TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla socio lista');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_socio_documento ON socio(documento)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_socio_nombre ON socio(nombre)
    `);
    console.log('✅ Índices de socio creados');
  } catch (error) {
    console.error('Error en setup:', error.message);
  }
}

// ============================================
// LOGIN
// ============================================
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    const errors = validateInput(username, password);
    if (errors.length > 0) {
      logFailedAttempt(username, clientIp, 'Validación fallida');
      return res.status(400).json({ success: false, message: 'Error de validación', errors });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      logFailedAttempt(username, clientIp, 'Usuario no encontrado');
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await pool.query(
        'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
        [newAttempts, lockedUntil, user.id]
      );
      logFailedAttempt(username, clientIp, `Contraseña incorrecta (intento ${newAttempts}/5)`);
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }

    await pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    // ⚠️ Sin issuer/audience para que coincida con lo que verifica auth.js
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('✅ Login exitoso:', user.username);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.full_name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

app.get('/api/enana', (req, res) => {
  res.json({ status: 'OK', message: 'Ruta de prueba funcionando' });
});

// ============================================
// INICIAR
// ============================================
async function start() {
  await setupDatabase();
  app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`🚀 RUTA CONTABLE - BACKEND`);
    console.log(`========================================`);
    console.log(`📡 Servidor:   http://localhost:${port}`);
    console.log(`🔐 Login:      POST /api/auth/login`);
    console.log(`👥 Socios:     /api/socios`);
    console.log(`🏥 Health:     /health`);
    console.log(`========================================\n`);
  });
}

start();