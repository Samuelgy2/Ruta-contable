const pool = require('../db');

// Normaliza 'income'/'expense' (frontend legacy) → 'ingreso'/'gasto' (BD, columna transactions.tipo)
function normalizeTipo(tipo) {
  if (tipo === 'income')  return 'ingreso';
  if (tipo === 'expense') return 'gasto';
  return tipo;
}

// Traduce tipo de transacción ('ingreso'/'gasto') → tipo de categoría ('income'/'expense')
// Necesario porque transactions.tipo y categories.type usan vocabularios distintos.
function tipoToCategoryType(tipoNormalizado) {
  if (tipoNormalizado === 'ingreso') return 'income';
  if (tipoNormalizado === 'gasto')   return 'expense';
  return null;
}

// Busca una categoría por id, validando que exista, esté activa y coincida en tipo.
// Devuelve la fila de categories o null.
async function findValidCategory(categoriaId, tipoNormalizado) {
  if (!categoriaId) return null;
  const categoryType = tipoToCategoryType(tipoNormalizado);
  const result = await pool.query(
    `SELECT id, name, type, active FROM categories WHERE id = $1`,
    [categoriaId]
  );
  if (result.rows.length === 0) return null;
  const cat = result.rows[0];
  if (!cat.active) return { ...cat, _error: 'inactive' };
  if (categoryType && cat.type !== categoryType) return { ...cat, _error: 'type_mismatch' };
  return cat;
}

// Fallback temporal: si el frontend todavía manda "categoria" como texto en vez de
// categoriaId, intenta resolverla contra categories.name (case-insensitive).
// Permite migrar el frontend sin romper la creación de transacciones mientras tanto.
async function resolveCategoryByName(categoriaNombre, tipoNormalizado) {
  if (!categoriaNombre) return null;
  const categoryType = tipoToCategoryType(tipoNormalizado);
  const result = await pool.query(
    `SELECT id, name, type, active FROM categories
     WHERE LOWER(name) = LOWER($1) AND ($2::varchar IS NULL OR type = $2)
     LIMIT 1`,
    [categoriaNombre.trim(), categoryType]
  );
  return result.rows[0] || null;
}

const SELECT_WITH_CATEGORY = `
  SELECT t.*, c.name AS categoria_nombre, c.type AS categoria_tipo, u.username AS creado_por_username
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.categoria_id
  LEFT JOIN users u ON u.id = t.created_by
`;

// GET /api/transactions
async function getAll(req, res) {
  try {
    const { tipo, mes, anio, categoriaId, search = '' } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (tipo) {
      conditions.push(`t.tipo = $${i++}`);
      params.push(normalizeTipo(tipo));
    }
    if (mes) {
      conditions.push(`EXTRACT(MONTH FROM t.fecha) = $${i++}`);
      params.push(parseInt(mes));
    }
    if (anio) {
      conditions.push(`EXTRACT(YEAR FROM t.fecha) = $${i++}`);
      params.push(parseInt(anio));
    }
    if (categoriaId) {
      conditions.push(`t.categoria_id = $${i++}`);
      params.push(parseInt(categoriaId));
    }
    if (search) {
      conditions.push(`(t.descripcion ILIKE $${i} OR c.name ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `${SELECT_WITH_CATEGORY} ${where} ORDER BY t.fecha DESC, t.created_at DESC`,
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
    const result = await pool.query(
      `${SELECT_WITH_CATEGORY} WHERE t.id = $1`,
      [id]
    );

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
    const { tipo, monto, fecha, descripcion, categoriaId, categoria, metodoPago, referencia } = req.body;

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

    // RN-003: categoría obligatoria — ahora resuelta contra la tabla categories.
    // Se acepta categoriaId (preferido) o categoria como texto (legacy, se resuelve por nombre).
    let categoryRow = null;
    if (categoriaId) {
      categoryRow = await findValidCategory(categoriaId, tipoNormalizado);
    } else if (categoria && categoria.trim() !== '') {
      categoryRow = await resolveCategoryByName(categoria, tipoNormalizado);
    }

    if (!categoryRow) {
      return res.status(400).json({
        success: false,
        message: 'RN-003: Debe seleccionar una categoría válida para la transacción.',
      });
    }
    if (categoryRow._error === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'La categoría seleccionada está inactiva.',
      });
    }
    if (categoryRow._error === 'type_mismatch') {
      return res.status(400).json({
        success: false,
        message: `La categoría "${categoryRow.name}" no corresponde a un ${tipoNormalizado === 'ingreso' ? 'ingreso' : 'gasto'}.`,
      });
    }

    // RN-004: usuario responsable desde el token (inyectado por requireAdmin)
    const responsableId = req.user?.id ?? null;

    const result = await pool.query(
      `INSERT INTO transactions
        (tipo, monto, fecha, descripcion, categoria_id, metodo_pago, created_by, referencia)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tipoNormalizado,
        montoNum,
        fecha,
        descripcion || null,
        categoryRow.id,
        metodoPago  || null,
        responsableId,
        referencia  || null,
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
    const { tipo, monto, fecha, descripcion, categoriaId, categoria, metodoPago, referencia } = req.body;

    const existing = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
    }

    const tipoNormalizado = tipo ? normalizeTipo(tipo) : existing.rows[0].tipo;
    if (tipo && !['ingreso', 'gasto'].includes(tipoNormalizado)) {
      return res.status(400).json({
        success: false,
        message: "tipo debe ser 'ingreso' o 'gasto'",
      });
    }

    // Solo se revalida categoría si el request trae categoriaId o categoria
    let categoryRow = null;
    if (categoriaId) {
      categoryRow = await findValidCategory(categoriaId, tipoNormalizado);
    } else if (categoria && categoria.trim() !== '') {
      categoryRow = await resolveCategoryByName(categoria, tipoNormalizado);
    }

    if ((categoriaId || categoria) && !categoryRow) {
      return res.status(400).json({
        success: false,
        message: 'RN-003: Debe seleccionar una categoría válida para la transacción.',
      });
    }
    if (categoryRow?._error === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'La categoría seleccionada está inactiva.',
      });
    }
    if (categoryRow?._error === 'type_mismatch') {
      return res.status(400).json({
        success: false,
        message: `La categoría "${categoryRow.name}" no corresponde a un ${tipoNormalizado === 'ingreso' ? 'ingreso' : 'gasto'}.`,
      });
    }

    const result = await pool.query(
      `UPDATE transactions SET
        tipo        = COALESCE($1, tipo),
        monto       = COALESCE($2, monto),
        fecha       = COALESCE($3, fecha),
        descripcion = COALESCE($4, descripcion),
        categoria_id= COALESCE($5, categoria_id),
        metodo_pago = COALESCE($6, metodo_pago),
        referencia  = COALESCE($7, referencia)
       WHERE id = $8
       RETURNING *`,
      [
        tipo        ? tipoNormalizado     : null,
        monto       ? parseFloat(monto)   : null,
        fecha       || null,
        descripcion || null,
        categoryRow ? categoryRow.id      : null,
        metodoPago  || null,
        referencia  || null,
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