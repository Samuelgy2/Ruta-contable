const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();
const { pool } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS DE LA API
// ============================================

// Health Check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, version() as pg_version');
    res.json({
      status: 'OK',
      timestamp: result.rows[0].time,
      database: 'PostgreSQL',
      version: result.rows[0].pg_version,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    name: 'Ruta Contable API',
    version: '1.0.0',
    description: 'API Backend para Sistema Contable',
    endpoints: {
      health: 'GET /health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        verify: 'GET /api/auth/verify'
      }
    }
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// ============================================
// INICIALIZAR BASE DE DATOS
// ============================================

async function initializeDatabase() {
  try {
    // Tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla users creada/verificada');

    // Insertar usuario admin por defecto
    const adminExists = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@rutacontable.com']);
    
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, $4)`,
        ['Administrador', 'admin@rutacontable.com', hashedPassword, 'admin']
      );
      console.log('✅ Usuario admin creado (email: admin@rutacontable.com, password: admin123)');
    }

    // Tabla de productos (opcional)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla products creada/verificada');

  } catch (error) {
    console.error('Error inicializando base de datos:', error.message);
  }
}

// ============================================
// INICIAR SERVIDOR
// ============================================

async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 RUTA CONTABLE - BACKEND');
      console.log('='.repeat(50));
      console.log(`📡 Servidor: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();

