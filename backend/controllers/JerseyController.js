const pool = require('../db');

// Vocabulario de la BD (CHECKs de pedido_jersey).
const ESTADOS_PEDIDO = ['Solicitado', 'En producción', 'Listo', 'Entregado', 'Cancelado'];
const TIPOS_PEDIDO   = ['Jersey', 'Short', 'Medias', 'Chaqueta'];
const TALLAS_DEFECTO = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const CANTIDAD_MAXIMA_PORTAL = 10;
const ESTAMPADO_MAXIMO       = 60;

const SELECT_PEDIDOS = `
  SELECT p.*,
         s.nombre    AS socio_nombre,
         s.documento AS socio_documento,
         c.titulo    AS campana_titulo
  FROM pedido_jersey p
  LEFT JOIN socio s          ON s.id_socio = p.id_socio
  LEFT JOIN jersey_campana c ON c.id = p.id_campana
`;

// Normaliza la lista de tallas que llega del cliente: array de strings no
// vacíos, sin repetidos. Devuelve null si no es utilizable.
function normalizarTallas(tallas) {
  if (tallas === undefined || tallas === null) return TALLAS_DEFECTO;
  const lista = Array.isArray(tallas)
    ? tallas
    : String(tallas).split(',');
  const limpias = [...new Set(lista.map(t => String(t).trim()).filter(Boolean))];
  return limpias.length > 0 ? limpias : null;
}

function esFechaValida(valor) {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !isNaN(Date.parse(valor));
}

// Fila de campaña → forma que consume el frontend.
function mapCampana(fila) {
  return {
    id:           fila.id,
    titulo:       fila.titulo,
    descripcion:  fila.descripcion,
    tallas:       Array.isArray(fila.tallas) ? fila.tallas : TALLAS_DEFECTO,
    valor:        Number(fila.valor),
    fechaInicio:  fila.fecha_inicio,
    fechaFin:     fila.fecha_fin,
    activa:       fila.activa,
    createdBy:    fila.created_by,
    createdAt:    fila.created_at,
    totalPedidos: fila.total_pedidos !== undefined ? Number(fila.total_pedidos) : undefined,
  };
}

function mapPedido(fila) {
  if (!fila) return null;
  return {
    id:            fila.id_pedido,
    idSocio:       fila.id_socio,
    idCampana:     fila.id_campana,
    socioNombre:   fila.socio_nombre,
    socioDocumento: fila.socio_documento,
    campanaTitulo: fila.campana_titulo,
    fecha:         fila.fecha,
    tipo:          fila.tipo,
    talla:         fila.talla,
    aplique:       fila.aplique,
    estampado:     fila.estampado,
    cantidad:      Number(fila.cantidad ?? 1),
    valor:         Number(fila.valor),
    estado:        fila.estado,
    fechaEntrega:  fila.fecha_entrega,
    observaciones: fila.observaciones,
    createdAt:     fila.created_at,
    updatedAt:     fila.updated_at,
  };
}

// ─── Admin: campañas ─────────────────────────────────────────────────────────

