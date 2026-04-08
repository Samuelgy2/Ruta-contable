const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, full_name, role, active, failed_attempts, locked_until, created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      active: user.active,
      failedAttempts: user.failed_attempts,
      lockedUntil: user.locked_until,
      createdAt: user.created_at
    }));

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});

router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, username, email, full_name, role, active, failed_attempts, locked_until, created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        active: user.active,
        failedAttempts: user.failed_attempts,
        lockedUntil: user.locked_until,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuario' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, password, email, fullName, role, active } = req.body;

    if (!username || !password || !email || !fullName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Los campos username, password, email y fullName son requeridos' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El usuario o email ya existe' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, email, full_name, role, active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, email, full_name, role, active`,
      [username, hashedPassword, email, fullName, role || 'user', active !== false]
    );

    const user = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, email, fullName, role, active } = req.body;

    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (username) {
      const duplicateUsername = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );
      if (duplicateUsername.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'El nombre de usuario ya está en uso' });
      }
    }

    if (email) {
      const duplicateEmail = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (duplicateEmail.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'El email ya está en uso' });
      }
    }

    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (username) {
      updateFields.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (fullName) {
      updateFields.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }
    if (role) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (active !== undefined) {
      updateFields.push(`active = $${paramCount++}`);
      values.push(active);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, username, email, full_name, role, active`,
      values
    );

    const user = result.rows[0];
    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userExists = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (userExists.rows[0].username === 'admin') {
      return res.status(400).json({ success: false, message: 'No se puede eliminar el usuario admin' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
  }
});

module.exports = router;