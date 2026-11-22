const bcrypt = require('bcryptjs');
const { createHash, randomBytes } = require('crypto');
const pool = require('../db');
const { enviarCorreo, generarOTP, correoRegistro, correoYaRegistrado } = require('../utils/correo');
const { validarDatosSocio, insertarSocio, vincularPerfil, documentoRegistrado } = require('../utils/socio');

// Mismo coste de hash que usa server.js al crear el administrador por defecto.
const RONDAS_BCRYPT = 12;
const LONGITUD_MINIMA_PASSWORD = 8;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMATO_USUARIO = /^[a-z0-9._-]{3,30}$/;
const FORMATO_TOKEN = /^[a-f0-9]{64}$/;
const INTENTOS_OTP = 3;
const ESPERA_REENVIO_SEGUNDOS = 60;

const normalizarEmail = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const sha256 = (v) => createHash('sha256').update(v).digest('hex');
const RESPUESTA_CODIGO = 'Si el correo es válido, te enviamos un código de verificación. Revisa también la carpeta de spam.';

// ─── POST /api/auth/registro/solicitar-codigo ────────────────────────────────
// Paso 1 del registro: envía un código de 6 dígitos al correo. Si el correo ya
// tiene cuenta responde lo mismo, pero el correo enviado avisa que ya existe la
// cuenta: así la respuesta no revela qué correos están registrados.
async function solicitarCodigo(req, res) {
  try {
    const email = normalizarEmail(req.body?.email);
    if (!email || email.length > 100 || !FORMATO_EMAIL.test(email)) {
      return res.status(400).json({ success: false, message: 'Escribe un correo electrónico válido' });
    }

    const existente = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [email]);
    if (existente.rows.length > 0) {
      await enviarCorreo({ to: email, subject: 'Ya tienes una cuenta - Ruta Contable', html: correoYaRegistrado() });
      return res.json({ success: true, message: RESPUESTA_CODIGO });
    }

    // Un código por minuto por correo: evita usar el formulario para llenar un buzón ajeno.
    const reciente = await pool.query(
      `SELECT 1 FROM registro_pendiente
        WHERE email = $1 AND codigo_hash IS NOT NULL
          AND updated_at > LOCALTIMESTAMP - make_interval(secs => $2)`,
      [email, ESPERA_REENVIO_SEGUNDOS]
    );
    if (reciente.rows.length > 0) {
      return res.status(429).json({ success: false, message: 'Espera un minuto antes de pedir otro código.' });
    }

    const otp = generarOTP();
    const hash = await bcrypt.hash(otp, 10);
    await pool.query(
      `INSERT INTO registro_pendiente (email, codigo_hash, codigo_expira, intentos, token_hash, token_expira, updated_at)
       VALUES ($1, $2, LOCALTIMESTAMP + INTERVAL '10 minutes', 0, NULL, NULL, LOCALTIMESTAMP)
       ON CONFLICT (email) DO UPDATE
          SET codigo_hash = EXCLUDED.codigo_hash, codigo_expira = EXCLUDED.codigo_expira,
              intentos = 0, token_hash = NULL, token_expira = NULL, updated_at = LOCALTIMESTAMP`,
      [email, hash]
    );

    await enviarCorreo({ to: email, subject: `${otp} es tu código de registro - Ruta Contable`, html: correoRegistro(otp) });
    res.json({ success: true, message: RESPUESTA_CODIGO });
  } catch (error) {
    console.error('❌ Error en solicitar-codigo:', error);
    res.status(500).json({ success: false, message: 'No se pudo enviar el código. Inténtalo de nuevo en unos minutos.' });
  }
}

