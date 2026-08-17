const pool = require('../db');

// GET /api/proveedores
async function getAll(req, res) {
  try {
    const { search = '', estado } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (search) {
      conditions.push(`(nombre ILIKE $${i} OR nit ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }
    if (estado) {
      conditions.push(`estado = $${i++}`);
      params.push(estado);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM proveedores ${where} ORDER BY nombre ASC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll proveedores:', error);
    res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
  }
}

// GET /api/proveedores/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM proveedores WHERE id_proveedor = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getById proveedor:', error);
    res.status(500).json({ success: false, message: 'Error al obtener proveedor' });
  }
}

// POST /api/proveedores
async function create(req, res) {
  try {
    const { nombre, nit, telefono, email, direccion, observaciones } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre del proveedor es obligatorio' });
    }

    const exists = await pool.query('SELECT id_proveedor FROM proveedores WHERE nombre = $1', [nombre.trim()]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Ya existe un proveedor con ese nombre' });
    }

    const result = await pool.query(
      `INSERT INTO proveedores (nombre, nit, telefono, email, direccion, observaciones, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [nombre.trim(), nit || null, telefono || null, email || null, direccion || null, observaciones || null, req.user.id]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Proveedor creado correctamente' });
  } catch (error) {
    console.error('Error create proveedor:', error);
    res.status(500).json({ success: false, message: 'Error al crear proveedor' });
  }
}

// PUT /api/proveedores/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { nombre, nit, telefono, email, direccion, observaciones, estado } = req.body;

    const exists = await pool.query('SELECT id_proveedor FROM proveedores WHERE id_proveedor = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }

    if (estado && !['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ success: false, message: "estado debe ser 'activo' o 'inactivo'" });
    }

    // RN-054: no se permite desactivar un proveedor con compras asociadas activas (pendientes)
    if (estado === 'inactivo') {
      const activeCompras = await pool.query(
        `SELECT id_compra FROM compra WHERE id_proveedor = $1 AND estado = 'pendiente' LIMIT 1`,
        [id]
      );
      if (activeCompras.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'RN-054: No se puede desactivar un proveedor con compras pendientes asociadas',
        });
      }
    }

    const result = await pool.query(
      `UPDATE proveedores SET
        nombre        = COALESCE($1, nombre),
        nit           = COALESCE($2, nit),
        telefono      = COALESCE($3, telefono),
        email         = COALESCE($4, email),
        direccion     = COALESCE($5, direccion),
        observaciones = COALESCE($6, observaciones),
        estado        = COALESCE($7, estado)
       WHERE id_proveedor = $8
       RETURNING *`,
      [nombre, nit, telefono, email, direccion, observaciones, estado, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Proveedor actualizado correctamente' });
  } catch (error) {
    console.error('Error update proveedor:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar proveedor' });
  }
}

// DELETE /api/proveedores/:id
async function remove(req, res) {
  try {
    const { id } = req.params;

    // RN-054: no se permite eliminar un proveedor con compras asociadas activas
    const activeCompras = await pool.query(
      `SELECT id_compra FROM compra WHERE id_proveedor = $1 AND estado = 'pendiente' LIMIT 1`,
      [id]
    );
    if (activeCompras.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'RN-054: No se puede eliminar un proveedor con compras pendientes asociadas',
      });
    }

    const result = await pool.query(
      'DELETE FROM proveedores WHERE id_proveedor = $1 RETURNING id_proveedor', [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }

    res.json({ success: true, message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error delete proveedor:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar proveedor' });
  }
}

module.exports = { getAll, getById, create, update, remove };
