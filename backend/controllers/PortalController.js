const bcrypt = require('bcryptjs');
const pool = require('../db');

const LONGITUD_MINIMA_PASSWORD = 8;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Resumen en ceros para la cuenta que todavía no tiene ficha de socio vinculada.
function resumenVacio() {
  return {
    vinculado: false,
    socio: null,
    cuotas: { pendientes: 0, pagadas: 0, totalPendiente: 0, totalPagado: 0 },
    cartera: { pendientes: 0, saldoPendiente: 0 },
    asistencias: { total: 0, presentes: 0 },
    pagosEnLinea: { total: 0, montoAprobado: 0 },
  };
}

// GET /api/portal/resumen — totales del socio de la sesión
async function getResumen(req, res) {
  try {
    const userId = req.user.id;

    // El vínculo con la ficha del club no está en users, sino en
    // socio_perfil.id_socio. vista_socios ya resuelve ese JOIN.
    const perfil = await pool.query(
      `SELECT id, full_name, telefono, email, id_socio, documento, tipo_documento,
              tipo_membresia, nivel_aprendizaje, estado_socio, fecha_ingreso
         FROM vista_socios
        WHERE id = $1`,
      [userId]
    );

    const socio = perfil.rows[0] ?? null;

    if (!socio || socio.id_socio === null) {
      return res.json({
        success: true,
        message: 'Tu cuenta aún no está vinculada a una ficha de socio',
        data: resumenVacio(),
      });
    }

    const idSocio = socio.id_socio;

    const [cuotas, cartera, asistencias, pagosEnLinea] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE estado IN ('pendiente', 'moroso'))                AS pendientes,
           COUNT(*) FILTER (WHERE estado = 'pagado')                                AS pagadas,
           COALESCE(SUM(valor) FILTER (WHERE estado IN ('pendiente', 'moroso')), 0) AS total_pendiente,
           COALESCE(SUM(valor) FILTER (WHERE estado = 'pagado'), 0)                 AS total_pagado
         FROM pago_mensual
        WHERE id_socio = $1`,
        [idSocio]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE estado = 'pendiente')                AS pendientes,
           COALESCE(SUM(valor) FILTER (WHERE estado = 'pendiente'), 0) AS saldo_pendiente
         FROM cartera
        WHERE id_socio = $1`,
        [idSocio]
      ),
      pool.query(
        `SELECT
           COUNT(*)                                    AS total,
           COUNT(*) FILTER (WHERE estado = 'Presente') AS presentes
         FROM asistencia
        WHERE id_socio = $1`,
        [idSocio]
      ),
      pool.query(
        `SELECT
           COUNT(*)                                                   AS total,
           COALESCE(SUM(monto) FILTER (WHERE estado = 'APPROVED'), 0) AS monto_aprobado
         FROM pagos_pasarela
        WHERE user_id = $1`,
        [userId]
      ),
    ]);

    const cuotasFila = cuotas.rows[0];
    const carteraFila = cartera.rows[0];
    const asistenciasFila = asistencias.rows[0];
    const pagosFila = pagosEnLinea.rows[0];

    res.json({
      success: true,
      message: 'Resumen obtenido correctamente',
      data: {
        vinculado: true,
        socio: {
          id_socio: socio.id_socio,
          nombre: socio.full_name,
          documento: socio.documento,
          tipo_documento: socio.tipo_documento,
          email: socio.email,
          telefono: socio.telefono,
          tipo_membresia: socio.tipo_membresia,
          nivel_aprendizaje: socio.nivel_aprendizaje,
          estado: socio.estado_socio,
          fecha_ingreso: socio.fecha_ingreso,
        },
        cuotas: {
          pendientes: Number(cuotasFila.pendientes),
          pagadas: Number(cuotasFila.pagadas),
          totalPendiente: Number(cuotasFila.total_pendiente),
          totalPagado: Number(cuotasFila.total_pagado),
        },
        cartera: {
          pendientes: Number(carteraFila.pendientes),
          saldoPendiente: Number(carteraFila.saldo_pendiente),
        },
        asistencias: {
          total: Number(asistenciasFila.total),
          presentes: Number(asistenciasFila.presentes),
        },
        pagosEnLinea: {
          total: Number(pagosFila.total),
          montoAprobado: Number(pagosFila.monto_aprobado),
        },
      },
    });
  } catch (error) {
    console.error('❌ Error en getResumen:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el resumen' });
  }
}

