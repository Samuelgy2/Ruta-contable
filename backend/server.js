require('dotenv').config();


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');

const pool = require('./db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const forgotPasswordRoutes = require('./routes/forgotPassword');

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', forgotPasswordRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK', message: 'Servidor funcionando' }));

// Setup inicial de la DB
async function setupDatabase() {
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
  await pool.query(`
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
`);

  const adminExists = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
  if (adminExists.rows.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await pool.query(
      'INSERT INTO users (username, password, email, full_name, role, active) VALUES ($1, $2, $3, $4, $5, $6)',
      ['admin', hashedPassword, 'admin@rutacontable.com', 'Administrador', 'admin', true]
    );
    console.log('✅ Usuario admin creado');
  }
}

async function start() {
  await setupDatabase();
  app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  });
}

start();    