// GET /api/jersey/campanas
async function getCampanas(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(p.id_pedido) AS total_pedidos
         FROM jersey_campana c
         LEFT JOIN pedido_jersey p ON p.id_campana = c.id
        GROUP BY c.id
        ORDER BY c.activa DESC, c.created_at DESC`
    );
    res.json({ success: true, data: result.rows.map(mapCampana) });
  } catch (error) {
    console.error('Error getCampanas jersey:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las campañas' });
  }
}

// POST /api/jersey/campanas
async function createCampana(req, res) {
  try {
    const { titulo, descripcion, valor, tallas, fechaFin } = req.body || {};

    if (!titulo || String(titulo).trim() === '') {
      return res.status(400).json({ success: false, message: 'El título es obligatorio' });
    }
    const valorNum = parseFloat(valor);
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ success: false, message: 'El valor debe ser numérico y mayor a cero' });
    }
    const tallasLista = normalizarTallas(tallas);
    if (!tallasLista) {
      return res.status(400).json({ success: false, message: 'Debe indicar al menos una talla' });
    }
    if (fechaFin && !esFechaValida(fechaFin)) {
      return res.status(400).json({ success: false, message: 'La fecha de fin no es válida' });
    }

    const result = await pool.query(
      `INSERT INTO jersey_campana (titulo, descripcion, tallas, valor, fecha_fin, activa, created_by)
       VALUES ($1, $2, $3::jsonb, $4, $5, true, $6)
       RETURNING *`,
      [
        String(titulo).trim(),
        descripcion ? String(descripcion).trim() : null,
        JSON.stringify(tallasLista),
        valorNum,
        fechaFin || null,
        req.user?.id ?? null,
      ]
    );

    res.status(201).json({
      success: true,
      data: mapCampana(result.rows[0]),
      message: 'Campaña creada correctamente',
    });
  } catch (error) {
    console.error('Error createCampana jersey:', error);
    res.status(500).json({ success: false, message: 'Error al crear la campaña' });
  }
}

// PUT /api/jersey/campanas/:id — editar o cerrar (activa = false)
async function updateCampana(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descripcion, valor, tallas, fechaFin, activa } = req.body || {};

    const existing = await pool.query('SELECT * FROM jersey_campana WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
    }

    let valorNum = null;
    if (valor !== undefined && valor !== null && valor !== '') {
      valorNum = parseFloat(valor);
      if (isNaN(valorNum) || valorNum <= 0) {
        return res.status(400).json({ success: false, message: 'El valor debe ser numérico y mayor a cero' });
      }
    }

    let tallasJson = null;
    if (tallas !== undefined) {
      const lista = normalizarTallas(tallas);
      if (!lista) {
        return res.status(400).json({ success: false, message: 'Debe indicar al menos una talla' });
      }
      tallasJson = JSON.stringify(lista);
    }

    if (fechaFin && !esFechaValida(fechaFin)) {
      return res.status(400).json({ success: false, message: 'La fecha de fin no es válida' });
    }

    const result = await pool.query(
      `UPDATE jersey_campana SET
         titulo      = COALESCE($1, titulo),
         descripcion = COALESCE($2, descripcion),
         valor       = COALESCE($3, valor),
         tallas      = COALESCE($4::jsonb, tallas),
         fecha_fin   = CASE WHEN $5::boolean THEN $6::date ELSE fecha_fin END,
         activa      = COALESCE($7, activa)
       WHERE id = $8
       RETURNING *`,
      [
        titulo ? String(titulo).trim() : null,
        descripcion !== undefined ? (descripcion ? String(descripcion).trim() : null) : null,
        valorNum,
        tallasJson,
        fechaFin !== undefined,          // sólo se toca fecha_fin si viene en el body
        fechaFin || null,
        typeof activa === 'boolean' ? activa : null,
        id,
      ]
    );

    res.json({
      success: true,
      data: mapCampana(result.rows[0]),
      message: activa === false ? 'Campaña cerrada' : 'Campaña actualizada correctamente',
    });
  } catch (error) {
    console.error('Error updateCampana jersey:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la campaña' });
  }
}

// ─── Admin: pedidos ──────────────────────────────────────────────────────────

// GET /api/jersey/pedidos?campana=&estado=&search=
async function getPedidos(req, res) {
  try {
    const { campana, estado, search = '' } = req.query;

    const conditions = [];
    const params = [];
    let i = 1;

    if (campana) {
      conditions.push(`p.id_campana = $${i++}`);
      params.push(parseInt(campana, 10));
    }
    if (estado) {
      conditions.push(`p.estado = $${i++}`);
      params.push(estado);
    }
    if (search) {
      conditions.push(`(s.nombre ILIKE $${i} OR s.documento ILIKE $${i} OR p.estampado ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `${SELECT_PEDIDOS} ${where} ORDER BY p.fecha DESC, p.id_pedido DESC`,
      params
    );

    res.json({ success: true, data: result.rows.map(mapPedido) });
  } catch (error) {
    console.error('Error getPedidos jersey:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los pedidos' });
  }
}

