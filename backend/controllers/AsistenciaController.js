const pool = require('../db');
const ExcelJS = require('exceljs');

const fechaIsoValida = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;

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
    // RN-004: solo socios activos (mismo criterio que la checklist).
    const socio = await pool.query('SELECT estado FROM socio WHERE id_socio = $1', [idSocio]);
    if (socio.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Socio no encontrado' });
    }
    if (socio.rows[0].estado !== 'activo') {
      return res.status(400).json({ success: false, message: 'No se puede registrar asistencia de un socio inactivo' });
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
    const { idSocio, fecha, tipoEntrenamiento, estado, observacion } = req.body;

    const exists = await pool.query('SELECT id_asistencia, id_socio FROM asistencia WHERE id_asistencia = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro de asistencia no encontrado' });
    }
    // El socio de un registro no se cambia: si es otro socio, se elimina y se registra de nuevo.
    if (idSocio !== undefined && idSocio !== null && idSocio !== '' && Number(idSocio) !== exists.rows[0].id_socio) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el socio de un registro de asistencia. Elimínalo y registra uno nuevo.',
      });
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

// POST /api/asistencia/checklist (checklist masiva: registra/actualiza asistencia de varios socios en una fecha)
async function saveChecklist(req, res) {
  const client = await pool.connect();
  try {
    const { fecha, tipoEntrenamiento, registros } = req.body;
    const estadosValidos = ['Presente', 'Ausente', 'Justificado', 'Tarde'];

    if (!fecha || isNaN(Date.parse(fecha))) {
      return res.status(400).json({ success: false, message: 'Debe ingresar una fecha válida' });
    }
    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe incluir al menos un registro de socio' });
    }
    for (const r of registros) {
      if (!r.idSocio || !estadosValidos.includes(r.estado)) {
        return res.status(400).json({
          success: false,
          message: "Cada registro debe tener idSocio y estado ('Presente', 'Ausente', 'Justificado' o 'Tarde')",
        });
      }
    }
    const ids = registros.map(r => Number(r.idSocio));
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ success: false, message: 'Hay socios repetidos en la lista' });
    }
    // Solo socios existentes y activos (mismo criterio que el formulario).
    const activos = await client.query(
      `SELECT id_socio FROM socio WHERE id_socio = ANY($1::int[]) AND estado = 'activo'`, [ids]
    );
    if (activos.rows.length !== ids.length) {
      return res.status(400).json({ success: false, message: 'La lista incluye socios inexistentes o inactivos' });
    }

    await client.query('BEGIN');

    let creados = 0;
    let actualizados = 0;

    for (const r of registros) {
      const existing = await client.query(
        'SELECT id_asistencia FROM asistencia WHERE id_socio = $1 AND fecha = $2',
        [r.idSocio, fecha]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE asistencia SET
            estado             = $1,
            tipo_entrenamiento = COALESCE($2, tipo_entrenamiento),
            observacion        = COALESCE($3, observacion)
           WHERE id_asistencia = $4`,
          [r.estado, tipoEntrenamiento || null, r.observacion || null, existing.rows[0].id_asistencia]
        );
        actualizados++;
      } else {
        await client.query(
          `INSERT INTO asistencia (id_socio, fecha, tipo_entrenamiento, estado, observacion, registrado_by)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [r.idSocio, fecha, tipoEntrenamiento || null, r.estado, r.observacion || null, req.user.id]
        );
        creados++;
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Checklist guardada: ${creados} registrada${creados !== 1 ? 's' : ''}, ${actualizados} actualizada${actualizados !== 1 ? 's' : ''}`,
      data: { creados, actualizados },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saveChecklist asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al guardar checklist de asistencia' });
  } finally {
    client.release();
  }
}

// GET /api/asistencia/alertas (RF-066: alertas por inasistencia acumulada/consecutiva)
// Umbral configurable por query params; por defecto 3 consecutivas o 5 acumuladas
// en los últimos 30 días.
async function getAlertas(req, res) {
  try {
    // RF-084 RN-003: umbrales configurados en system_data; la URL aún puede sobrescribirlos.
    const config = await pool.query(
      'SELECT umbral_inasistencia_consecutiva AS c, umbral_inasistencia_acumulada AS a FROM system_data WHERE id = 1'
    );
    const umbralConsecutivas = parseInt(req.query.umbralConsecutivas) || config.rows[0]?.c || 3;
    const umbralAcumuladas   = parseInt(req.query.umbralAcumuladas)   || config.rows[0]?.a || 5;
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

    // Las fechas van al nombre del archivo: se exige AAAA-MM-DD real (rechaza 2026-02-30).
    if ([fechaInicio, fechaFin].some(f => f && !fechaIsoValida(f))) {
      return res.status(400).json({ success: false, message: 'Las fechas deben tener el formato AAAA-MM-DD' });
    }
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      return res.status(400).json({ success: false, message: 'La fecha final no puede ser menor que la fecha inicial' });
    }

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

    // RN2 (RF-087): el periodo consultado va encima de la tabla y en el nombre del archivo.
    const desde = fechaInicio || 'inicio';
    const hasta = fechaFin || 'fin';
    sheet.spliceRows(1, 0, [`Periodo consultado: ${fechaInicio || 'sin fecha inicial'} a ${fechaFin || 'sin fecha final'}`], []);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Asistencia_${desde}_${hasta}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exportarExcel asistencia:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Error al exportar asistencia' });
    }
  }
}

module.exports = { getAll, getById, create, update, remove, saveChecklist, getAlertas, exportarExcel };