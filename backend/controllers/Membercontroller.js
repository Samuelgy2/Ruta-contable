const pool = require('../db');

// El vínculo con la cuenta de acceso vive en socio_perfil.id_socio. Se expone
// como usuarioVinculado: { id, username, email } | null en cada socio.
const SELECT_CON_USUARIO = `
  SELECT s.*,
         CASE WHEN u.id IS NULL THEN NULL
              ELSE json_build_object('id', u.id, 'username', u.username, 'email', u.email)
         END AS "usuarioVinculado"
  FROM socio s
  LEFT JOIN socio_perfil sp ON sp.id_socio = s.id_socio
  LEFT JOIN users u ON u.id = sp.user_id
`;

// GET /api/socios
async function getAll(req, res) {
  try {
    const { search = '' } = req.query;

    const query = search
      ? `${SELECT_CON_USUARIO}
         WHERE s.nombre ILIKE $1 OR s.email ILIKE $1 OR s.documento ILIKE $1
         ORDER BY s.created_at DESC`
      : `${SELECT_CON_USUARIO} ORDER BY s.created_at DESC`;

    const params = search ? [`%${search}%`] : [];
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll socios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener socios' });
  }
}

// GET /api/socios/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`${SELECT_CON_USUARIO} WHERE s.id_socio = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Socio no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getById socio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener socio' });
  }
}

// POST /api/socios
async function create(req, res) {
  try {
    const {
      nombre, documento, tipo_documento = 'CC',
      email, telefono, direccion,
      fecha_nacimiento, fecha_ingreso,
      tipo_membresia = 'Media', nivel_aprendizaje, estado = 'activo',
      foto, observaciones,
    } = req.body;

    if (!nombre || !documento || !fecha_ingreso) {
      return res.status(400).json({
        success: false,
        message: 'nombre, documento y fecha_ingreso son obligatorios',
      });
    }

    const exists = await pool.query(
      'SELECT id_socio FROM socio WHERE documento = $1', [documento]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un socio con ese documento',
      });
    }

    const result = await pool.query(
      `INSERT INTO socio
        (nombre, documento, tipo_documento, email, telefono, direccion,
         fecha_nacimiento, fecha_ingreso, tipo_membresia, nivel_aprendizaje, estado,
         foto, observaciones, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        nombre, documento, tipo_documento,
        email || null, telefono || null, direccion || null,
        fecha_nacimiento || null, fecha_ingreso,
        tipo_membresia, nivel_aprendizaje || null, estado,
        foto || null, observaciones || null,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Socio creado correctamente',
    });
  } catch (error) {
    console.error('Error create socio:', error);
    res.status(500).json({ success: false, message: 'Error al crear socio' });
  }
}

// PUT /api/socios/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre, documento, tipo_documento,
      email, telefono, direccion,
      fecha_nacimiento, fecha_ingreso,
      tipo_membresia, nivel_aprendizaje, estado, foto, observaciones,
    } = req.body;

    const exists = await pool.query(
      'SELECT id_socio FROM socio WHERE id_socio = $1', [id]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Socio no encontrado' });
    }

    if (documento) {
      const dup = await pool.query(
        'SELECT id_socio FROM socio WHERE documento = $1 AND id_socio != $2',
        [documento, id]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ese documento ya pertenece a otro socio',
        });
      }
    }

    const result = await pool.query(
      `UPDATE socio SET
        nombre           = COALESCE($1,  nombre),
        documento        = COALESCE($2,  documento),
        tipo_documento   = COALESCE($3,  tipo_documento),
        email            = COALESCE($4,  email),
        telefono         = COALESCE($5,  telefono),
        direccion        = COALESCE($6,  direccion),
        fecha_nacimiento = COALESCE($7,  fecha_nacimiento),
        fecha_ingreso    = COALESCE($8,  fecha_ingreso),
        tipo_membresia   = COALESCE($9,  tipo_membresia),
        nivel_aprendizaje = COALESCE($10, nivel_aprendizaje),
        estado           = COALESCE($11, estado),
        foto             = COALESCE($12, foto),
        observaciones    = COALESCE($13, observaciones),
        updated_at       = CURRENT_TIMESTAMP
       WHERE id_socio = $14
       RETURNING *`,
      [
        nombre, documento, tipo_documento,
        email, telefono, direccion,
        fecha_nacimiento, fecha_ingreso,
        tipo_membresia, nivel_aprendizaje, estado, foto, observaciones,
        id,
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Socio actualizado correctamente',
    });
  } catch (error) {
    console.error('Error update socio:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar socio' });
  }
}

// DELETE /api/socios/:id
async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM socio WHERE id_socio = $1 RETURNING id_socio', [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Socio no encontrado' });
    }

    res.json({ success: true, message: 'Socio eliminado correctamente' });
  } catch (error) {
    console.error('Error delete socio:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar socio' });
  }
}

// PUT /api/socios/:id/vincular — body { userId }. Enlaza la cuenta de acceso
// (users, rol 'user') con la ficha de socio escribiendo socio_perfil.id_socio.
// La BD garantiza un solo usuario por socio (UNIQUE) y exige desvincular antes
// de reasignar (trigger); aquí esos fallos se traducen a 409.
async function vincular(req, res) {
  try {
    const { id } = req.params;
    const userId = parseInt(req.body?.userId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'userId es obligatorio y debe ser numérico' });
    }

    const socio = await pool.query('SELECT id_socio FROM socio WHERE id_socio = $1', [id]);
    if (socio.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Socio no encontrado' });
    }

    const usuario = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (usuario.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (usuario.rows[0].role !== 'user') {
      return res.status(400).json({ success: false, message: 'Solo se pueden vincular cuentas con rol de socio (user)' });
    }

    const result = await pool.query(
      `UPDATE socio_perfil SET id_socio = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING user_id, id_socio`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'El usuario no tiene perfil de socio' });
    }

    res.json({
      success: true,
      data: { idSocio: result.rows[0].id_socio, userId: result.rows[0].user_id },
      message: 'Usuario vinculado al socio correctamente',
    });
  } catch (error) {
    // 23505: UNIQUE (id_socio) → el socio ya tiene otro usuario.
    // 23514: check_violation → lo lanza el trigger tr_socio_perfil_cambio_socio
    //        cuando el usuario ya tenía otro socio asignado.
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Ese socio ya está vinculado a otro usuario' });
    }
    if (error.code === '23514') {
      return res.status(409).json({ success: false, message: error.message || 'Desvincule el socio actual antes de asignar otro' });
    }
    console.error('Error vincular socio:', error);
    res.status(500).json({ success: false, message: 'Error al vincular el usuario' });
  }
}

// DELETE /api/socios/:id/vincular — deja en NULL el id_socio del perfil que
// apunte a este socio.
async function desvincular(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE socio_perfil SET id_socio = NULL, updated_at = NOW()
        WHERE id_socio = $1
        RETURNING user_id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'El socio no tiene un usuario vinculado' });
    }

    res.json({
      success: true,
      data: { idSocio: parseInt(id, 10), userId: result.rows[0].user_id },
      message: 'Usuario desvinculado del socio',
    });
  } catch (error) {
    console.error('Error desvincular socio:', error);
    res.status(500).json({ success: false, message: 'Error al desvincular el usuario' });
  }
}

module.exports = { getAll, getById, create, update, remove, vincular, desvincular };