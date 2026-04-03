const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ============================================
// CREAR TABLA Y USUARIO ADMIN AUTOMÁTICAMENTE
// ============================================
async function setupDatabase() {
  try {
    // Crear tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla users lista');

    // Verificar si existe el admin
    const adminExists = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (adminExists.rows.length === 0) {
      // Crear admin con contraseña admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (username, password, email, full_name, role, active) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['admin', hashedPassword, 'admin@rutacontable.com', 'Administrador', 'admin', true]
      );
      console.log('✅ Usuario admin creado (admin / admin123)');
    } else {
      // Actualizar la contraseña del admin existente
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, 'admin']);
      console.log('✅ Contraseña de admin actualizada');
    }

  } catch (error) {
    console.error('Error en setup:', error.message);
  }
}

// ============================================
// RUTA DE LOGIN
// ============================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('📝 Login:', { username, password });

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    
    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Contraseña válida:', isValid);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Iniciar servidor
async function start() {
  await setupDatabase();
  app.listen(port, () => {
    console.log(`\n🚀 Servidor en http://localhost:${port}`);
    console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
    console.log(`🏥 Health: http://localhost:${port}/health\n`);
  });
}

start();