// ─── POST /api/auth/registro/verificar-codigo ────────────────────────────────
// Paso 2: valida el código (3 intentos) y entrega un token de registro de un
// solo uso, válido 30 minutos. En la BD sólo queda su hash SHA-256.
async function verificarCodigo(req, res) {
  try {
    const email = normalizarEmail(req.body?.email);
    const otp = String(req.body?.otp ?? '').trim();
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Escribe el código de 6 dígitos que llegó a tu correo' });
    }

    const { rows } = await pool.query(
      `SELECT codigo_hash FROM registro_pendiente
        WHERE email = $1 AND codigo_hash IS NOT NULL AND codigo_expira > LOCALTIMESTAMP`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'El código venció o no existe. Solicita uno nuevo.', invalidated: true });
    }

    if (!(await bcrypt.compare(otp, rows[0].codigo_hash))) {
      // Contador atómico: a los 3 fallos el código se borra y hay que pedir otro.
      const fallo = await pool.query(
        `UPDATE registro_pendiente
            SET intentos = intentos + 1,
                codigo_hash = CASE WHEN intentos + 1 >= $2 THEN NULL ELSE codigo_hash END
          WHERE email = $1
          RETURNING intentos`,
        [email, INTENTOS_OTP]
      );
      const intentos = fallo.rows[0]?.intentos ?? INTENTOS_OTP;
      if (intentos >= INTENTOS_OTP) {
        return res.status(400).json({ success: false, message: 'Demasiados intentos incorrectos. Solicita un código nuevo.', invalidated: true });
      }
      return res.status(400).json({
        success: false,
        message: `Código incorrecto. Te quedan ${INTENTOS_OTP - intentos} intento(s).`,
        attemptsLeft: INTENTOS_OTP - intentos,
      });
    }

    const token = randomBytes(32).toString('hex');
    await pool.query(
      `UPDATE registro_pendiente
          SET codigo_hash = NULL, intentos = 0, token_hash = $2,
              token_expira = LOCALTIMESTAMP + INTERVAL '30 minutes', updated_at = LOCALTIMESTAMP
        WHERE email = $1`,
      [email, sha256(token)]
    );

    res.json({ success: true, message: 'Correo verificado', data: { email, registroToken: token } });
  } catch (error) {
    console.error('❌ Error en verificar-codigo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Paso 3: crea la ficha de socio (estado 'pendiente'), la cuenta con rol 'user'
// y el vínculo entre ambas en una sola transacción. El correo sale del token de
// registro, nunca del cuerpo de la petición. El rol tampoco se toma del cuerpo.
async function register(req, res) {
  const cuerpo = req.body || {};
  const token = typeof cuerpo.registroToken === 'string' ? cuerpo.registroToken.trim().toLowerCase() : '';
  const username = typeof cuerpo.username === 'string' ? cuerpo.username.trim().toLowerCase() : '';
  const password = cuerpo.password;

  const { datos: socio, errores } = validarDatosSocio(cuerpo.socio);
  if (!FORMATO_TOKEN.test(token)) {
    return res.status(400).json({ success: false, message: 'Primero verifica tu correo electrónico.', codigo: 'TOKEN_INVALIDO' });
  }
  if (!FORMATO_USUARIO.test(username)) {
    errores.push('El usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números, punto, guion o guion bajo');
  }
  if (typeof password !== 'string' || password.length < LONGITUD_MINIMA_PASSWORD) {
    errores.push(`La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`);
  }
  if (errores.length > 0) {
    return res.status(400).json({ success: false, message: 'Error de validación', errors: errores });
  }

  const hashedPassword = await bcrypt.hash(password, RONDAS_BCRYPT);
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // FOR UPDATE: dos envíos simultáneos con el mismo token no crean dos cuentas.
    const pendiente = await cliente.query(
      `SELECT email FROM registro_pendiente
        WHERE token_hash = $1 AND token_expira > LOCALTIMESTAMP
        FOR UPDATE`,
      [sha256(token)]
    );
    if (pendiente.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'La verificación del correo venció. Vuelve a empezar el registro.',
        codigo: 'TOKEN_INVALIDO',
      });
    }
    const email = pendiente.rows[0].email;

    const existente = await cliente.query(
      'SELECT LOWER(username) AS username, LOWER(email) AS email FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
      [username, email]
    );
    if (existente.rows.length > 0) {
      await cliente.query('ROLLBACK');
      const chocaEmail = existente.rows.some((f) => f.email === email);
      return res.status(409).json({
        success: false,
        message: chocaEmail ? 'El correo electrónico ya está registrado' : 'El nombre de usuario ya está en uso. Elige otro.',
      });
    }

    if (await documentoRegistrado(cliente, socio.documento)) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Ya existe una ficha de socio con ese documento. Comunícate con el club para que vinculen tu cuenta.',
      });
    }

    const idSocio = await insertarSocio(cliente, socio, { email, estado: 'pendiente', createdBy: null });

    // El disparador crear_perfil_por_rol crea la fila de socio_perfil al insertar.
    const { rows } = await cliente.query(
      `INSERT INTO users (username, password, email, full_name, role, active)
       VALUES ($1, $2, $3, $4, 'user', true)
       RETURNING id, username, email, full_name, role, active, created_at`,
      [username, hashedPassword, email, socio.nombre]
    );
    const user = rows[0];

    await vincularPerfil(cliente, user.id, idSocio, socio.telefono);
    await cliente.query('DELETE FROM registro_pendiente WHERE email = $1', [email]);
    await cliente.query('COMMIT');

    // Sin token de sesión: el usuario inicia sesión después de registrarse.
    res.status(201).json({
      success: true,
      message: 'Registro enviado. El club revisará tus datos para activar tu inscripción. Ya puedes iniciar sesión.',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.full_name,
          email: user.email,
          role: user.role,
          active: user.active,
          idSocio,
          estadoSocio: 'pendiente',
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    // Carrera contra otro registro simultáneo con el mismo usuario, correo o documento.
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El usuario, el correo o el documento ya están registrados',
      });
    }
    console.error('❌ Error en register:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    cliente.release();
  }
}

module.exports = { solicitarCodigo, verificarCodigo, register };
