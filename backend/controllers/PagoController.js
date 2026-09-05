const crypto = require('crypto');
const pool = require('../db');
const paypal = require('../services/paypalClient');

const PROVEEDOR = 'paypal';
const MONEDA = 'USD'; // PayPal no opera en pesos colombianos.

// Catálogo de conceptos cobrables. El monto lo fija SIEMPRE el backend: el
// cliente sólo elige el concepto. Si se aceptara el monto del cliente,
// cualquiera pagaría lo que quisiera.
const CONCEPTOS = {
  mensualidad: { descripcion: 'Mensualidad del club', monto: 12.00 },
  inscripcion: { descripcion: 'Inscripción al club',  monto: 30.00 },
  uniforme:    { descripcion: 'Uniforme del club',    monto: 45.00 },
};

// Traducción del evento de PayPal al vocabulario propio de la aplicación.
// CHECKOUT.ORDER.APPROVED se queda en PENDING a propósito: el comprador dio su
// visto bueno, pero con intent CAPTURE el dinero no está cobrado hasta que se
// llama a /capture y llega PAYMENT.CAPTURE.COMPLETED.
const EVENTOS = {
  'CHECKOUT.ORDER.APPROVED':   'PENDING',
  'PAYMENT.CAPTURE.COMPLETED': 'APPROVED',
  'PAYMENT.CAPTURE.DENIED':    'DECLINED',
  'PAYMENT.CAPTURE.PENDING':   'PENDING',
  'PAYMENT.CAPTURE.REFUNDED':  'REFUNDED',
};

// Estados propios que dan por cerrado el pago.
const ESTADOS_FINALES = ['APPROVED', 'DECLINED', 'VOIDED', 'REFUNDED', 'ERROR'];

// transactions.metodo_pago sólo admite el vocabulario contable del club, y un
// pago de la pasarela nunca es efectivo.
const METODO_CONTABLE = 'tarjeta';

// Referencia única e irrepetible: es la clave de idempotencia.
function generarReferencia(userId) {
  const aleatorio = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `RC-${userId}-${Date.now()}-${aleatorio}`;
}

// POST /api/pagos/checkout — crea la fila PENDING y la orden en PayPal
async function checkout(req, res) {
  try {
    const { concepto } = req.body || {};

    const definicion = CONCEPTOS[concepto];
    if (!definicion) {
      return res.status(400).json({
        success: false,
        message: `Concepto no válido. Opciones: ${Object.keys(CONCEPTOS).join(', ')}`,
      });
    }

    const userId = req.user.id;

    // id_socio no viaja en la sesión: vive en socio_perfil y se consulta aquí.
    const perfil = await pool.query(
      'SELECT id_socio FROM socio_perfil WHERE user_id = $1',
      [userId]
    );
    const idSocio = perfil.rows[0]?.id_socio ?? null;

    const monto = definicion.monto;
    const amountInCents = Math.round(monto * 100);
    const referencia = generarReferencia(userId);

    const insertado = await pool.query(
      `INSERT INTO pagos_pasarela
         (referencia, proveedor, user_id, id_socio, concepto, monto, amount_in_cents, moneda, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
       RETURNING id, referencia, concepto, monto, amount_in_cents, moneda, estado, created_at`,
      [
        referencia,
        PROVEEDOR,
        userId,
        idSocio ?? null,
        definicion.descripcion,
        monto,
        amountInCents,
        MONEDA,
      ]
    );

    const pago = insertado.rows[0];

    let orden;
    try {
      orden = await paypal.crearOrden({
        referencia,
        monto,
        moneda: MONEDA,
        concepto: definicion.descripcion,
      });
    } catch (error) {
      // La orden no llegó a existir en PayPal: el pago queda marcado en error
      // para no dejar una fila PENDING que nunca va a resolverse.
      await pool.query(
        `UPDATE pagos_pasarela SET estado = 'ERROR', finalized_at = NOW(), updated_at = NOW()
          WHERE id = $1`,
        [pago.id]
      );

      console.error('❌ Error creando la orden en PayPal:', error.message);
      return res.status(502).json({ success: false, message: 'No se pudo crear la orden de pago' });
    }

    await pool.query(
      'UPDATE pagos_pasarela SET orden_id = $1, updated_at = NOW() WHERE id = $2',
      [orden.id, pago.id]
    );

    // El enlace de aprobación por si se quiere redirigir en vez de usar el SDK.
    const enlaceAprobacion = (orden.links || []).find(l => l.rel === 'approve')?.href ?? null;

    res.status(201).json({
      success: true,
      message: 'Orden de pago creada correctamente',
      data: {
        pago: { ...pago, orden_id: orden.id },
        referencia,
        ordenId: orden.id,
        estadoProveedor: orden.status ?? null,
        moneda: MONEDA,
        monto,
        amountInCents,
        enlaceAprobacion,
      },
    });
  } catch (error) {
    console.error('❌ Error en checkout:', error);
    res.status(500).json({ success: false, message: 'Error al generar la orden de pago' });
  }
}

