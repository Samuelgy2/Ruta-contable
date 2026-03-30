const { Pool } = require('pg');
require('dotenv').config();

// Pool de conexiones para PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ruta_contable',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función para inicializar el pool (para compatibilidad con index.js)
async function initializePool() {
  try {
    // El pool ya está creado, solo probamos la conexión
    const client = await pool.connect();
    console.log('✅ Database pool initialized');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Failed to initialize pool:', err.message);
    return false;
  }
}

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

// Función para ejecutar queries (INSERT, UPDATE, DELETE)
async function run(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return { 
      id: result.rows[0]?.id, 
      changes: result.rowCount 
    };
  } catch (error) {
    console.error('❌ Error en run:', error);
    throw error;
  }
}

// Función para obtener una fila
async function get(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error en get:', error);
    throw error;
  }
}

// Función para obtener múltiples filas
async function all(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Error en all:', error);
    throw error;
  }
}

// Función para inicializar las tablas
async function initializeTables() {
  try {
    // Crear tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created/verified');

    // Crear tabla de productos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created/verified');

    return true;
  } catch (err) {
    console.error('❌ Failed to create tables:', err.message);
    throw err;
  }
}

// Helper function para queries personalizadas (opcional)
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query ejecutado:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error);
    throw error;
  }
}

async function getClient() {
  return await pool.connect();
}

// Probar conexión inicial
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.stack);
  } else {
    console.log('✅ Conectado a PostgreSQL exitosamente');
    release();
  }
});

module.exports = {
  pool,
  initializePool,
  testConnection,
  run,
  get,
  all,
  initializeTables,
  query,
  getClient
};