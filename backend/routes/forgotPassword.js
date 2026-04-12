// routes/forgotPassword.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const pool = require('../db');

// ============================================
// Configuración Outlook
// ============================================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,  // 👈 esto soluciona el error de certificado
  },
}); 


transporter.verify((error) => {
  if (error) {
    console.error('❌ Error configuración email:', error.message);
  } else {
    console.log('✅ Servidor de correo listo');
  }
});

// ============================================
// POST /api/auth/forgot-password
// ============================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es requerido'
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Si el correo existe, recibirás un enlace de recuperación'
      });
    }

    const user = result.rows[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires = $2 
       WHERE id = $3`,
      [resetToken, expiresAt, user.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Ruta Contable" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de contraseña - Ruta Contable',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Recuperar Contraseña</h2>
          <p>Hola <strong>${user.full_name}</strong>,</p>
          <p>Recibimos una solicitud para recuperar tu contraseña.</p>
          <p>Haz clic en el botón para crear una nueva contraseña:</p>
          <a 
            href="${resetUrl}" 
            style="
              display: inline-block;
              background-color: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 16px 0;
            "
          >
            Recuperar Contraseña
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.
          </p>
        </div>
      `,
    });

    console.log(`📧 Correo enviado a: ${email}`);

    res.json({
      success: true,
      message: 'Si el correo existe, recibirás un enlace de recuperación'
    });

  } catch (error) {
    console.error('❌ Error en forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============================================
// POST /api/auth/reset-password
// ============================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const result = await pool.query(
      `SELECT * FROM users 
       WHERE reset_token = $1 
       AND reset_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El enlace de recuperación es inválido o ya expiró'
      });
    }

    const user = result.rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `UPDATE users 
       SET password = $1, 
           reset_token = NULL,
           reset_token_expires = NULL,
           failed_attempts = 0,
           locked_until = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    console.log(`✅ Contraseña actualizada para: ${user.username}`);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('❌ Error en reset-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;  