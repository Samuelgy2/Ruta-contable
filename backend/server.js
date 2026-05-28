require('dotenv').config();


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');

const pool = require('./db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const forgotPasswordRoutes = require('./routes/forgotPassword');
const socioRoutes = require('./routes/Member');
const adminRoutes = require('./routes/admin');
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
app.use('/api/socios', socioRoutes);
app.use('/api/admin', adminRoutes); 

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

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_socio_documento ON socio(documento)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_socio_nombre ON socio(nombre)`);
  console.log('✅ Tabla socio lista');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      tipo VARCHAR(20) NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      fecha DATE NOT NULL,
      descripcion TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabla transactions lista');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS periodos (
      id SERIAL PRIMARY KEY,
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      nombreMes VARCHAR(20),
      fechaInicio DATE,
      fechaFin DATE,
      activo BOOLEAN DEFAULT true,
      cerrado BOOLEAN DEFAULT false,
      fechaCierre TIMESTAMP,
      observaciones TEXT,
      cerradoBy VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(anio, mes)
    )
  `);
  console.log('✅ Tabla periodos lista');
}

// ─── JOB DE CIERRE AUTOMÁTICO MENSUAL ───────────────────────────────────
const cron = require('node-cron');

async function runMonthlyClose() {
  try {
    const now = new Date();
    const prevMonth = now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const monthNum = prevMonth === 0 ? 12 : prevMonth;
    const yearNum = prevMonth === 0 ? prevYear + 1 : prevYear;
    
    const monthName = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][monthNum - 1];
    
    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM transactions WHERE tipo = 'ingreso' AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
      [monthNum, yearNum]
    );
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM transactions WHERE tipo = 'gasto' AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
      [monthNum, yearNum]
    );
    
    const ingresos = Number(incomeResult.rows[0].total);
    const gastos = Number(expenseResult.rows[0].total);
    
    // Buscar admin para cerrar
    const admin = await pool.query('SELECT username FROM users WHERE role = \'admin\' LIMIT 1');
    const adminName = admin.rows[0]?.username || 'sistema';
    
    await pool.query(
      `INSERT INTO periodos (anio, mes, nombreMes, fechaInicio, fechaFin, activo, cerrado, fechaCierre, observaciones, cerradoBy)
       VALUES ($1, $2, $3, $4, $5, false, true, NOW(), $6, $7)
       ON CONFLICT (anio, mes) DO UPDATE SET
         cerrado = true,
         fechaCierre = NOW()
       RETURNING *`,
      [yearNum, monthNum, monthName, `${yearNum}-${String(monthNum).padStart(2, '0')}-01`, `${yearNum}-${String(monthNum).padStart(2, '0')}-31`, 'Cierre automático', adminName]
    );
    
    console.log(`✅ Cierre automático completado para ${monthName} ${yearNum}`);
  } catch (err) {
    console.error('Error en cierre automático:', err);
  }
}

// Programar cierre el día 1 de cada mes a las 00:15
cron.schedule('15 0 1 * *', runMonthlyClose, {
  scheduled: true,
  timezone: 'America/Bogota'
});

console.log('⏰ Job de cierre mensual programado (1 de cada mes, 00:15)');

async function start() {
  await setupDatabase();
  app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  });
}

start();    