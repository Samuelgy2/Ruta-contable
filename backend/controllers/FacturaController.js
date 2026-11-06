const pool = require('../db');

// Facturación (RF-055 / RF-058). Tablas: factura, detalle_factura, pago_factura.
// El proveedor es texto libre (factura.proveedor_nombre) desde que se retiró la tabla proveedores (D7).
//
// ponytail: un pago de factura no crea asiento en transactions; el egreso de una compra
// ya se contabiliza al aprobarla y duplicarlo descuadraría el saldo. Enlazar
// pago_factura.id_transaccion cuando se defina qué facturas no vienen de una compra.

const METODOS_PAGO_VALIDOS = ['efectivo', 'transferencia', 'tarjeta', 'cheque'];

// Dinero en centavos para comparar sin errores de coma flotante.
const centavos = (v) => Math.round(Number(v) * 100);

const SELECT_FACTURA = `
  SELECT f.*, s.nombre AS socio_nombre, s.documento AS socio_documento,
         (f.valor_total - f.monto_pagado) AS saldo
  FROM factura f
  LEFT JOIN socio s ON s.id_socio = f.id_socio
`;

// Valida cabecera y detalles; devuelve { error } o { datos } con los totales ya calculados.
// RN-001: tercero obligatorio (socio existente o proveedor). RN-002: al menos un detalle.
// RN-003: el total se calcula de los detalles: Σ (cantidad × valor_unitario − descuento + iva).
function validarFactura(body) {
  const { fecha, concepto, idSocio, proveedorNombre, nroFactura, fechaVencimiento, observaciones, detalles } = body || {};
  const proveedor = typeof proveedorNombre === 'string' ? proveedorNombre.trim() : '';

  if (!fecha || isNaN(Date.parse(fecha))) return { error: 'Debe ingresar una fecha válida' };
  if (fechaVencimiento && (isNaN(Date.parse(fechaVencimiento)) || fechaVencimiento < fecha)) {
    return { error: 'La fecha de vencimiento no puede ser anterior a la fecha de la factura' };
  }
  if (typeof concepto !== 'string' || !concepto.trim() || concepto.trim().length > 200) {
    return { error: 'El concepto es obligatorio (máximo 200 caracteres)' };
  }
  if (!idSocio === !proveedor) return { error: 'La factura debe tener un socio o un proveedor (uno de los dos)' };
  if (proveedor.length > 150) return { error: 'El nombre del proveedor admite máximo 150 caracteres' };
  if (nroFactura && String(nroFactura).trim().length > 50) return { error: 'El número de factura admite máximo 50 caracteres' };
  if (!Array.isArray(detalles) || detalles.length === 0) return { error: 'La factura debe tener al menos un detalle' };

  const lineas = [];
  let totalCentavos = 0;
  for (const [i, d] of detalles.entries()) {
    const n = i + 1;
    const servicio = typeof d?.servicio === 'string' ? d.servicio.trim() : '';
    const cantidad = Number(d?.cantidad ?? 1);
    const valorUnitario = Number(d?.valorUnitario);
    const descuento = Number(d?.descuento ?? 0);
    const iva = Number(d?.iva ?? 0);

    if (!servicio || servicio.length > 200) return { error: `Detalle ${n}: el producto o servicio es obligatorio (máximo 200 caracteres)` };
    if (!Number.isInteger(cantidad) || cantidad < 1) return { error: `Detalle ${n}: la cantidad debe ser un entero mayor a cero` };
    if (!(valorUnitario > 0)) return { error: `Detalle ${n}: el valor unitario debe ser mayor a cero` };
    if (!(descuento >= 0) || !(iva >= 0)) return { error: `Detalle ${n}: descuento e IVA no pueden ser negativos` };

    const bruto = cantidad * centavos(valorUnitario);
    if (centavos(descuento) > bruto) return { error: `Detalle ${n}: el descuento no puede superar el subtotal` };
    totalCentavos += bruto - centavos(descuento) + centavos(iva);
    lineas.push({ servicio, descripcion: d.descripcion?.trim() || null, cantidad, valorUnitario, descuento, iva });
  }
  if (totalCentavos <= 0) return { error: 'El total de la factura debe ser mayor a cero' };

  return {
    datos: {
      fecha, concepto: concepto.trim(), idSocio: idSocio ? Number(idSocio) : null, proveedor: proveedor || null,
      nroFactura: nroFactura ? String(nroFactura).trim() : null, fechaVencimiento: fechaVencimiento || null,
      observaciones: observaciones?.trim() || null, lineas, total: totalCentavos / 100,
    },
  };
}