// Busca la categoría de ingreso donde aterrizan los pagos de la pasarela.
async function buscarCategoriaIngreso(client) {
  const preferida = await client.query(
    `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND type = 'income' AND active = true LIMIT 1`,
    ['Cuotas de Socios']
  );
  if (preferida.rows.length > 0) return preferida.rows[0].id;

  const cualquiera = await client.query(
    `SELECT id FROM categories WHERE type = 'income' AND active = true ORDER BY id LIMIT 1`
  );
  return cualquiera.rows[0]?.id ?? null;
}

// Extrae del recurso del evento lo que necesitamos para localizar y valorar el pago.
function datosDelEvento(evento) {
  const recurso = evento?.resource ?? {};

  // En los eventos de captura el recurso es la captura; en CHECKOUT.ORDER.* es
  // la orden, y la referencia viaja dentro de purchase_units.
  const unidad = Array.isArray(recurso.purchase_units) ? recurso.purchase_units[0] : null;

  const referencia = recurso.custom_id
    ?? unidad?.custom_id
    ?? unidad?.reference_id
    ?? null;

  // El id de la orden: en una captura llega en supplementary_data o en el enlace 'up'.
  const ordenId = recurso.supplementary_data?.related_ids?.order_id
    ?? (evento?.event_type?.startsWith('CHECKOUT.ORDER.') ? recurso.id : null)
    ?? null;

  // El id de la captura sólo existe en los eventos PAYMENT.CAPTURE.*.
  const capturaId = evento?.event_type?.startsWith('PAYMENT.CAPTURE.') ? recurso.id ?? null : null;

  const valor = recurso.amount?.value ?? unidad?.amount?.value ?? null;
  const monto = valor === null ? null : Number(valor);

  return {
    referencia,
    ordenId,
    capturaId,
    monto: Number.isFinite(monto) ? monto : null,
    estadoProveedor: recurso.status ?? null,
  };
}

