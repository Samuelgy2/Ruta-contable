const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User{
  // Buscar gestor por email
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Crear nuevo usuario
  static async create(userData) {
    const { name, email, password, role = 'user' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, active`,
      [name, email, hashedPassword, role]
    );
    
    return result.rows[0];
  }
}

module.exports = User;