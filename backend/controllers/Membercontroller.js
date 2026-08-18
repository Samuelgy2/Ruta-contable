const pool = require('../db');

// GET /api/socios
async function getAll(req, res) {
  try {
    const { search = '' } = req.query;

    const query = search
      ? `SELECT * FROM socio
         WHERE nombre ILIKE $1 OR email ILIKE $1 OR documento ILIKE $1
         ORDER BY created_at DESC`
      : `SELECT * FROM socio ORDER BY created_at DESC`;

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
    const result = await pool.query('SELECT * FROM socio WHERE id_socio = $1', [id]);

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

module.exports = { getAll, getById, create, update, remove };