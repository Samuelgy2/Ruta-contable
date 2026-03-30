/**
 * Express.js Server with Database Connection
 * 
 * This file demonstrates:
 * 1. Setting up an Express server
 * 2. Connecting to a database
 * 3. Creating API routes
 * 4. Handling CRUD operations
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { 
  initializePool,
  testConnection,
  run, 
  get, 
  all, 
  initializeTables 
} = require('./config/database');  // Ruta corregida

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Middleware para logging (opcional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Express + Database API',
    version: '1.0.0',
    status: 'Server is running',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
      health: '/health'
    }
  });
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    const result = await all('SELECT NOW() as time');
    res.json({
      status: 'OK',
      database: 'Connected',
      time: result[0]?.time,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// ============================================
// USER ROUTES
// ============================================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await all('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    console.error('Error en GET /api/users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error en GET /api/users/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validación básica
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email and password are required' 
      });
    }
    
    const result = await run(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, password]
    );
    
    res.status(201).json({ 
      success: true, 
      data: { id: result.id, name, email },
      message: 'User created successfully'
    });
  } catch (err) {
    console.error('Error en POST /api/users:', err);
    // Error de email duplicado
    if (err.code === '23505') {
      res.status(400).json({ success: false, error: 'Email already exists' });
    } else {
      res.status(400).json({ success: false, error: err.message });
    }
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await run(
      'UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4',
      [name, email, password, req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Updated ${result.changes} user(s)` 
    });
  } catch (err) {
    console.error('Error en PUT /api/users/:id:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM users WHERE id = $1', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Deleted ${result.changes} user(s)` 
    });
  } catch (err) {
    console.error('Error en DELETE /api/users/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// PRODUCT ROUTES
// ============================================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await all('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    console.error('Error en GET /api/products:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    console.error('Error en GET /api/products/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    // Validación básica
    if (!name || !price) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and price are required' 
      });
    }
    
    const result = await run(
      'INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING id',
      [name, price, description || null]
    );
    
    res.status(201).json({ 
      success: true, 
      data: { id: result.id, name, price, description },
      message: 'Product created successfully'
    });
  } catch (err) {
    console.error('Error en POST /api/products:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const result = await run(
      'UPDATE products SET name = $1, price = $2, description = $3 WHERE id = $4',
      [name, price, description, req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Updated ${result.changes} product(s)` 
    });
  } catch (err) {
    console.error('Error en PUT /api/products/:id:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM products WHERE id = $1', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Deleted ${result.changes} product(s)` 
    });
  } catch (err) {
    console.error('Error en DELETE /api/products/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// 404 Handler - Ruta no encontrada
// ============================================
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: `Route ${req.originalUrl} not found` 
  });
});

// ============================================
// Error Handler Global
// ============================================
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// ============================================
// Inicio del servidor
// ============================================

async function startServer() {
  try {
    // Initialize pool
    const poolInitialized = await initializePool();
    if (!poolInitialized) {
      console.error('❌ Could not initialize database pool. Exiting...');
      process.exit(1);
    }
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Could not connect to database. Exiting...');
      process.exit(1);
    }
    
    // Initialize database tables
    await initializeTables();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   GET    /api/users`);
      console.log(`   POST   /api/users`);
      console.log(`   GET    /api/users/:id`);
      console.log(`   PUT    /api/users/:id`);
      console.log(`   DELETE /api/users/:id`);
      console.log(`   GET    /api/products`);
      console.log(`   POST   /api/products`);
      console.log(`   GET    /api/products/:id`);
      console.log(`   PUT    /api/products/:id`);
      console.log(`   DELETE /api/products/:id\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();