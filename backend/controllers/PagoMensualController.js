const pool = require('../db');

const SELECT_WITH_JOIN = `
  SELECT pm.*, s.nombre AS socio_nombre, s.documento AS socio_documento,
         mp.nombre_mes, mp.anio
  FROM pago_mensual pm
  LEFT JOIN socio s ON s.id_socio = pm.id_socio
  LEFT JOIN meses_periodo mp ON mp.id_periodo = pm.id_periodo
`;

const ESTADOS_VALIDOS = ['pendiente', 'pagado', 'moroso', 'exento', 'cancelado'];

const TRANSICIONES_VALIDAS = {
  pendiente: ['pendiente', 'pagado', 'moroso', 'exento', 'cancelado'],
  moroso:    ['moroso', 'pagado', 'cancelado'],
  exento:    ['exento', 'pagado', 'cancelado'],
  pagado:    ['pagado', 'cancelado'],
  cancelado: ['cancelado'],
};

// GET /api/pagos-mensuales
async function getAll(req, res) {
  try {
    const { estado, idSocio, idPeriodo, search = '' } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (estado) {
      conditions.push(`pm.estado = $${i++}`);
      params.push(estado);
    }
    if (idSocio) {
      conditions.push(`pm.id_socio = $${i++}`);
      params.push(parseInt(idSocio));
    }
    if (idPeriodo) {
      conditions.push(`pm.id_periodo = $${i++}`);
      params.push(parseInt(idPeriodo));
    }
    if (search) {
      conditions.push(`(s.nombre ILIKE $${i} OR s.documento ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `${SELECT_WITH_JOIN} ${where} ORDER BY mp.anio DESC, mp.mes DESC, s.nombre ASC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll pagos mensuales:', error);
    res.status(500).json({ success: false, message: 'Error al obtener pagos mensuales' });
  }
}

// GET /api/pagos-mensuales/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`${SELECT_WITH_JOIN} WHERE pm.id_pago = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pago mensual no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getById pago mensual:', error);
    res.status(500).json({ success: false, message: 'Error al obtener pago mensual' });
  }
}

// POST /api/pagos-mensuales
async function create(req, res) {
  try {
    const { idSocio, idPeriodo, valor, fechaVencimiento, observaciones } = req.body;

    if (!idSocio) {
      return res.status(400).json({ success: false, message: 'El socio es obligatorio' });
    }
    if (!idPeriodo) {
      return res.status(400).json({ success: false, message: 'El periodo es obligatorio' });
    }
    const valorNum = parseFloat(valor);
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ success: false, message: 'El valor debe ser numérico y mayor a cero' });
    }
    if (!fechaVencimiento || isNaN(Date.parse(fechaVencimiento))) {
      return res.status(400).json({ success: false, message: 'Debe ingresar una fecha de vencimiento válida' });
    }

    const duplicado = await pool.query(
      `SELECT id_pago FROM pago_mensual WHERE id_socio = $1 AND id_periodo = $2 AND estado <> 'cancelado'`,
      [idSocio, idPeriodo]
    );
    if (duplicado.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'El socio ya tiene un pago mensual registrado para ese periodo' });
    }

    const result = await pool.query(
      `INSERT INTO pago_mensual (id_socio, id_periodo, valor, fecha_vencimiento, observaciones, estado)
       VALUES ($1,$2,$3,$4,$5,'pendiente')
       RETURNING *`,
      [idSocio, idPeriodo, valorNum, fechaVencimiento, observaciones || null]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Pago mensual creado correctamente' });
  } catch (error) {
    console.error('Error create pago mensual:', error);
    res.status(500).json({ success: false, message: 'Error al crear pago mensual' });
  }
}

// PUT /api/pagos-mensuales/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { valor, fechaVencimiento, observaciones, estado, fechaPago } = req.body;

    const existing = await pool.query('SELECT * FROM pago_mensual WHERE id_pago = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pago mensual no encontrado' });
    }
    const actual = existing.rows[0];

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ success: false, message: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }
    if (estado && !TRANSICIONES_VALIDAS[actual.estado].includes(estado)) {
      return res.status(409).json({
        success: false,
        message: `No se puede cambiar el estado de '${actual.estado}' a '${estado}'`,
      });
    }

    let estadoFinal = estado || actual.estado;
    let fechaPagoFinal = fechaPago !== undefined ? fechaPago : actual.fecha_pago;
    let diasMoraFinal = actual.dias_mora;

    if (estadoFinal === 'pagado' && !fechaPagoFinal) {
      fechaPagoFinal = new Date().toISOString().slice(0, 10);
    }

    const fechaVencimientoFinal = fechaVencimiento || actual.fecha_vencimiento;
    if (fechaPagoFinal && new Date(fechaPagoFinal) > new Date(fechaVencimientoFinal)) {
      diasMoraFinal = Math.floor(
        (new Date(fechaPagoFinal).getTime() - new Date(fechaVencimientoFinal).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (!estado) {
        estadoFinal = 'moroso';
      }
    }

    const result = await pool.query(
      `UPDATE pago_mensual SET
        valor              = COALESCE($1, valor),
        fecha_vencimiento  = COALESCE($2, fecha_vencimiento),
        observaciones      = COALESCE($3, observaciones),
        estado             = $4,
        fecha_pago         = $5,
        dias_mora          = $6,
        updated_at         = CURRENT_TIMESTAMP
       WHERE id_pago = $7
       RETURNING *`,
      [
        valor ? parseFloat(valor) : null,
        fechaVencimiento || null,
        observaciones,
        estadoFinal,
        fechaPagoFinal || null,
        diasMoraFinal,
        id,
      ]
    );

    res.json({ success: true, data: result.rows[0], message: 'Pago mensual actualizado correctamente' });
  } catch (error) {
    console.error('Error update pago mensual:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar pago mensual' });
  }
}

// DELETE /api/pagos-mensuales/:id — solo pagos en estado pendiente se pueden eliminar
async function remove(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT estado FROM pago_mensual WHERE id_pago = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pago mensual no encontrado' });
    }
    if (existing.rows[0].estado !== 'pendiente') {
      return res.status(409).json({
        success: false,
        message: 'Solo se pueden eliminar pagos mensuales en estado pendiente',
      });
    }

    await pool.query('DELETE FROM pago_mensual WHERE id_pago = $1', [id]);

    res.json({ success: true, message: 'Pago mensual eliminado correctamente' });
  } catch (error) {
    console.error('Error delete pago mensual:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar pago mensual' });
  }
}

module.exports = { getAll, getById, create, update, remove };