// GET /api/portal/pagos — pagos de la pasarela del usuario de la sesión
async function getPagos(req, res) {
  try {
    // El identificador sale siempre de la sesión, nunca del cliente.
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, referencia, proveedor, concepto, monto, moneda, estado,
              metodo_pago, transaction_id, created_at, finalized_at
         FROM pagos_pasarela
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Pagos obtenidos correctamente',
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Error en getPagos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los pagos' });
  }
}

// PUT /api/portal/perfil — datos y contraseña del propio usuario.
// Toca dos tablas (users y socio_perfil), así que va en una transacción.
async function updatePerfil(req, res) {
  const userId = req.user.id;
  // role, active e id_socio se ignoran a propósito: sólo los cambia el administrador.
  const { full_name, email, telefono, notificaciones, currentPassword, newPassword } = req.body || {};

  const errors = [];

  const nombreCompleto = typeof full_name === 'string' ? full_name.trim() : undefined;
  const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : undefined;
  const telefonoNormalizado = typeof telefono === 'string' ? telefono.trim() : undefined;
  const notificacionesValidas = notificaciones !== undefined
    && notificaciones !== null
    && typeof notificaciones === 'object'
    && !Array.isArray(notificaciones);

  if (nombreCompleto !== undefined && nombreCompleto === '') {
    errors.push('El nombre completo no puede quedar vacío');
  }
  if (emailNormalizado !== undefined && !FORMATO_EMAIL.test(emailNormalizado)) {
    errors.push('El correo electrónico no tiene un formato válido');
  }
  if (notificaciones !== undefined && !notificacionesValidas) {
    errors.push('Las preferencias de notificaciones deben ser un objeto');
  }
  if (newPassword !== undefined) {
    if (typeof newPassword !== 'string' || newPassword.length < LONGITUD_MINIMA_PASSWORD) {
      errors.push(`La nueva contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`);
    }
    if (typeof currentPassword !== 'string' || currentPassword === '') {
      errors.push('Debes indicar tu contraseña actual para cambiarla');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Error de validación', errors });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const actual = await client.query(
      'SELECT password FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (actual.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    let hashedPassword = null;

    if (newPassword !== undefined) {
      const esValida = await bcrypt.compare(currentPassword, actual.rows[0].password);

      if (!esValida) {
        await client.query('ROLLBACK');
        return res.status(401).json({ success: false, message: 'La contraseña actual no es correcta' });
      }

      hashedPassword = await bcrypt.hash(newPassword, 12);
    }

    if (emailNormalizado !== undefined) {
      const enUso = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2',
        [emailNormalizado, userId]
      );

      if (enUso.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya está registrado por otro usuario',
        });
      }
    }

    const usuario = await client.query(
      `UPDATE users SET
         full_name  = COALESCE($1, full_name),
         email      = COALESCE($2, email),
         password   = COALESCE($3, password),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, username, email, full_name, role, active`,
      [
        nombreCompleto === undefined ? null : nombreCompleto,
        emailNormalizado === undefined ? null : emailNormalizado,
        hashedPassword,
        userId,
      ]
    );

    // telefono y notificaciones viven en socio_perfil. La fila la crea el
    // disparador crear_perfil_por_rol, así que aquí sólo se actualiza.
    if (telefonoNormalizado !== undefined || notificacionesValidas) {
      await client.query(
        `UPDATE socio_perfil SET
           telefono       = COALESCE($1, telefono),
           notificaciones = COALESCE($2::jsonb, notificaciones)
         WHERE user_id = $3`,
        [
          telefonoNormalizado === undefined ? null : telefonoNormalizado,
          notificacionesValidas ? JSON.stringify(notificaciones) : null,
          userId,
        ]
      );
    }

    const perfil = await client.query(
      'SELECT id_socio, telefono, notificaciones FROM socio_perfil WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');

    const user = usuario.rows[0];

    res.json({
      success: true,
      message: hashedPassword ? 'Perfil y contraseña actualizados' : 'Perfil actualizado',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.full_name,
          email: user.email,
          telefono: perfil.rows[0]?.telefono ?? null,
          notificaciones: perfil.rows[0]?.notificaciones ?? null,
          role: user.role,
          active: user.active,
          idSocio: perfil.rows[0]?.id_socio ?? null,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ya está registrado por otro usuario',
      });
    }

    console.error('❌ Error en updatePerfil:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el perfil' });
  } finally {
    client.release();
  }
}

module.exports = { getResumen, getPagos, updatePerfil };
