const express = require('express'); 
const cors = require('cors'); 
const dotenv = require('dotenv'); 
const { Pool } = require('pg'); 
 
dotenv.config(); 
 
const app = express(); 
const PORT = process.env.PORT || 3000; 
 
const pool = new Pool({ 
  host: process.env.DB_HOST || 'localhost', 
  port: process.env.DB_PORT || 5432, 
  user: process.env.DB_USER || 'postgres', 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME || 'ruta_contable', 
}); 
 
app.use(cors()); 
app.use(express.json()); 
 
app.get('/health', async (req, res) => { 
  try { 
    const result = await pool.query('SELECT NOW() as time'); 
    res.json({ status: 'OK', time: result.rows[0].time }); 
  } catch (error) { 
    res.status(500).json({ status: 'ERROR', error: error.message }); 
  } 
}); 
 
app.get('/', (req, res) => { 
  res.json({ message: 'API Ruta Contable funcionando' }); 
}); 
 
app.get('/api/users', async (req, res) => { 
  try { 
    const result = await pool.query('SELECT * FROM users'); 
    res.json({ success: true, data: result.rows }); 
  } catch (error) { 
    res.status(500).json({ success: false, error: error.message }); 
  } 
}); 
 
app.post('/api/users', async (req, res) => { 
  try { 
    const { name, email, password } = req.body; 
    const result = await pool.query( 
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id', 
      [name, email, password] 
    ); 
    res.status(201).json({ success: true, id: result.rows[0].id }); 
  } catch (error) { 
    res.status(400).json({ success: false, error: error.message }); 
  } 
}); 
 
async function initTables() { 
  try { 
    await pool.query(` 
      CREATE TABLE IF NOT EXISTS users ( 
        id SERIAL PRIMARY KEY, 
        name VARCHAR(100) NOT NULL, 
        email VARCHAR(100) UNIQUE NOT NULL, 
        password VARCHAR(255) NOT NULL, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
      ) 
    `); 
    console.log('Tabla users lista'); 
  } catch (error) { 
    console.error('Error:', error.message); 
  } 
} 
 
app.listen(PORT, async () => { 
  await initTables(); 
  console.log(`Servidor en http://localhost:${PORT}`); 
  console.log(`Health: http://localhost:${PORT}/health`); 
}); 