async function insertarDetalles(client, idFactura, lineas) {
  for (const [i, l] of lineas.entries()) {
    await client.query(
      `INSERT INTO detalle_factura (id_factura, nro_linea, servicio, descripcion, cantidad, valor_unitario, descuento, iva)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [idFactura, i + 1, l.servicio, l.descripcion, l.cantidad, l.valorUnitario, l.descuento, l.iva]
    );
  }
}

async function enTransaccion(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await fn(client);
    await client.query('COMMIT');
    return r;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

// Error con status HTTP para cortar una transacción con un 4xx.
const fallo = (status, message) => Object.assign(new Error(message), { status });

function responderError(res, error, contexto, mensaje) {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  if (error.code === '23503') return res.status(400).json({ success: false, message: 'El socio indicado no existe' });
  console.error(`Error ${contexto} factura:`, error);
  res.status(500).json({ success: false, message: mensaje });
}

// GET /api/facturas?estado=&search=
async function getAll(req, res) {
  try {
    const { estado, search = '' } = req.query;
    const conditions = [];
    const params = [];
    if (estado) {
      params.push(estado);
      conditions.push(`f.estado = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const p = `$${params.length}`;
      conditions.push(`(f.concepto ILIKE ${p} OR f.nro_factura ILIKE ${p} OR f.proveedor_nombre ILIKE ${p} OR s.nombre ILIKE ${p})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`${SELECT_FACTURA} ${where} ORDER BY f.fecha DESC, f.id_factura DESC`, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    responderError(res, error, 'getAll', 'Error al obtener facturas');
  }
}

// GET /api/facturas/:id — con detalles y pagos
async function getById(req, res) {
  try {
    const id = Number(req.params.id) || 0;
    const { rows } = await pool.query(`${SELECT_FACTURA} WHERE f.id_factura = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    const [detalles, pagos] = await Promise.all([
      pool.query('SELECT * FROM detalle_factura WHERE id_factura = $1 ORDER BY nro_linea', [id]),
      pool.query('SELECT * FROM pago_factura WHERE id_factura = $1 ORDER BY fecha, id_pago_factura', [id]),
    ]);
    res.json({ success: true, data: { ...rows[0], detalles: detalles.rows, pagos: pagos.rows } });
  } catch (error) {
    responderError(res, error, 'getById', 'Error al obtener la factura');
  }
}

// POST /api/facturas
async function create(req, res) {
  const { error, datos } = validarFactura(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const factura = await enTransaccion(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO factura (fecha, fecha_emision, concepto, valor_total, id_socio, proveedor_nombre, nro_factura, numero_factura,
                              fecha_vencimiento, observaciones, estado, created_by)
         VALUES ($1,$1,$2,$3,$4,$5,$6,$6,$7,$8,'Emitida',$9) RETURNING id_factura`,
        [datos.fecha, datos.concepto, datos.total, datos.idSocio, datos.proveedor, datos.nroFactura,
         datos.fechaVencimiento, datos.observaciones, req.user?.id ?? null]
      );
      const id = rows[0].id_factura;
      if (!datos.nroFactura) {
        // Consecutivo a partir del id: único sin carreras entre peticiones simultáneas.
        const nro = `FAC-${datos.fecha.slice(0, 4)}-${String(id).padStart(4, '0')}`;
        await client.query('UPDATE factura SET nro_factura = $1, numero_factura = $1 WHERE id_factura = $2', [nro, id]);
      }
      await insertarDetalles(client, id, datos.lineas);
      return (await client.query(`${SELECT_FACTURA} WHERE f.id_factura = $1`, [id])).rows[0];
    });
    res.status(201).json({ success: true, data: factura, message: 'Factura registrada correctamente' });
  } catch (err) {
    responderError(res, err, 'create', 'Error al registrar la factura');
  }
}

// PUT /api/facturas/:id — solo facturas emitidas y sin pagos; reemplaza los detalles.
async function update(req, res) {
  const { error, datos } = validarFactura(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const factura = await enTransaccion(async (client) => {
      const id = Number(req.params.id) || 0;
      const actual = await client.query('SELECT estado, monto_pagado FROM factura WHERE id_factura = $1 FOR UPDATE', [id]);
      if (!actual.rows[0]) throw fallo(404, 'Factura no encontrada');
      if (actual.rows[0].estado !== 'Emitida' || Number(actual.rows[0].monto_pagado) > 0) {
        throw fallo(409, 'Solo se pueden editar facturas emitidas que no tengan pagos');
      }
      await client.query(
        `UPDATE factura SET fecha = $1, concepto = $2, valor_total = $3, id_socio = $4, proveedor_nombre = $5,
                nro_factura = COALESCE($6, nro_factura), numero_factura = COALESCE($6, numero_factura),
                fecha_vencimiento = $7, observaciones = $8
         WHERE id_factura = $9`,
        [datos.fecha, datos.concepto, datos.total, datos.idSocio, datos.proveedor, datos.nroFactura,
         datos.fechaVencimiento, datos.observaciones, id]
      );
      await client.query('DELETE FROM detalle_factura WHERE id_factura = $1', [id]);
      await insertarDetalles(client, id, datos.lineas);
      return (await client.query(`${SELECT_FACTURA} WHERE f.id_factura = $1`, [id])).rows[0];
    });
    res.json({ success: true, data: factura, message: 'Factura actualizada correctamente' });
  } catch (err) {
    responderError(res, err, 'update', 'Error al actualizar la factura');
  }
}

// POST /api/facturas/:id/anular — una factura con pagos no se anula.
async function anular(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE factura SET estado = 'Anulada'
       WHERE id_factura = $1 AND estado = 'Emitida' AND monto_pagado = 0
       RETURNING id_factura`,
      [Number(req.params.id) || 0]
    );
    if (!rows[0]) {
      return res.status(409).json({ success: false, message: 'Solo se pueden anular facturas emitidas que no tengan pagos' });
    }
    res.json({ success: true, message: 'Factura anulada' });
  } catch (error) {
    responderError(res, error, 'anular', 'Error al anular la factura');
  }
}

// POST /api/facturas/:id/pagos — RN-004 varios pagos; RN-005 no superar el saldo; RN-006 pagada al cubrir el total.
async function registrarPago(req, res) {
  const { monto, metodoPago = 'efectivo', fecha, referencia, observaciones } = req.body || {};
  const montoNum = Number(monto);
  if (!(montoNum > 0)) return res.status(400).json({ success: false, message: 'El monto debe ser mayor a cero' });
  if (!METODOS_PAGO_VALIDOS.includes(metodoPago)) {
    return res.status(400).json({ success: false, message: `metodoPago debe ser uno de: ${METODOS_PAGO_VALIDOS.join(', ')}` });
  }
  if (fecha && isNaN(Date.parse(fecha))) return res.status(400).json({ success: false, message: 'Debe ingresar una fecha válida' });
  if (referencia && String(referencia).length > 100) {
    return res.status(400).json({ success: false, message: 'La referencia admite máximo 100 caracteres' });
  }

  try {
    const factura = await enTransaccion(async (client) => {
      const id = Number(req.params.id) || 0;
      const actual = await client.query('SELECT estado, valor_total, monto_pagado FROM factura WHERE id_factura = $1 FOR UPDATE', [id]);
      const f = actual.rows[0];
      if (!f) throw fallo(404, 'Factura no encontrada');
      if (f.estado === 'Anulada' || f.estado === 'Pagada') throw fallo(409, `La factura está ${f.estado.toLowerCase()} y no admite pagos`);

      const saldo = centavos(f.valor_total) - centavos(f.monto_pagado);
      if (centavos(montoNum) > saldo) {
        throw fallo(400, `El pago supera el saldo pendiente (${(saldo / 100).toFixed(2)})`);
      }
      const usuario = req.user?.id ?? null;
      await client.query(
        `INSERT INTO pago_factura (id_factura, fecha, fecha_pago, monto, metodo_pago, referencia, observaciones, created_by, registrado_by)
         VALUES ($1, COALESCE($2::date, CURRENT_DATE), COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, $7, $7)`,
        [id, fecha || null, montoNum, metodoPago, referencia || null, observaciones || null, usuario]
      );
      const pagadoTotal = centavos(f.monto_pagado) + centavos(montoNum);
      await client.query(
        'UPDATE factura SET monto_pagado = $1, estado = $2 WHERE id_factura = $3',
        [pagadoTotal / 100, pagadoTotal >= centavos(f.valor_total) ? 'Pagada' : f.estado, id]
      );
      return (await client.query(`${SELECT_FACTURA} WHERE f.id_factura = $1`, [id])).rows[0];
    });
    res.status(201).json({ success: true, data: factura, message: factura.estado === 'Pagada' ? 'Pago registrado. La factura quedó pagada.' : 'Pago registrado' });
  } catch (err) {
    responderError(res, err, 'registrarPago', 'Error al registrar el pago');
  }
}

module.exports = { getAll, getById, create, update, anular, registrarPago, validarFactura };
