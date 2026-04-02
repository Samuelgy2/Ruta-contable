const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL exitosamente');
    release();
  }
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

async function get(text, params) {
  const result = await query(text, params);
  return result.rows[0];
}

async function all(text, params) {
  const result = await query(text, params);
  return result.rows;
}

async function run(text, params) {
  const result = await query(text, params);
  return { id: result.rows[0]?.id, changes: result.rowCount };
}

module.exports = { pool, query, get, all, run };