// POST /api/jersey/pedidos — pedido manual registrado por el administrador
async function createPedido(req, res) {
  try {
    const {
      idSocio, idCampana, fecha, tipo = 'Jersey', talla, aplique, estampado,
      cantidad = 1, valor, estado = 'Solicitado', fechaEntrega, observaciones,
    } = req.body || {};

    if (!idSocio) {
      return res.status(400).json({ success: false, message: 'El socio es obligatorio' });
    }
    if (!TIPOS_PEDIDO.includes(tipo)) {
      return res.status(400).json({ success: false, message: `tipo debe ser uno de: ${TIPOS_PEDIDO.join(', ')}` });
    }
    if (!ESTADOS_PEDIDO.includes(estado)) {
      return res.status(400).json({ success: false, message: `estado debe ser uno de: ${ESTADOS_PEDIDO.join(', ')}` });
    }
    const cantidadNum = parseInt(cantidad, 10);
    if (isNaN(cantidadNum) || cantidadNum < 1) {
      return res.status(400).json({ success: false, message: 'La cantidad debe ser un entero mayor a cero' });
    }
    if (estampado && String(estampado).length > ESTAMPADO_MAXIMO) {
      return res.status(400).json({ success: false, message: `El estampado no puede superar ${ESTAMPADO_MAXIMO} caracteres` });
    }
    if (fecha && !esFechaValida(fecha)) {
      return res.status(400).json({ success: false, message: 'La fecha no es válida' });
    }
    if (fechaEntrega && !esFechaValida(fechaEntrega)) {
      return res.status(400).json({ success: false, message: 'La fecha de entrega no es válida' });
    }

    const socio = await pool.query('SELECT id_socio FROM socio WHERE id_socio = $1', [idSocio]);
    if (socio.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Socio no encontrado' });
    }

    // Con campaña el valor sale de ella; sin campaña lo fija el administrador.
    let valorFinal;
    let idCampanaFinal = null;
    if (idCampana) {
      const campana = await pool.query('SELECT id, valor FROM jersey_campana WHERE id = $1', [idCampana]);
      if (campana.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
      }
      idCampanaFinal = campana.rows[0].id;
      valorFinal = Number(campana.rows[0].valor) * cantidadNum;
    } else {
      valorFinal = parseFloat(valor);
      if (!valor || isNaN(valorFinal) || valorFinal <= 0) {
        return res.status(400).json({ success: false, message: 'El valor debe ser numérico y mayor a cero' });
      }
    }

    const result = await pool.query(
      `INSERT INTO pedido_jersey
         (id_socio, id_campana, fecha, tipo, talla, aplique, estampado, cantidad, valor, estado, fecha_entrega, observaciones)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id_pedido`,
      [
        idSocio, idCampanaFinal, fecha || null, tipo, talla || null, aplique || null,
        estampado ? String(estampado).trim() : null, cantidadNum, valorFinal, estado,
        fechaEntrega || null, observaciones || null,
      ]
    );

    const creado = await pool.query(`${SELECT_PEDIDOS} WHERE p.id_pedido = $1`, [result.rows[0].id_pedido]);
    res.status(201).json({ success: true, data: mapPedido(creado.rows[0]), message: 'Pedido registrado correctamente' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'El socio ya tiene un pedido en esa campaña' });
    }
    console.error('Error createPedido jersey:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el pedido' });
  }
}

