const pool = require('../db');

const SELECT_WITH_SOCIO = `
  SELECT c.*, s.nombre AS socio_nombre, s.documento AS socio_documento
  FROM cartera c
  LEFT JOIN socio s ON s.id_socio = c.id_socio
`;

// GET /api/cartera
async function getAll(req, res) {
  try {
    const { estado, idSocio, search = '' } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (estado) {
      conditions.push(`c.estado = $${i++}`);
      params.push(estado);
    }
    if (idSocio) {
      conditions.push(`c.id_socio = $${i++}`);
      params.push(parseInt(idSocio));
    }
    if (search) {
      conditions.push(`(c.concepto ILIKE $${i} OR s.nombre ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `${SELECT_WITH_SOCIO} ${where} ORDER BY c.fecha DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll cartera:', error);
    res.status(500).json({ success: false, message: 'Error al obtener cartera' });
  }
}

// GET /api/cartera/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`${SELECT_WITH_SOCIO} WHERE c.id_cartera = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro de cartera no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getById cartera:', error);
    res.status(500).json({ success: false, message: 'Error al obtener registro de cartera' });
  }
}

// POST /api/cartera
async function create(req, res) {
  try {
    const { idSocio, idPagoMensual, fecha, concepto, valor, observaciones } = req.body;

    if (!idSocio) {
      return res.status(400).json({ success: false, message: 'El socio es obligatorio' });
    }
    if (!concepto || concepto.trim() === '') {
      return res.status(400).json({ success: false, message: 'El concepto es obligatorio' });
    }
    const valorNum = parseFloat(valor);
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ success: false, message: 'El valor debe ser numérico y mayor a cero' });
    }
    if (!fecha || isNaN(Date.parse(fecha))) {
      return res.status(400).json({ success: false, message: 'Debe ingresar una fecha válida' });
    }

    const result = await pool.query(
      `INSERT INTO cartera (id_socio, id_pago_mensual, fecha, concepto, valor, observaciones, estado)
       VALUES ($1,$2,$3,$4,$5,$6,'pendiente')
       RETURNING *`,
      [idSocio, idPagoMensual || null, fecha, concepto.trim(), valorNum, observaciones || null]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Registro de cartera creado correctamente' });
  } catch (error) {
    console.error('Error create cartera:', error);
    res.status(500).json({ success: false, message: 'Error al crear registro de cartera' });
  }
}

// PUT /api/cartera/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { concepto, valor, observaciones, estado } = req.body;

    const existing = await pool.query('SELECT estado FROM cartera WHERE id_cartera = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro de cartera no encontrado' });
    }
    if (existing.rows[0].estado === 'anulado') {
      return res.status(409).json({ success: false, message: 'No se puede editar un registro anulado' });
    }
    if (estado && !['pendiente', 'pagado', 'anulado'].includes(estado)) {
      return res.status(400).json({ success: false, message: "estado debe ser 'pendiente', 'pagado' o 'anulado'" });
    }

    const fechaPago = estado === 'pagado' ? new Date().toISOString().slice(0, 10) : null;

    const result = await pool.query(
      `UPDATE cartera SET
        concepto      = COALESCE($1, concepto),
        valor         = COALESCE($2, valor),
        observaciones = COALESCE($3, observaciones),
        estado        = COALESCE($4, estado),
        fecha_pago    = COALESCE($5, fecha_pago)
       WHERE id_cartera = $6
       RETURNING *`,
      [concepto, valor ? parseFloat(valor) : null, observaciones, estado, fechaPago, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Registro de cartera actualizado correctamente' });
  } catch (error) {
    console.error('Error update cartera:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar registro de cartera' });
  }
}

// DELETE /api/cartera/:id — solo cuentas saldadas (pagadas) se pueden eliminar
async function remove(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT estado FROM cartera WHERE id_cartera = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro de cartera no encontrado' });
    }
    if (existing.rows[0].estado !== 'pagado') {
      return res.status(409).json({
        success: false,
        message: 'Solo se pueden eliminar registros de cartera ya saldados (pagados)',
      });
    }

    await pool.query('DELETE FROM cartera WHERE id_cartera = $1', [id]);

    res.json({ success: true, message: 'Registro de cartera eliminado correctamente' });
  } catch (error) {
    console.error('Error delete cartera:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar registro de cartera' });
  }
}

module.exports = { getAll, getById, create, update, remove };
