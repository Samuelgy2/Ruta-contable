// routes/forgotPassword.js
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');

const pool = require('../db');



// ─── Nodemailer ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify(err =>
  err
    ? console.error('❌ Error configuración email:', err.message)
    : console.log('✅ Servidor de correo listo')
);

// ─── Rate limit: máx 5 solicitudes por IP cada 15 min ────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Demasiados intentos. Espera 15 minutos.' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera un OTP numérico de 6 dígitos */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Plantilla HTML del email */
function buildEmailHTML(fullName, otp) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:#10b981;padding:32px 40px;">
        <h1 style="color:white;margin:0;font-size:22px;letter-spacing:-0.5px;">Ruta Contable</h1>
      </div>
      <div style="padding:40px;">
        <h2 style="color:#111827;margin:0 0 8px;font-size:20px;">Recuperación de contraseña</h2>
        <p style="color:#6b7280;margin:0 0 32px;font-size:15px;">Hola <strong style="color:#111827;">${fullName}</strong>, aquí está tu código de verificación:</p>

        <div style="background:#f9fafb;border:2px dashed #10b981;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Tu código OTP</p>
          <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:14px;color:#111827;">${otp}</p>
        </div>

        <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">⏱ Este código expira en <strong>10 minutos</strong>.</p>
        <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">🔒 Solo es válido para un uso.</p>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Si no solicitaste este código, ignora este correo. Tu cuenta permanece segura.</p>
      </div>
    </div>
  `;
}

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
/**
 * Recibe: { email }
 * Genera OTP, lo hashea, lo guarda en DB y envía el email.
 * Siempre responde igual para no filtrar si el email existe.
 */
router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El correo es requerido' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);

    // Respuesta genérica aunque no exista el email (seguridad)
    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'Si el correo existe, recibirás el código' });
    }

    const user   = result.rows[0];
    const otp    = generateOTP();
    const hashed = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Guardar OTP hasheado + expiración + resetear intentos fallidos
    await pool.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2
       WHERE id = $3`,
      [hashed, expires, user.id]
    );

    await transporter.sendMail({
      from:    `"Ruta Contable" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: `${otp} es tu código de recuperación - Ruta Contable`,
      html:    buildEmailHTML(user.full_name, otp),
    });

    console.log(`📧 OTP enviado a: ${email}`);

    res.json({ success: true, message: 'Si el correo existe, recibirás el código' });

  } catch (err) {
    console.error('❌ forgot-password:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
/**
 * Recibe: { email, otp }
 * Valida el OTP. Si es correcto devuelve un token temporal de un solo uso
 * para poder llamar a /reset-password.
 * Máximo 3 intentos fallidos antes de invalidar el OTP.
 */
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email y código son requeridos' });
    }

    const result = await pool.query(
      `SELECT * FROM users
       WHERE email = $1
         AND reset_token IS NOT NULL
         AND reset_token_expires > NOW()`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El código ha expirado o no existe. Solicita uno nuevo.',
      });
    }

    const user = result.rows[0];

    // Verificar OTP contra hash
    const valid = await bcrypt.compare(otp.toString().trim(), user.reset_token);

    if (!valid) {
      // Incrementar intentos fallidos
      const attempts = (user.failed_attempts || 0) + 1;

      if (attempts >= 3) {
        // Invalidar OTP tras 3 intentos
        await pool.query(
          `UPDATE users SET reset_token = NULL, reset_token_expires = NULL, failed_attempts = 0 WHERE id = $1`,
          [user.id]
        );
        return res.status(400).json({
          success: false,
          message: 'Demasiados intentos incorrectos. Solicita un nuevo código.',
          invalidated: true,
        });
      }

      await pool.query(
        'UPDATE users SET failed_attempts = $1 WHERE id = $2',
        [attempts, user.id]
      );

      return res.status(400).json({
        success: false,
        message: `Código incorrecto. Te quedan ${3 - attempts} intento(s).`,
        attemptsLeft: 3 - attempts,
      });
    }

    // OTP válido — generar token temporal de un solo uso para el reset
    const { randomBytes } = require('crypto');
    const resetAccessToken = randomBytes(32).toString('hex');
    const newExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min para hacer el reset

    await pool.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2, failed_attempts = 0
       WHERE id = $3`,
      [resetAccessToken, newExpires, user.id]
    );

    console.log(`✅ OTP verificado para: ${user.username}`);

    res.json({
      success: true,
      message: 'Código verificado correctamente',
      resetToken: resetAccessToken, // frontend lo usa para /reset-password
    });

  } catch (err) {
    console.error('❌ verify-otp:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
/**
 * Recibe: { resetToken, newPassword }
 * Valida el token temporal del paso anterior y actualiza la contraseña.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const result = await pool.query(
      `SELECT * FROM users
       WHERE reset_token = $1
         AND reset_token_expires > NOW()`,
      [resetToken]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El token es inválido o ya expiró. Inicia el proceso nuevamente.',
      });
    }

    const user           = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `UPDATE users
       SET password             = $1,
           reset_token          = NULL,
           reset_token_expires  = NULL,
           failed_attempts      = 0,
           locked_until         = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    console.log(`✅ Contraseña actualizada para: ${user.username}`);

    res.json({ success: true, message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });

  } catch (err) {
    console.error('❌ reset-password:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;