// PUT /api/jersey/pedidos/:id — estado, fecha de entrega, observaciones
async function updatePedido(req, res) {
  try {
    const { id } = req.params;
    const { estado, fechaEntrega, observaciones, talla, estampado } = req.body || {};

    const existing = await pool.query('SELECT id_pedido FROM pedido_jersey WHERE id_pedido = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }
    if (estado && !ESTADOS_PEDIDO.includes(estado)) {
      return res.status(400).json({ success: false, message: `estado debe ser uno de: ${ESTADOS_PEDIDO.join(', ')}` });
    }
    if (fechaEntrega && !esFechaValida(fechaEntrega)) {
      return res.status(400).json({ success: false, message: 'La fecha de entrega no es válida' });
    }
    if (estampado && String(estampado).length > ESTAMPADO_MAXIMO) {
      return res.status(400).json({ success: false, message: `El estampado no puede superar ${ESTAMPADO_MAXIMO} caracteres` });
    }

    // Marcar Entregado sin fecha de entrega deja la de hoy.
    const fechaEntregaFinal = fechaEntrega
      || (estado === 'Entregado' ? new Date().toISOString().slice(0, 10) : null);

    await pool.query(
      `UPDATE pedido_jersey SET
         estado        = COALESCE($1, estado),
         fecha_entrega = COALESCE($2::date, fecha_entrega),
         observaciones = COALESCE($3, observaciones),
         talla         = COALESCE($4, talla),
         estampado     = COALESCE($5, estampado),
         updated_at    = CURRENT_TIMESTAMP
       WHERE id_pedido = $6`,
      [estado || null, fechaEntregaFinal, observaciones ?? null, talla || null, estampado ?? null, id]
    );

    const actualizado = await pool.query(`${SELECT_PEDIDOS} WHERE p.id_pedido = $1`, [id]);
    res.json({ success: true, data: mapPedido(actualizado.rows[0]), message: 'Pedido actualizado correctamente' });
  } catch (error) {
    console.error('Error updatePedido jersey:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el pedido' });
  }
}

// DELETE /api/jersey/pedidos/:id
async function deletePedido(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM pedido_jersey WHERE id_pedido = $1 RETURNING id_pedido', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }
    res.json({ success: true, message: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('Error deletePedido jersey:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el pedido' });
  }
}

// ─── Portal del socio ────────────────────────────────────────────────────────

// id_socio del usuario de la sesión, o null si la cuenta no está vinculada.
async function idSocioDeUsuario(client, userId) {
  const perfil = await client.query('SELECT id_socio FROM socio_perfil WHERE user_id = $1', [userId]);
  return perfil.rows[0]?.id_socio ?? null;
}

// GET /api/portal/jersey — campañas activas y el pedido del socio en cada una
async function portalGetJersey(req, res) {
  try {
    const idSocio = await idSocioDeUsuario(pool, req.user.id);
    if (idSocio === null) {
      return res.json({ success: true, data: { vinculado: false, idSocio: null, campanas: [] } });
    }

    const result = await pool.query(
      `SELECT c.*,
              p.id_pedido, p.cantidad, p.talla, p.estampado, p.valor AS pedido_valor,
              p.estado AS pedido_estado, p.fecha AS pedido_fecha, p.fecha_entrega,
              p.updated_at AS pedido_updated_at
         FROM jersey_campana c
         LEFT JOIN pedido_jersey p ON p.id_campana = c.id AND p.id_socio = $1
        WHERE c.activa = true
          AND (c.fecha_fin IS NULL OR c.fecha_fin >= CURRENT_DATE)
        ORDER BY c.created_at DESC`,
      [idSocio]
    );

    const campanas = result.rows.map(fila => ({
      ...mapCampana(fila),
      totalPedidos: undefined,
      pedido: fila.id_pedido === null ? null : {
        id:           fila.id_pedido,
        cantidad:     Number(fila.cantidad ?? 1),
        talla:        fila.talla,
        estampado:    fila.estampado,
        valor:        Number(fila.pedido_valor),
        estado:       fila.pedido_estado,
        fecha:        fila.pedido_fecha,
        fechaEntrega: fila.fecha_entrega,
        updatedAt:    fila.pedido_updated_at,
      },
    }));

    res.json({ success: true, data: { vinculado: true, idSocio, campanas } });
  } catch (error) {
    console.error('❌ Error en portalGetJersey:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las campañas de jersey' });
  }
}

