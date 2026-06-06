const pool = require('../db');

// Normaliza 'income'/'expense' (frontend) → 'ingreso'/'gasto' (BD)
function normalizeTipo(tipo) {
  if (tipo === 'income')  return 'ingreso';
  if (tipo === 'expense') return 'gasto';
  return tipo;
}

// GET /api/transactions
async function getAll(req, res) {
  try {
    const { tipo, mes, anio, search = '' } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (tipo) {
      conditions.push(`tipo = $${i++}`);
      params.push(normalizeTipo(tipo));
    }
    if (mes) {
      conditions.push(`EXTRACT(MONTH FROM fecha) = $${i++}`);
      params.push(parseInt(mes));
    }
    if (anio) {
      conditions.push(`EXTRACT(YEAR FROM fecha) = $${i++}`);
      params.push(parseInt(anio));
    }
    if (search) {
      conditions.push(`(descripcion ILIKE $${i} OR categoria ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM transactions ${where} ORDER BY fecha DESC, created_at DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll transactions:', error);
    res.status(500).json({ success: false, message: 'Error al obtener transacciones' });
  }
}

// GET /api/transactions/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getById transaction:', error);
    res.status(500).json({ success: false, message: 'Error al obtener transacción' });
  }
}

// POST /api/transactions
async function create(req, res) {
  try {
    const { tipo, monto, fecha, descripcion, categoria, metodoPago } = req.body;

    // RN-001: monto numérico positivo mayor a cero
    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'RN-001: El monto debe ser un valor numérico positivo mayor a cero.',
      });
    }

    // RN-002: fecha válida y obligatoria
    const fechaDate = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // permite hasta el final del día de hoy

    if (!fecha || isNaN(Date.parse(fecha)) || fechaDate > hoy) {
      return res.status(400).json({
        success: false,
        message: 'RN-002: Debe ingresar una fecha válida para la transacción.',
      });
    }

    // RN-003: categoría obligatoria
    if (!categoria || categoria.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'RN-003: Debe seleccionar una categoría para la transacción.',
      });
    }

    // tipo obligatorio
    if (!tipo) {
      return res.status(400).json({ success: false, message: 'El tipo de transacción es obligatorio.' });
    }

    const tipoNormalizado = normalizeTipo(tipo);
    if (!['ingreso', 'gasto'].includes(tipoNormalizado)) {
      return res.status(400).json({
        success: false,
        message: "tipo debe ser 'ingreso' o 'gasto'",
      });
    }

    // RN-004: usuario responsable desde el token (inyectado por requireAdmin)
    const responsable = req.user?.username ?? req.user?.email ?? req.user?.nombre ?? 'Admin';

    const result = await pool.query(
      `INSERT INTO transactions (tipo, monto, fecha, descripcion, categoria, metodo_pago, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tipoNormalizado,
        montoNum,
        fecha,
        descripcion || null,
        categoria.trim(),
        metodoPago  || null,
        responsable,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Transacción registrada correctamente',
    });
  } catch (error) {
    console.error('Error create transaction:', error);
    res.status(500).json({ success: false, message: 'Error al crear transacción' });
  }
}

// PUT /api/transactions/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { tipo, monto, fecha, descripcion, categoria, metodoPago } = req.body;

    const exists = await pool.query('SELECT id FROM transactions WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
    }

    const result = await pool.query(
      `UPDATE transactions SET
        tipo        = COALESCE($1, tipo),
        monto       = COALESCE($2, monto),
        fecha       = COALESCE($3, fecha),
        descripcion = COALESCE($4, descripcion),
        categoria   = COALESCE($5, categoria),
        metodo_pago = COALESCE($6, metodo_pago)
       WHERE id = $7
       RETURNING *`,
      [
        tipo        ? normalizeTipo(tipo) : null,
        monto       ? parseFloat(monto)   : null,
        fecha       || null,
        descripcion || null,
        categoria   || null,
        metodoPago  || null,
        id,
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Transacción actualizada correctamente',
    });
  } catch (error) {
    console.error('Error update transaction:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar transacción' });
  }
}

// DELETE /api/transactions/:id
async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING id', [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
    }

    res.json({ success: true, message: 'Transacción eliminada correctamente' });
  } catch (error) {
    console.error('Error delete transaction:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar transacción' });
  }
}

module.exports = { getAll, getById, create, update, remove };