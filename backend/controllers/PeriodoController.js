const pool = require('../db');

// GET /api/periodos
async function getAll(req, res) {
  try {
    const { anio } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (anio) {
      conditions.push(`anio = $${i++}`);
      params.push(parseInt(anio));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM meses_periodo ${where} ORDER BY anio DESC, mes DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll periodos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener periodos' });
  }
}

// GET /api/periodos/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM meses_periodo WHERE id_periodo = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getById periodo:', error);
    res.status(500).json({ success: false, message: 'Error al obtener periodo' });
  }
}

// POST /api/periodos
async function create(req, res) {
  try {
    const { anio, mes, nombreMes, fechaInicio, fechaFin, observaciones } = req.body;

    if (!anio || isNaN(parseInt(anio))) {
      return res.status(400).json({ success: false, message: 'El año es obligatorio' });
    }
    const mesNum = parseInt(mes);
    if (!mes || isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ success: false, message: 'El mes debe estar entre 1 y 12' });
    }
    if (!nombreMes || nombreMes.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre del mes es obligatorio' });
    }
    if (!fechaInicio || isNaN(Date.parse(fechaInicio))) {
      return res.status(400).json({ success: false, message: 'Debe ingresar una fecha de inicio válida' });
    }
    if (!fechaFin || isNaN(Date.parse(fechaFin))) {
      return res.status(400).json({ success: false, message: 'Debe ingresar una fecha de fin válida' });
    }

    const result = await pool.query(
      `INSERT INTO meses_periodo (anio, mes, nombre_mes, fecha_inicio, fecha_fin, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [parseInt(anio), mesNum, nombreMes.trim(), fechaInicio, fechaFin, observaciones || null]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Periodo creado correctamente' });
  } catch (error) {
    console.error('Error create periodo:', error);
    res.status(500).json({ success: false, message: 'Error al crear periodo' });
  }
}

// PUT /api/periodos/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { nombreMes, fechaInicio, fechaFin, activo, observaciones } = req.body;

    const existing = await pool.query('SELECT cerrado FROM meses_periodo WHERE id_periodo = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    }
    if (existing.rows[0].cerrado) {
      return res.status(409).json({ success: false, message: 'No se puede editar un periodo cerrado' });
    }

    const result = await pool.query(
      `UPDATE meses_periodo SET
        nombre_mes    = COALESCE($1, nombre_mes),
        fecha_inicio  = COALESCE($2, fecha_inicio),
        fecha_fin     = COALESCE($3, fecha_fin),
        activo        = COALESCE($4, activo),
        observaciones = COALESCE($5, observaciones)
       WHERE id_periodo = $6
       RETURNING *`,
      [nombreMes, fechaInicio, fechaFin, activo, observaciones, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Periodo actualizado correctamente' });
  } catch (error) {
    console.error('Error update periodo:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar periodo' });
  }
}

// DELETE /api/periodos/:id
async function remove(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT cerrado FROM meses_periodo WHERE id_periodo = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    }
    if (existing.rows[0].cerrado) {
      return res.status(409).json({ success: false, message: 'No se puede eliminar un periodo cerrado' });
    }

    const pagos = await pool.query('SELECT id_pago FROM pago_mensual WHERE id_periodo = $1 LIMIT 1', [id]);
    if (pagos.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'No se puede eliminar un periodo con pagos mensuales asociados' });
    }

    await pool.query('DELETE FROM meses_periodo WHERE id_periodo = $1', [id]);

    res.json({ success: true, message: 'Periodo eliminado correctamente' });
  } catch (error) {
    console.error('Error delete periodo:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar periodo' });
  }
}

module.exports = { getAll, getById, create, update, remove };