// POST /api/portal/jersey/pedidos — body { idCampana, cantidad, talla, estampado }
// Crea el pedido del socio en la campaña o lo actualiza mientras siga en
// 'Solicitado'. En cualquier otro estado responde 409.
async function portalCrearPedido(req, res) {
  const { idCampana, cantidad, talla, estampado } = req.body || {};

  const idCampanaNum = parseInt(idCampana, 10);
  if (isNaN(idCampanaNum)) {
    return res.status(400).json({ success: false, message: 'La campaña es obligatoria' });
  }
  const cantidadNum = Number(cantidad);
  if (!Number.isInteger(cantidadNum) || cantidadNum < 1 || cantidadNum > CANTIDAD_MAXIMA_PORTAL) {
    return res.status(400).json({ success: false, message: `La cantidad debe ser un entero entre 1 y ${CANTIDAD_MAXIMA_PORTAL}` });
  }
  if (!talla || String(talla).trim() === '') {
    return res.status(400).json({ success: false, message: 'La talla es obligatoria' });
  }
  const estampadoFinal = estampado ? String(estampado).trim() : null;
  if (estampadoFinal && estampadoFinal.length > ESTAMPADO_MAXIMO) {
    return res.status(400).json({ success: false, message: `El estampado no puede superar ${ESTAMPADO_MAXIMO} caracteres` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const idSocio = await idSocioDeUsuario(client, req.user.id);
    if (idSocio === null) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Tu cuenta aún no está vinculada a un socio. Contacta al administrador.' });
    }

    const campana = await client.query('SELECT * FROM jersey_campana WHERE id = $1', [idCampanaNum]);
    if (campana.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
    }
    const c = campana.rows[0];
    const vencida = c.fecha_fin && new Date(c.fecha_fin) < new Date(new Date().toISOString().slice(0, 10));
    if (!c.activa || vencida) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'La campaña ya no está activa' });
    }
    const tallas = Array.isArray(c.tallas) ? c.tallas : TALLAS_DEFECTO;
    if (!tallas.includes(String(talla).trim())) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `La talla debe ser una de: ${tallas.join(', ')}` });
    }

    const valorTotal = Number(c.valor) * cantidadNum;

    // FOR UPDATE: dos envíos seguidos del mismo socio no se pisan.
    const existente = await client.query(
      `SELECT id_pedido, estado FROM pedido_jersey
        WHERE id_campana = $1 AND id_socio = $2
        FOR UPDATE`,
      [idCampanaNum, idSocio]
    );

    let idPedido;
    let mensaje;
    if (existente.rows.length > 0) {
      const pedido = existente.rows[0];
      if (pedido.estado !== 'Solicitado') {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `Tu pedido ya está en estado '${pedido.estado}' y no se puede modificar`,
        });
      }
      await client.query(
        `UPDATE pedido_jersey SET
           cantidad = $1, talla = $2, estampado = $3, valor = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id_pedido = $5`,
        [cantidadNum, String(talla).trim(), estampadoFinal, valorTotal, pedido.id_pedido]
      );
      idPedido = pedido.id_pedido;
      mensaje = 'Pedido actualizado correctamente';
    } else {
      const insertado = await client.query(
        `INSERT INTO pedido_jersey
           (id_socio, id_campana, fecha, tipo, talla, estampado, cantidad, valor, estado)
         VALUES ($1, $2, CURRENT_DATE, 'Jersey', $3, $4, $5, $6, 'Solicitado')
         RETURNING id_pedido`,
        [idSocio, idCampanaNum, String(talla).trim(), estampadoFinal, cantidadNum, valorTotal]
      );
      idPedido = insertado.rows[0].id_pedido;
      mensaje = 'Pedido enviado correctamente';
    }

    const pedido = await client.query(`${SELECT_PEDIDOS} WHERE p.id_pedido = $1`, [idPedido]);
    await client.query('COMMIT');

    res.status(existente.rows.length > 0 ? 200 : 201).json({
      success: true,
      data: mapPedido(pedido.rows[0]),
      message: mensaje,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Error en portalCrearPedido:', error);
    res.status(500).json({ success: false, message: 'Error al enviar el pedido' });
  } finally {
    client.release();
  }
}

module.exports = {
  ESTADOS_PEDIDO,
  getCampanas, createCampana, updateCampana,
  getPedidos, createPedido, updatePedido, deletePedido,
  portalGetJersey, portalCrearPedido,
};
