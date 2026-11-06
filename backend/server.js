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
  const express   = require('express');
  const cors      = require('cors');
  const helmet    = require('helmet');
  const rateLimit = require('express-rate-limit');

  const pool           = require('./db');
  const authRoutes         = require('./routes/auth');
  const usersRoutes        = require('./routes/users');
  const forgotPasswordRoutes = require('./routes/forgotPassword');
  const socioRoutes        = require('./routes/Member');
  const adminRoutes        = require('./routes/admin');
  const transactionRoutes  = require('./routes/Transaction');
  const proveedorRoutes    = require('./routes/proveedores');
  const compraRoutes       = require('./routes/compras');
  const inventarioRoutes   = require('./routes/inventario');
  const carteraRoutes      = require('./routes/cartera');
  const asistenciaRoutes   = require('./routes/asistencia');
  const periodoRoutes      = require('./routes/periodos');
  const pagoMensualRoutes  = require('./routes/pagosMensuales');
  const categoryRoutes     = require('./routes/categories');
  const clubDataRoutes     = require('./routes/clubData');
  const portalRoutes       = require('./routes/portal');
  const pagoRoutes         = require('./routes/pagos');
  const jerseyRoutes       = require('./routes/jersey');
  const landingRoutes      = require('./routes/landing');
  const landingAdminRoutes = require('./routes/landingAdmin');

  // ── Variables de entorno de PayPal ────────────────────────────────────
  // Se validan al arranque para fallar rápido y no descubrir el problema con
  // un pago a medias. Siempre sandbox.
  const VARIABLES_PAYPAL = [
    'PAYPAL_BASE_URL',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_WEBHOOK_ID',
  ];

  const faltantes = VARIABLES_PAYPAL.filter((nombre) => !process.env[nombre]);

  if (faltantes.length > 0) {
    console.error('❌ Faltan variables de entorno de PayPal:', faltantes.join(', '));
    console.error('   Añádelas a tu .env siguiendo la plantilla de .env.docker antes de arrancar.');
    process.exit(1);
  }

  if (!process.env.PAYPAL_BASE_URL.includes('sandbox')) {
    console.error('❌ La integración de pagos sólo debe usar el sandbox de PayPal.');
    console.error('   PAYPAL_BASE_URL debe apuntar a https://api-m.sandbox.paypal.com');
    process.exit(1);
  }

  // El JWT no puede firmarse sin secreto: mejor detenerse aquí que fallar en el primer login.
  if (!process.env.JWT_SECRET) {
    console.error('❌ Falta la variable de entorno JWT_SECRET.');
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET tiene menos de 32 caracteres: usa un secreto largo y aleatorio.');
  }

  const app  = express();
  const port = process.env.PORT || 3001;

  // Detrás de Render, Vercel o nginx la IP real llega en X-Forwarded-For. Sin esto
  // todos los clientes comparten la IP del proxy y los limitadores cuentan juntos.
  // TRUST_PROXY = número de proxies de confianza (0 para desactivar en local).
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

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

  // ─── Límite general de peticiones ─────────────────────────────────────
  // Sólo cubre /api: /health queda fuera para no romper los chequeos de estado.
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, message: 'Demasiadas peticiones. Intenta de nuevo en unos minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  // ─── Rutas ────────────────────────────────────────────────────────────
  app.use('/api/auth',         authRoutes);
  app.use('/api/users',        usersRoutes);
  app.use('/api/auth',         forgotPasswordRoutes);
  app.use('/api/socios',       socioRoutes);
  app.use('/api/admin/landing', landingAdminRoutes);
  app.use('/api/admin',        adminRoutes);
  app.use('/api/landing',      landingRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/proveedores',  proveedorRoutes);
  app.use('/api/compras',      compraRoutes);
  app.use('/api/inventario',   inventarioRoutes);
  app.use('/api/cartera',      carteraRoutes);
  app.use('/api/asistencia',   asistenciaRoutes);
  app.use('/api/periodos',        periodoRoutes);
  app.use('/api/pagos-mensuales', pagoMensualRoutes);
  app.use('/api/categories',      categoryRoutes);
  app.use('/api/club-data',       clubDataRoutes);
  app.use('/api/portal',          portalRoutes);
  app.use('/api/pagos',           pagoRoutes);
  app.use('/api/jersey',          jerseyRoutes);
  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'OK', message: 'Servidor funcionando', db: 'OK' });
    } catch (err) {
      console.error('❌ /health: la base de datos no responde:', err.message);
      res.status(503).json({ status: 'ERROR', message: 'Base de datos no disponible', db: 'ERROR' });
    }
  });

  // ─── Manejo global de errores ─────────────────────────────────────────
  // Express 5 envía aquí los errores de rutas async. No se filtra el detalle al cliente.
  app.use((err, req, res, _next) => {
    console.error(`❌ ${new Date().toISOString()} ${req.method} ${req.originalUrl}:`, err);
    if (res.headersSent) return;
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Error interno del servidor' : (err.message || 'Error en la solicitud'),
    });
  });

  process.on('unhandledRejection', (motivo) => {
    console.error(`❌ ${new Date().toISOString()} unhandledRejection:`, motivo);
  });
  process.on('uncaughtException', (err) => {
    console.error(`❌ ${new Date().toISOString()} uncaughtException:`, err);
    process.exit(1); // estado indefinido: que el orquestador (Render, Docker) reinicie el proceso
  });

  // ─── Verificación del esquema ─────────────────────────────────────────
  // El esquema vive en Supabase y se cambia solo con migraciones versionadas
  // (backend/migrations). El arranque ya no crea ni altera tablas ni siembra
  // usuarios: solo comprueba que lo que el código usa exista y, si no, se detiene.
  // El primer administrador se crea con `npm run crear-admin`.
  const ESQUEMA_REQUERIDO = {
    users:         ['id', 'username', 'password', 'email', 'full_name', 'role', 'active',
                    'failed_attempts', 'locked_until', 'reset_token', 'reset_token_expires',
                    'last_login', 'updated_at', 'otp_attempts'],
    socio:         ['id_socio', 'nombre', 'documento'],
    transactions:  ['id', 'tipo', 'monto', 'fecha'],
    categories:    ['id'],
    meses_periodo: ['anio', 'mes', 'total_ingresos', 'total_gastos', 'balance', 'cerrado'],
    compra:        ['id_compra'],
    cartera:       ['id_cartera'],
    asistencia:    ['id_asistencia'],
    pagos_pasarela: ['referencia'],
    auditoria:     ['id'],
    jersey_campana: ['id'],
    landing_version: ['numero'],
  };

  async function verificarEsquema() {
    const { rows } = await pool.query(
      `SELECT table_name, column_name
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [Object.keys(ESQUEMA_REQUERIDO)]
    );

    const existentes = {};
    for (const { table_name, column_name } of rows) {
      (existentes[table_name] ||= new Set()).add(column_name);
    }

    const faltas = [];
    for (const [tabla, columnas] of Object.entries(ESQUEMA_REQUERIDO)) {
      if (!existentes[tabla]) { faltas.push(`tabla ${tabla}`); continue; }
      for (const col of columnas) {
        if (!existentes[tabla].has(col)) faltas.push(`columna ${tabla}.${col}`);
      }
    }

    if (faltas.length > 0) {
      console.error('❌ El esquema de la base de datos está incompleto:');
      faltas.forEach((f) => console.error(`   - falta ${f}`));
      console.error('   Aplica las migraciones de backend/migrations (empieza por 0000_baseline.sql).');
      process.exit(1);
    }
    console.log('✅ Esquema de la base de datos verificado');
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
          `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
        );
        const adminId = admin.rows[0]?.id || null;

        const ultimoDiaMes = new Date(yearNum, monthNum, 0).getDate();
        const fechaInicio = `${yearNum}-${String(monthNum).padStart(2,'0')}-01`;
        const fechaFin    = `${yearNum}-${String(monthNum).padStart(2,'0')}-${String(ultimoDiaMes).padStart(2,'0')}`;

        await pool.query(
          `INSERT INTO meses_periodo
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
            'Cierre automático por el sistema', adminId,
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
    await verificarEsquema();
    app.listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    });
  }

  start().catch((err) => {
    console.error('❌ No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  });
})();