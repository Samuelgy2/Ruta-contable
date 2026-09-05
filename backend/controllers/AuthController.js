const bcrypt = require('bcryptjs');
const pool = require('../db');

// Mismo coste de hash que usa server.js al crear el administrador por defecto.
const RONDAS_BCRYPT = 12;
const LONGITUD_MINIMA_PASSWORD = 8;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register — registro público de socios
async function register(req, res) {
  try {
    // El rol nunca se toma del cuerpo de la petición: siempre se crea como 'user'.
    const { username, email, password, full_name, telefono } = req.body || {};

    const errors = [];

    const usernameNormalizado = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const nombreCompleto = typeof full_name === 'string' ? full_name.trim() : '';
    const telefonoNormalizado = typeof telefono === 'string' && telefono.trim() !== ''
      ? telefono.trim()
      : null;

    if (!usernameNormalizado) {
      errors.push('El nombre de usuario es obligatorio');
    }
    if (!nombreCompleto) {
      errors.push('El nombre completo es obligatorio');
    }
    if (!emailNormalizado || !FORMATO_EMAIL.test(emailNormalizado)) {
      errors.push('El correo electrónico no tiene un formato válido');
    }
    if (typeof password !== 'string' || password.length < LONGITUD_MINIMA_PASSWORD) {
      errors.push(`La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Error de validación', errors });
    }

    const existente = await pool.query(
      'SELECT username, email FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
      [usernameNormalizado, emailNormalizado]
    );

    if (existente.rows.length > 0) {
      const chocaEmail = existente.rows.some(
        (fila) => (fila.email || '').toLowerCase() === emailNormalizado
      );

      return res.status(409).json({
        success: false,
        message: chocaEmail
          ? 'El correo electrónico ya está registrado'
          : 'El nombre de usuario ya está registrado',
      });
    }

    const hashedPassword = await bcrypt.hash(password, RONDAS_BCRYPT);

    // telefono e id_socio ya no viven en users, sino en socio_perfil. El
    // disparador crear_perfil_por_rol crea esa fila al insertar el usuario, así
    // que aquí sólo se actualiza el teléfono después. id_socio queda en NULL: el
    // administrador vincula la ficha del club más tarde.
    const result = await pool.query(
      `INSERT INTO users (username, password, email, full_name, role, active)
       VALUES ($1, $2, $3, $4, 'user', true)
       RETURNING id, username, email, full_name, role, active, created_at`,
      [usernameNormalizado, hashedPassword, emailNormalizado, nombreCompleto]
    );

    const user = result.rows[0];

    if (telefonoNormalizado) {
      await pool.query(
        'UPDATE socio_perfil SET telefono = $1 WHERE user_id = $2',
        [telefonoNormalizado, user.id]
      );
    }

    const perfil = await pool.query(
      'SELECT id_socio, telefono FROM socio_perfil WHERE user_id = $1',
      [user.id]
    );

    // Sin token: el usuario debe iniciar sesión después de registrarse.
    res.status(201).json({
      success: true,
      message: 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.full_name,
          email: user.email,
          telefono: perfil.rows[0]?.telefono ?? null,
          role: user.role,
          active: user.active,
          idSocio: perfil.rows[0]?.id_socio ?? null,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    // Carrera contra otro registro simultáneo con el mismo username o email.
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico o el nombre de usuario ya están registrados',
      });
    }

    console.error('❌ Error en register:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

module.exports = { register };
