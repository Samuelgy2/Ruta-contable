require('dotenv').config();
const dns = require('dns').promises;

(async () => {
  // ── Resolver IP de Supabase antes de cualquier require de BD ──────────
  try {
    const result = await dns.lookup(process.env.DB_HOST, { family: 4 });
    process.env.DB_HOST_IP = result.address;
    console.log(`✅ IP de BD resuelta: ${process.env.DB_HOST_IP}`);
  } catch (e) {
    console.error('❌ No se pudo resolver IP, usando hostname original', e.message);
    process.env.DB_HOST_IP = process.env.DB_HOST;
  }

  // ── Ahora cargar el resto del servidor ─────────────────────────────────
  const express = require('express');
  const cors    = require('cors');
  const helmet  = require('helmet');
  const bcrypt  = require('bcryptjs');

  const pool           = require('./db');
  const authRoutes         = require('./routes/auth');
  const usersRoutes        = require('./routes/users');
  const forgotPasswordRoutes = require('./routes/forgotPassword');
  const socioRoutes        = require('./routes/Member');
  const adminRoutes        = require('./routes/admin');
  const transactionRoutes  = require('./routes/Transaction');

  const app  = express();
  const port = process.env.PORT || 3001;

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(cors({
    origin:         allowedOrigins,
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // ─── Rutas ────────────────────────────────────────────────────────────
  app.use('/api/auth',         authRoutes);
  app.use('/api/users',        usersRoutes);
  app.use('/api/auth',         forgotPasswordRoutes);
  app.use('/api/socios',       socioRoutes);
  app.use('/api/admin',        adminRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.get('/health', (_req, res) => res.json({ status: 'OK', message: 'Servidor funcionando' }));

  // ─── Setup DB ─────────────────────────────────────────────────────────
  async function setupDatabase() {
    // ── users ──────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id              SERIAL PRIMARY KEY,
        username        VARCHAR(50)  UNIQUE NOT NULL,
        password        VARCHAR(255) NOT NULL,
        email           VARCHAR(100) UNIQUE NOT NULL,
        full_name       VARCHAR(100) NOT NULL,
        role            VARCHAR(20)  DEFAULT 'user',
        active          BOOLEAN      DEFAULT true,
        failed_attempts INTEGER      DEFAULT 0,
        locked_until    TIMESTAMP,
        created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_token         VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP,
        ADD COLUMN IF NOT EXISTS last_login          TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS otp_attempts        INTEGER DEFAULT 0
    `);

    // Admin por defecto
    const adminExists = await pool.query(
      'SELECT id FROM users WHERE username = $1', ['admin']
    );
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.query(
        'INSERT INTO users (username, password, email, full_name, role, active) VALUES ($1,$2,$3,$4,$5,$6)',
        ['admin', hashedPassword, 'admin@rutacontable.com', 'Administrador', 'admin', true]
      );
      console.log('✅ Usuario admin creado');
    }

    // ── socio ──────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS socio (
        id_socio         SERIAL PRIMARY KEY,
        nombre           VARCHAR(200) NOT NULL,
        documento        VARCHAR(50)  UNIQUE NOT NULL,
        tipo_documento   VARCHAR(10)  DEFAULT 'CC',
        email            VARCHAR(100),
        telefono         VARCHAR(30),
        direccion        TEXT,
        fecha_nacimiento DATE,
        fecha_ingreso    DATE NOT NULL,
        tipo_membresia   VARCHAR(50)  DEFAULT 'Básica',
        estado           VARCHAR(20)  DEFAULT 'activo',
        foto             TEXT,
        observaciones    TEXT,
        created_by       INTEGER REFERENCES users(id),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_socio_documento ON socio(documento)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_socio_nombre    ON socio(nombre)`);
    console.log('✅ Tabla socio lista');

    // ── transactions ───────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id          SERIAL PRIMARY KEY,
        tipo        VARCHAR(20)     NOT NULL,
        monto       DECIMAL(15,2)   NOT NULL,
        fecha       DATE            NOT NULL,
        descripcion TEXT,
        categoria   VARCHAR(100),
        metodo_pago VARCHAR(50),
        creado_por  VARCHAR(100),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla transactions lista');

    // ── periodos (Corregida a snake_case e incluyendo campos financieros) ─────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS periodos (
        id             SERIAL PRIMARY KEY,
        anio           INTEGER      NOT NULL,
        mes            INTEGER      NOT NULL CHECK (mes BETWEEN 1 AND 12),
        nombre_mes     VARCHAR(20)  NOT NULL DEFAULT '',
        fecha_inicio   DATE,
        fecha_fin      DATE,
        activo         BOOLEAN      NOT NULL DEFAULT true,
        cerrado        BOOLEAN      NOT NULL DEFAULT false,
        fecha_cierre   TIMESTAMP,
        total_ingresos DECIMAL(15,2) DEFAULT 0.00,
        total_gastos   DECIMAL(15,2) DEFAULT 0.00,
        balance        DECIMAL(15,2) DEFAULT 0.00,
        observaciones  TEXT,
        cerrado_by     VARCHAR(100),
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (anio, mes)
      )
    `);
    
    // Migración segura en caso de que la tabla ya existiera con estructura vieja
    await pool.query(`
      ALTER TABLE periodos
        ADD COLUMN IF NOT EXISTS nombre_mes     VARCHAR(20)  NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS fecha_inicio   DATE,
        ADD COLUMN IF NOT EXISTS fecha_fin      DATE,
        ADD COLUMN IF NOT EXISTS fecha_cierre   TIMESTAMP,
        ADD COLUMN IF NOT EXISTS total_ingresos DECIMAL(15,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS total_gastos   DECIMAL(15,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS balance        DECIMAL(15,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS cerrado_by     VARCHAR(100);
    `);
    console.log('✅ Tabla periodos lista y verificada');
  }

  // ─── Cron cierre mensual automático ──────────────────────────────────
  try {
    const cron = require('node-cron');

    const MONTH_NAMES = [
      'enero','febrero','marzo','abril','mayo','junio',
      'julio','agosto','septiembre','octubre','noviembre','diciembre'
    ];

    async function runMonthlyClose() {
      try {
        const now      = new Date();
        const monthNum = now.getMonth() === 0 ? 12 : now.getMonth();
        const yearNum  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const monthName = MONTH_NAMES[monthNum - 1];

        const [inc, exp] = await Promise.all([
          pool.query(
            `SELECT COALESCE(SUM(monto),0) AS total FROM transactions
             WHERE tipo = 'ingreso' AND EXTRACT(MONTH FROM fecha)=$1 AND EXTRACT(YEAR FROM fecha)=$2`,
            [monthNum, yearNum]
          ),
          pool.query(
            `SELECT COALESCE(SUM(monto),0) AS total FROM transactions
             WHERE tipo = 'gasto' AND EXTRACT(MONTH FROM fecha)=$1 AND EXTRACT(YEAR FROM fecha)=$2`,
            [monthNum, yearNum]
          ),
        ]);

        const totalIngresos = parseFloat(inc.rows[0].total);
        const totalGastos   = parseFloat(exp.rows[0].total);
        const balance       = totalIngresos - totalGastos;

        const admin = await pool.query(
          `SELECT username FROM users WHERE role = 'admin' LIMIT 1`
        );
        const adminName = admin.rows[0]?.username || 'sistema';

        const ultimoDiaMes = new Date(yearNum, monthNum, 0).getDate();
        const fechaInicio = `${yearNum}-${String(monthNum).padStart(2,'0')}-01`;
        const fechaFin    = `${yearNum}-${String(monthNum).padStart(2,'0')}-${String(ultimoDiaMes).padStart(2,'0')}`;

        await pool.query(
          `INSERT INTO periodos
             (anio, mes, nombre_mes, fecha_inicio, fecha_fin, activo, cerrado, fecha_cierre, 
              total_ingresos, total_gastos, balance, observaciones, cerrado_by)
           VALUES ($1,$2,$3,$4,$5,false,true,NOW(),$6,$7,$8,$9,$10)
           ON CONFLICT (anio, mes) DO UPDATE SET
             cerrado = true, fecha_cierre = NOW(),
             total_ingresos = $6, total_gastos = $7, balance = $8,
             observaciones = $9, cerrado_by = $10`,
          [
            yearNum, monthNum, monthName, fechaInicio, fechaFin,
            totalIngresos, totalGastos, balance,
            'Cierre automático por el sistema', adminName,
          ]
        );

        console.log(`✅ Cierre automático ejecutado con éxito: ${monthName} ${yearNum}`);
      } catch (err) {
        console.error('❌ Error en cierre automático:', err.message);
      }
    }

    cron.schedule('15 0 1 * *', runMonthlyClose, {
      scheduled: true,
      timezone: 'America/Bogota',
    });
    console.log('⏰ Cron de cierre mensual programado (día 1, 00:15 COT)');

  } catch {
    console.log('ℹ️  node-cron no instalado — cierre automático desactivado');
    console.log('   Instálalo con: npm install node-cron');
  }

  // ─── Health check periódico para mantener conexiones vivas ─────────────
  setInterval(async () => {
    try {
      await pool.query('SELECT 1');
      console.log('✅ Health check DB: conexión activa');
    } catch (err) {
      console.error('❌ Health check DB falló:', err.message);
    }
  }, 15000);  // Cada 15 segundos

  // ─── Inicio del servidor ─────────────────────────────────────────────
  async function start() {
    await setupDatabase();
    app.listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    });
  }

  start();
})();