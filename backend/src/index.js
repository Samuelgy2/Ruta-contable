const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// Helmet para headers de seguridad
app.use(helmet());

// CORS estricto
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rate limiting para login (10 intentos en 15 minutos)
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
// FUNCIONES DE UTILIDAD
// ============================================

// Validación de inputs
function validateInput(username, password) {
  const errors = [];
  if (!username || username.trim() === '') {
    errors.push('El usuario es requerido');
  }
  if (!password || password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  if (username && username.length > 50) {
    errors.push('El usuario no puede tener más de 50 caracteres');
  }
  if (password && password.length > 100) {
    errors.push('La contraseña no puede tener más de 100 caracteres');
  }
  return errors;
}

// Logging de intentos fallidos
function logFailedAttempt(username, ip, reason) {
  const logEntry = `${new Date().toISOString()} | IP: ${ip} | Usuario: ${username} | Razón: ${reason}\n`;
  const logPath = path.join(__dirname, '../logs/security.log');
  
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(logPath, logEntry);
}

// ============================================
// CONEXIÓN A POSTGRESQL
// ============================================

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ============================================
// SETUP DE BASE DE DATOS
// ============================================

async function setupDatabase() {
  try {
    // Crear tabla users con campos de seguridad
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

    // Crear/actualizar usuario admin con rounds=12
    const adminExists = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    if (adminExists.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (username, password, email, full_name, role, active) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['admin', hashedPassword, 'admin@rutacontable.com', 'Administrador', 'admin', true]
      );
      console.log('✅ Usuario admin creado (admin / admin123)');
    }

  } catch (error) {
    console.error('Error en setup:', error.message);
  }
}

// ============================================
// RUTA DE LOGIN (CON SEGURIDAD)
// ============================================

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    console.log('📝 Intento de login:', { username, ip: clientIp });

    // 1. Validar inputs
    const errors = validateInput(username, password);
    console.log(errors)
    if (errors.length > 0) {
      logFailedAttempt(username, clientIp, 'Validación fallida');
      return res.status(400).json({ 
        success: false, 
        message: 'Error de validación',
        errors 
      });
    }

    // 2. Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    console.log(result)

    if (result.rows.length === 0) {
      logFailedAttempt(username, clientIp, 'Usuario no encontrado');
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario o contraseña incorrectos' 
      });
    }

    const user = result.rows[0];

    // ============================================
    // 3. Verificar si cuenta está bloqueada
    // ============================================

    // if (user.locked_until && new Date() < new Date(user.locked_until)) {
    //   logFailedAttempt(username, clientIp, 'Cuenta bloqueada');
    //   return res.status(423).json({ 
    //     success: false, 
    //     message: `Cuenta bloqueada. Intenta después de ${new Date(user.locked_until).toLocaleTimeString()}` 
    //   });
    // }
    
    // 4. Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password);
    let enana = await bcrypt.hash(password, 10)
    console.log(enana)
    console.log('Userpasword: ' + user.password)
    console.log('🔑 Contraseña válida:', isValid);

    if (!isValid) {
      // Incrementar intentos fallidos
      const newAttempts = (user.failed_attempts || 0) + 1;
      let lockedUntil = null;
      
    //   // Bloquear después de 5 intentos fallidos
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      }
      
      await pool.query(
        `UPDATE users SET 
          failed_attempts = $1, 
          locked_until = $2 
         WHERE id = $3`,
        [newAttempts, lockedUntil, user.id]
      );
      
      logFailedAttempt(username, clientIp, `Contraseña incorrecta (intento ${newAttempts}/5)`);

      return res.status(401).json({ 
        success: false, 
        message: 'Usuario o contraseña incorrectos' 
      });
    }

    // // 5. Resetear intentos fallidos
    await pool.query(
      `UPDATE users SET 
        failed_attempts = 0, 
        locked_until = NULL 
       WHERE id = $1`,
      [user.id]
    );

    // 6. Generar JWT seguro
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '1d',
        issuer: 'ruta-contable-api',
        audience: 'ruta-contable-frontend'
      }
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
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// ============================================
// RUTA DE HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

app.get('/api/enana', (req, res) => {
  res.json({ status: 'OK', message: 'Ruta de prueba funcionando' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

async function start() {
  await setupDatabase();
  app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`🚀 RUTA CONTABLE - BACKEND SEGURO`);
    console.log(`========================================`);
    console.log(`📡 Servidor: http://localhost:${port}`);
    console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
    console.log(`🏥 Health: http://localhost:${port}/health`);
    console.log(`🧪 Enana: http://localhost:${port}/api/enana`);
    console.log(`\n🔒 Medidas de seguridad activadas:`);
    console.log(`   • bcrypt rounds: 10`);
    console.log(`   • Rate limiting: 5 intentos/15min`);
    console.log(`   • Bloqueo de cuenta: después de 5 fallos`);
    console.log(`   • JWT expiración: 1 día`);
    console.log(`   • Helmet headers activados`);
    console.log(`   • Validación de inputs`);
    console.log(`   • Logging de intentos fallidos`);
    console.log(`========================================\n`);
  });
}

start();