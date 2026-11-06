const pool = require('../db');

const SELECT_WITH_JOINS = `
  SELECT co.*, cat.name AS categoria_nombre
  FROM compra co
  LEFT JOIN categories cat ON cat.id = co.categoria_id
`;

// GET /api/compras
async function getAll(req, res) {
  try {
    const { estado, search = '' } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (estado) {
      conditions.push(`co.estado = $${i++}`);
      params.push(estado);
    }
    if (search) {
      conditions.push(`(co.concepto ILIKE $${i} OR co.proveedor_nombre ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `${SELECT_WITH_JOINS} ${where} ORDER BY co.fecha DESC, co.created_at DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll compras:', error);
    res.status(500).json({ success: false, message: 'Error al obtener compras' });
  }
}

// GET /api/compras/:id (incluye detalle)
async function getById(req, res) {
  try {
    const { id } = req.params;
    const compra = await pool.query(`${SELECT_WITH_JOINS} WHERE co.id_compra = $1`, [id]);

    if (compra.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    }

    const detalle = await pool.query(
      'SELECT * FROM detalle_compra WHERE id_compra = $1 ORDER BY nro_linea ASC',
      [id]
    );

    res.json({ success: true, data: { ...compra.rows[0], detalle: detalle.rows } });
  } catch (error) {
    console.error('Error getById compra:', error);
    res.status(500).json({ success: false, message: 'Error al obtener compra' });
  }
}

// POST /api/compras — registra la compra en estado 'pendiente' (RF-052)
async function create(req, res) {
  try {
    const { concepto, tipo, fecha, proveedorNombre, factura, categoriaId, observaciones } = req.body;

    if (!concepto || concepto.trim() === '') {
      return res.status(400).json({ success: false, message: 'El concepto de la compra es obligatorio' });
    }
    if (!fecha || isNaN(Date.parse(fecha))) {
      return res.status(400).json({ success: false, message: 'Debe ingresar una fecha válida' });
    }
    if (proveedorNombre && String(proveedorNombre).trim().length > 150) {
      return res.status(400).json({ success: false, message: 'El proveedor no puede superar 150 caracteres' });
    }

    const result = await pool.query(
      `INSERT INTO compra (concepto, tipo, fecha, proveedor_nombre, factura, categoria_id, observaciones, created_by, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pendiente')
       RETURNING *`,
      [concepto.trim(), tipo || null, fecha, (proveedorNombre && String(proveedorNombre).trim()) || null, factura || null, categoriaId || null, observaciones || null, req.user.id]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Compra registrada correctamente' });
  } catch (error) {
    console.error('Error create compra:', error);
    res.status(500).json({ success: false, message: 'Error al crear compra' });
  }
}

// PUT /api/compras/:id — solo editable mientras esté 'pendiente'
async function update(req, res) {
  try {
    const { id } = req.params;
    const { concepto, tipo, fecha, proveedorNombre, factura, categoriaId, observaciones } = req.body;

    const existing = await pool.query('SELECT estado FROM compra WHERE id_compra = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    }
    if (existing.rows[0].estado === 'aprobada') {
      return res.status(409).json({ success: false, message: 'No se puede editar una compra ya aprobada' });
    }

    const result = await pool.query(
      `UPDATE compra SET
        concepto      = COALESCE($1, concepto),
        tipo          = COALESCE($2, tipo),
        fecha         = COALESCE($3, fecha),
        proveedor_nombre = COALESCE($4, proveedor_nombre),
        factura       = COALESCE($5, factura),
        categoria_id  = COALESCE($6, categoria_id),
        observaciones = COALESCE($7, observaciones)
       WHERE id_compra = $8
       RETURNING *`,
      [concepto, tipo, fecha, proveedorNombre ? String(proveedorNombre).trim() : null, factura, categoriaId, observaciones, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Compra actualizada correctamente' });
  } catch (error) {
    console.error('Error update compra:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar compra' });
  }
}

// POST /api/compras/:id/aprobar — pendiente -> aprobada (habilita el detalle)
async function aprobar(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT estado FROM compra WHERE id_compra = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    }
    if (existing.rows[0].estado === 'aprobada') {
      return res.status(409).json({ success: false, message: 'La compra ya está aprobada' });
    }

    const result = await pool.query(
      `UPDATE compra SET estado = 'aprobada', approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE id_compra = $2 RETURNING *`,
      [req.user.id, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Compra aprobada correctamente' });
  } catch (error) {
    console.error('Error aprobar compra:', error);
    res.status(500).json({ success: false, message: 'Error al aprobar compra' });
  }
}

// DELETE /api/compras/:id
async function remove(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT estado FROM compra WHERE id_compra = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    }
    if (existing.rows[0].estado === 'aprobada') {
      return res.status(409).json({ success: false, message: 'No se puede eliminar una compra ya aprobada' });
    }

    await pool.query('DELETE FROM detalle_compra WHERE id_compra = $1', [id]);
    await pool.query('DELETE FROM compra WHERE id_compra = $1', [id]);

    res.json({ success: true, message: 'Compra eliminada correctamente' });
  } catch (error) {
    console.error('Error delete compra:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar compra' });
  }
}

// ─── Detalle de compra (RF-053) — solo permitido una vez que la compra está 'aprobada' ─

// POST /api/compras/:id/detalle
async function addDetalle(req, res) {
  try {
    const { id } = req.params;
    const { concepto, cantidad = 1, valorUnitario } = req.body;

    const compra = await pool.query('SELECT estado FROM compra WHERE id_compra = $1', [id]);
    if (compra.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    }
    if (compra.rows[0].estado !== 'aprobada') {
      return res.status(409).json({ success: false, message: 'Solo se puede registrar detalle en compras aprobadas' });
    }
    if (!concepto || concepto.trim() === '') {
      return res.status(400).json({ success: false, message: 'El concepto de la línea es obligatorio' });
    }
    const valorNum = parseFloat(valorUnitario);
    if (!valorUnitario || isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ success: false, message: 'El valor unitario debe ser numérico y mayor a cero' });
    }

    const nroLinea = await pool.query(
      'SELECT COALESCE(MAX(nro_linea), 0) + 1 AS siguiente FROM detalle_compra WHERE id_compra = $1',
      [id]
    );

    const result = await pool.query(
      `INSERT INTO detalle_compra (id_compra, nro_linea, concepto, cantidad, valor_unitario)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [id, nroLinea.rows[0].siguiente, concepto.trim(), parseInt(cantidad) || 1, valorNum]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Línea de detalle agregada' });
  } catch (error) {
    console.error('Error addDetalle compra:', error);
    res.status(500).json({ success: false, message: 'Error al agregar línea de detalle' });
  }
}

// DELETE /api/compras/:id/detalle/:nroLinea
async function removeDetalle(req, res) {
  try {
    const { id, nroLinea } = req.params;

    const compra = await pool.query('SELECT estado FROM compra WHERE id_compra = $1', [id]);
    if (compra.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Compra no encontrada' });
    }
    if (compra.rows[0].estado !== 'aprobada') {
      return res.status(409).json({ success: false, message: 'Solo se puede modificar el detalle de compras aprobadas' });
    }

    const result = await pool.query(
      'DELETE FROM detalle_compra WHERE id_compra = $1 AND nro_linea = $2 RETURNING *',
      [id, nroLinea]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Línea de detalle no encontrada' });
    }

    res.json({ success: true, message: 'Línea de detalle eliminada' });
  } catch (error) {
    console.error('Error removeDetalle compra:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar línea de detalle' });
  }
}

module.exports = { getAll, getById, create, update, aprobar, remove, addDetalle, removeDetalle };
