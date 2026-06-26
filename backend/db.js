const { Pool } = require('pg');
require('dotenv').config();

// Usa la IP pre‑resuelta si existe, de lo contrario fallback al hostname
const dbHost = process.env.DB_HOST_IP || process.env.DB_HOST;

const pool = new Pool({
  host: dbHost,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 600000,        // 10 minutos (antes 30s) - evita cierre prematuro
  connectionTimeoutMillis: 20000,   // 20 segundos (antes 10s) - más tiempo para reconectar
  keepAlive: true,
  keepAliveInitialDelay: 10000,     // 10 segundos antes del primer keepalive
  family: 4,                        // IPv4, redundante pero seguro
});

pool.on('error', (err) => {
  console.error('⚠️  Error inesperado en el pool de PG:', err.message);
});

module.exports = pool;