// POST /api/pagos/webhook — público. Su autenticación es la verificación remota
// de la firma contra PayPal.
async function webhook(req, res) {
  const evento = req.body;

  if (!evento || typeof evento !== 'object' || !evento.event_type) {
    return res.status(400).json({ success: false, message: 'El evento no tiene el formato esperado' });
  }

  // Firma no verificada: 401 y no se toca la base de datos.
  const firmaValida = await paypal.verificarFirmaWebhook(req.headers, evento);
  if (!firmaValida) {
    console.warn('⚠️  Webhook de PayPal con firma no verificada, descartado');
    return res.status(401).json({ success: false, message: 'Firma del evento no válida' });
  }

  const estadoPropio = EVENTOS[evento.event_type];

  // Un evento que no manejamos se acepta con 200 para que PayPal no lo reintente
  // durante tres días, pero no cambia nada.
  if (!estadoPropio) {
    return res.json({
      success: true,
      message: `Evento ${evento.event_type} recibido y omitido`,
      data: null,
    });
  }

  const { referencia, ordenId, capturaId, monto, estadoProveedor } = datosDelEvento(evento);

  if (!referencia && !ordenId && !capturaId) {
    return res.status(400).json({ success: false, message: 'El evento no permite identificar el pago' });
  }

  const client = await pool.connect();
  let capturarDespues = null;

  try {
    await client.query('BEGIN');

    // FOR UPDATE serializa los reintentos de PayPal sobre la misma fila.
    const existente = await client.query(
      `SELECT id, referencia, user_id, estado, transaction_id, finalized_at, concepto, orden_id, proveedor_id
         FROM pagos_pasarela
        WHERE referencia = $1 OR orden_id = $2 OR proveedor_id = $3
        LIMIT 1
        FOR UPDATE`,
      [referencia, ordenId, capturaId]
    );

    if (existente.rows.length === 0) {
      await client.query('ROLLBACK');
      console.warn(`⚠️  Webhook de un pago desconocido (referencia ${referencia})`);
      // 200 para que PayPal no reintente 25 veces algo que nunca vamos a reconocer.
      return res.json({ success: true, message: 'Pago no registrado en el sistema', data: null });
    }

    const pago = existente.rows[0];

    // PayPal reintenta hasta 25 veces en 3 días: si esta captura ya está
    // procesada se responde 200 sin duplicar nada.
    const yaProcesado = pago.finalized_at !== null
      || (capturaId !== null && pago.proveedor_id === capturaId && ESTADOS_FINALES.includes(pago.estado));

    if (yaProcesado) {
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        message: 'El pago ya estaba procesado',
        data: { referencia: pago.referencia, estado: pago.estado },
      });
    }

    const esFinal = ESTADOS_FINALES.includes(estadoPropio);

    await client.query(
      `UPDATE pagos_pasarela SET
         orden_id         = COALESCE($1, orden_id),
         proveedor_id     = COALESCE($2, proveedor_id),
         estado           = $3,
         estado_proveedor = COALESCE($4, estado_proveedor),
         monto            = COALESCE($5, monto),
         amount_in_cents  = COALESCE($6, amount_in_cents),
         payload_raw      = $7,
         finalized_at     = CASE WHEN $8 THEN NOW() ELSE finalized_at END,
         updated_at       = NOW()
       WHERE id = $9`,
      [
        ordenId,
        capturaId,
        estadoPropio,
        estadoProveedor,
        monto,
        monto === null ? null : Math.round(monto * 100),
        JSON.stringify(evento),
        esFinal,
        pago.id,
      ]
    );

    let transactionId = pago.transaction_id;

    // Sólo un pago cuyo estado propio quede en APPROVED genera asiento contable.
    if (estadoPropio === 'APPROVED' && transactionId === null) {
      // Se comprueba antes de insertar en lugar de depender del índice único.
      const asientoPrevio = await client.query(
        'SELECT id FROM transactions WHERE referencia = $1 LIMIT 1',
        [pago.referencia]
      );

      if (asientoPrevio.rows.length > 0) {
        transactionId = asientoPrevio.rows[0].id;
      } else {
        const categoriaId = await buscarCategoriaIngreso(client);

        const asiento = await client.query(
          `INSERT INTO transactions
             (tipo, monto, fecha, descripcion, categoria_id, metodo_pago, referencia, created_by)
           VALUES ('ingreso', $1, CURRENT_DATE, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            monto,
            pago.concepto || 'Pago en línea',
            categoriaId,
            METODO_CONTABLE,
            pago.referencia,
            pago.user_id,
          ]
        );

        transactionId = asiento.rows[0].id;
      }

      await client.query(
        'UPDATE pagos_pasarela SET transaction_id = $1, updated_at = NOW() WHERE id = $2',
        [transactionId, pago.id]
      );
    }

    // El comprador aprobó, pero con intent CAPTURE el dinero no está cobrado
    // hasta llamar a /capture. Se hace fuera de la transacción, ya confirmada.
    if (evento.event_type === 'CHECKOUT.ORDER.APPROVED') {
      capturarDespues = ordenId ?? pago.orden_id;
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Evento procesado correctamente',
      data: { referencia: pago.referencia, estado: estadoPropio, transactionId },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Error procesando el webhook de PayPal:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar el evento' });
  } finally {
    client.release();
  }

  if (capturarDespues) {
    try {
      await paypal.capturarOrden(capturarDespues);
      // El cobro real llegará como PAYMENT.CAPTURE.COMPLETED en otro webhook.
    } catch (error) {
      console.error(`❌ No se pudo capturar la orden ${capturarDespues}:`, error.message);
    }
  }
}

// GET /api/pagos/:referencia — sólo el dueño del pago o un administrador
async function getByReferencia(req, res) {
  try {
    const { referencia } = req.params;

    const result = await pool.query(
      `SELECT id, referencia, proveedor, orden_id, proveedor_id, user_id, id_socio,
              concepto, monto, amount_in_cents, moneda, estado, estado_proveedor,
              metodo_pago, transaction_id, payload_raw, created_at, updated_at, finalized_at
         FROM pagos_pasarela
        WHERE referencia = $1`,
      [referencia]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pago no encontrado' });
    }

    const pago = result.rows[0];
    const esDueño = pago.user_id === req.user.id;
    const esAdmin = req.user.role === 'admin';

    if (!esDueño && !esAdmin) {
      // Nunca se devuelve el pago a quien no es su dueño.
      return res.status(403).json({ success: false, message: 'No tienes acceso a este pago' });
    }

    // El evento crudo es material de auditoría: sólo lo ve el administrador.
    if (!esAdmin) delete pago.payload_raw;

    res.json({ success: true, message: 'Pago obtenido correctamente', data: pago });
  } catch (error) {
    console.error('❌ Error en getByReferencia:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el pago' });
  }
}

// GET /api/pagos — listado completo para el panel, con paginación
async function getAll(req, res) {
  try {
    const { estado, search = '' } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let i = 1;

    if (estado) {
      conditions.push(`p.estado = $${i++}`);
      params.push(String(estado).toUpperCase());
    }
    if (search) {
      conditions.push(`(p.referencia ILIKE $${i} OR p.concepto ILIKE $${i} OR u.username ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = await pool.query(
      `SELECT COUNT(*)::int AS total
         FROM pagos_pasarela p
         LEFT JOIN users u ON u.id = p.user_id
         ${where}`,
      params
    );

    const result = await pool.query(
      `SELECT p.id, p.referencia, p.proveedor, p.orden_id, p.proveedor_id, p.user_id, p.id_socio,
              p.concepto, p.monto, p.amount_in_cents, p.moneda, p.estado, p.estado_proveedor,
              p.metodo_pago, p.transaction_id, p.payload_raw, p.created_at, p.updated_at, p.finalized_at,
              u.username AS usuario, s.nombre AS socio
         FROM pagos_pasarela p
         LEFT JOIN users u ON u.id = p.user_id
         LEFT JOIN socio s ON s.id_socio = p.id_socio
         ${where}
        ORDER BY p.created_at DESC
        LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      message: 'Pagos obtenidos correctamente',
      data: {
        pagos: result.rows,
        paginacion: {
          page,
          limit,
          total: total.rows[0].total,
          totalPaginas: Math.ceil(total.rows[0].total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error en getAll pagos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los pagos' });
  }
}

module.exports = { checkout, webhook, getByReferencia, getAll, CONCEPTOS, EVENTOS, datosDelEvento };
