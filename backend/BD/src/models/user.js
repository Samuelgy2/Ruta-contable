/**
 * User Model - CRUD Operations
 * Separated from database connection for better organization
 */

const pool = require('../config/database');

// Create a new user
async function create(name, email, password) {
  const result = await pool.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, password]
  );
  return result.rows[0];
}

// Get all users
async function findAll() {
  const result = await pool.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
  return result.rows;
}

// Get user by ID
async function findById(id) {
  const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// Get user by email
async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

// Update user
async function update(id, name, email, password) {
  const result = await pool.query(
    'UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, name, email',
    [name, email, password, id]
  );
  return result.rows[0];
}

// Delete user
async function remove(id) {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return result.rowCount;
}

module.exports = {
  create,
  findAll,
  findById,
  findByEmail,
  update,
  remove
};
