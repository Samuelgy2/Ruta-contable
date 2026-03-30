/**
 * Simple Database Connection Test
 * Run with: node test-db.js
 */

require('dotenv').config();

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testConnection() {
  console.log('🧪 Probando conexión a PostgreSQL...\n');
  
  try {
    await client.connect();
    
    const result = await client.query('SELECT NOW() as tiempo, version() as version');
    
    console.log('✅ ¡Conexión exitosa!');
    console.log('📅 Hora del servidor:', result.rows[0].tiempo);
    console.log('🔢 Versión PostgreSQL:', result.rows[0].version);
    
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();