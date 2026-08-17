const pool = require('../db');
const ExcelJS = require('exceljs');

const SELECT_WITH_SOCIO = `
  SELECT a.*, s.nombre AS socio_nombre, s.documento AS socio_documento
  FROM asistencia a
  LEFT JOIN socio s ON s.id_socio = a.id_socio
`;

// GET /api/asistencia (RF-065: visualizar)
async function getAll(req, res) {
  try {
    const { idSocio, estado, fechaInicio, fechaFin } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (idSocio) {
      conditions.push(`a.id_socio = $${i++}`);
      params.push(parseInt(idSocio));
    }
    if (estado) {
      conditions.push(`a.estado = $${i++}`);
      params.push(estado);
    }
    if (fechaInicio) {
      conditions.push(`a.fecha >= $${i++}`);
      params.push(fechaInicio);
    }
    if (fechaFin) {
      conditions.push(`a.fecha <= $${i++}`);
      params.push(fechaFin);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `${SELECT_WITH_SOCIO} ${where} ORDER BY a.fecha DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al obtener asistencia' });
  }
}

// GET /api/asistencia/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`${SELECT_WITH_SOCIO} WHERE a.id_asistencia = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro de asistencia no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getById asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al obtener registro de asistencia' });
  }
}

// POST /api/asistencia (RF-064: registrar)
async function create(req, res) {
  try {
    const { idSocio, fecha, tipoEntrenamiento, estado, observacion } = req.body;

    if (!idSocio) {
      return res.status(400).json({ success: false, message: 'El socio es obligatorio' });
    }
    if (!fecha || isNaN(Date.parse(fecha))) {
      return res.status(400).json({ success: false, message: 'Debe ingresar una fecha válida' });
    }
    if (!estado || !['Presente', 'Ausente', 'Justificado', 'Tarde'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: "estado debe ser 'Presente', 'Ausente', 'Justificado' o 'Tarde'",
      });
    }

    const result = await pool.query(
      `INSERT INTO asistencia (id_socio, fecha, tipo_entrenamiento, estado, observacion, registrado_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [idSocio, fecha, tipoEntrenamiento || null, estado, observacion || null, req.user.id]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Asistencia registrada correctamente' });
  } catch (error) {
    console.error('Error create asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al registrar asistencia' });
  }
}

// PUT /api/asistencia/:id (RF-067: editar)
async function update(req, res) {
  try {
    const { id } = req.params;
    const { fecha, tipoEntrenamiento, estado, observacion } = req.body;

    const exists = await pool.query('SELECT id_asistencia FROM asistencia WHERE id_asistencia = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro de asistencia no encontrado' });
    }
    if (estado && !['Presente', 'Ausente', 'Justificado', 'Tarde'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: "estado debe ser 'Presente', 'Ausente', 'Justificado' o 'Tarde'",
      });
    }

    const result = await pool.query(
      `UPDATE asistencia SET
        fecha              = COALESCE($1, fecha),
        tipo_entrenamiento = COALESCE($2, tipo_entrenamiento),
        estado             = COALESCE($3, estado),
        observacion        = COALESCE($4, observacion)
       WHERE id_asistencia = $5
       RETURNING *`,
      [fecha, tipoEntrenamiento, estado, observacion, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Asistencia actualizada correctamente' });
  } catch (error) {
    console.error('Error update asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar asistencia' });
  }
}

// DELETE /api/asistencia/:id (RF-068: eliminar)
async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM asistencia WHERE id_asistencia = $1 RETURNING id_asistencia', [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro de asistencia no encontrado' });
    }

    res.json({ success: true, message: 'Registro de asistencia eliminado correctamente' });
  } catch (error) {
    console.error('Error delete asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar registro de asistencia' });
  }
}

// GET /api/asistencia/alertas (RF-066: alertas por inasistencia acumulada/consecutiva)
// Umbral configurable por query params; por defecto 3 consecutivas o 5 acumuladas
// en los últimos 30 días.
async function getAlertas(req, res) {
  try {
    const umbralConsecutivas = parseInt(req.query.umbralConsecutivas) || 3;
    const umbralAcumuladas   = parseInt(req.query.umbralAcumuladas)   || 5;
    const dias               = parseInt(req.query.dias)               || 30;

    const historial = await pool.query(
      `SELECT a.id_socio, s.nombre AS socio_nombre, a.fecha, a.estado
       FROM asistencia a
       JOIN socio s ON s.id_socio = a.id_socio
       WHERE a.fecha >= (CURRENT_DATE - $1::int)
       ORDER BY a.id_socio, a.fecha ASC`,
      [dias]
    );

    const porSocio = new Map();
    for (const row of historial.rows) {
      if (!porSocio.has(row.id_socio)) {
        porSocio.set(row.id_socio, { socio_nombre: row.socio_nombre, registros: [] });
      }
      porSocio.get(row.id_socio).registros.push(row);
    }

    const alertas = [];
    for (const [idSocio, { socio_nombre, registros }] of porSocio) {
      const acumuladas = registros.filter(r => r.estado === 'Ausente').length;

      let consecutivasActuales = 0;
      let maxConsecutivas = 0;
      for (const r of registros) {
        if (r.estado === 'Ausente') {
          consecutivasActuales++;
          maxConsecutivas = Math.max(maxConsecutivas, consecutivasActuales);
        } else {
          consecutivasActuales = 0;
        }
      }

      if (acumuladas >= umbralAcumuladas || maxConsecutivas >= umbralConsecutivas) {
        alertas.push({
          idSocio,
          socioNombre: socio_nombre,
          inasistenciasAcumuladas: acumuladas,
          inasistenciasConsecutivas: maxConsecutivas,
          motivo: maxConsecutivas >= umbralConsecutivas ? 'consecutiva' : 'acumulada',
        });
      }
    }

    res.json({ success: true, data: alertas, meta: { umbralConsecutivas, umbralAcumuladas, dias } });
  } catch (error) {
    console.error('Error getAlertas asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al calcular alertas de asistencia' });
  }
}

// GET /api/asistencia/exportar-excel (RF-069: exportar)
async function exportarExcel(req, res) {
  try {
    const { idSocio, fechaInicio, fechaFin } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (idSocio) {
      conditions.push(`a.id_socio = $${i++}`);
      params.push(parseInt(idSocio));
    }
    if (fechaInicio) {
      conditions.push(`a.fecha >= $${i++}`);
      params.push(fechaInicio);
    }
    if (fechaFin) {
      conditions.push(`a.fecha <= $${i++}`);
      params.push(fechaFin);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `${SELECT_WITH_SOCIO} ${where} ORDER BY a.fecha DESC`,
      params
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Asistencia');
    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Socio', key: 'socio_nombre', width: 25 },
      { header: 'Documento', key: 'socio_documento', width: 18 },
      { header: 'Tipo Entrenamiento', key: 'tipo_entrenamiento', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Observación', key: 'observacion', width: 30 },
    ];

    result.rows.forEach(r => {
      sheet.addRow({
        fecha: new Date(r.fecha).toISOString().split('T')[0],
        socio_nombre: r.socio_nombre,
        socio_documento: r.socio_documento,
        tipo_entrenamiento: r.tipo_entrenamiento || 'N/A',
        estado: r.estado,
        observacion: r.observacion || '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Asistencia.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exportarExcel asistencia:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Error al exportar asistencia' });
    }
  }
}

module.exports = { getAll, getById, create, update, remove, getAlertas, exportarExcel };
