// Correo transaccional con la API HTTPS de Brevo.
// Render (plan gratuito) bloquea el SMTP saliente, así que el correo sale por
// HTTPS (puerto 443). BREVO_SENDER es un remitente verificado en Brevo; puede
// ser un Gmail, no hace falta dominio propio. Lo usan la recuperación de
// contraseña y el registro de socios.
const { randomInt } = require('crypto');

if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER) {
  console.error('❌ Correo sin configurar: faltan BREVO_API_KEY o BREVO_SENDER');
}

async function enviarCorreo({ to, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Ruta Contable', email: process.env.BREVO_SENDER },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Brevo respondió ${res.status}: ${await res.text()}`);
}

/** Código numérico de 6 dígitos. */
function generarOTP() {
  return randomInt(100000, 1000000).toString();
}

/** Escapa texto para insertarlo en HTML (el nombre lo escribe el usuario). */
function escaparHTML(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Marco común de los correos: encabezado verde y cuerpo blanco.
function marco(cuerpo) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:#10b981;padding:32px 40px;">
        <h1 style="color:white;margin:0;font-size:22px;letter-spacing:-0.5px;">Ruta Contable</h1>
      </div>
      <div style="padding:40px;">${cuerpo}</div>
    </div>
  `;
}

/**
 * Correo con un código OTP.
 * @param {object} p
 * @param {string} p.titulo   Encabezado del cuerpo ("Recuperación de contraseña").
 * @param {string} p.saludo   Texto ya escapado o generado por el sistema.
 * @param {string} p.otp
 * @param {string} p.aviso    Pie: qué hacer si no se pidió el código.
 */
function correoOTP({ titulo, saludo, otp, aviso }) {
  return marco(`
        <h2 style="color:#111827;margin:0 0 8px;font-size:20px;">${titulo}</h2>
        <p style="color:#6b7280;margin:0 0 32px;font-size:15px;">${saludo}</p>

        <div style="background:#f9fafb;border:2px dashed #10b981;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Tu código OTP</p>
          <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:14px;color:#111827;">${otp}</p>
        </div>

        <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">⏱ Este código expira en <strong>10 minutos</strong>.</p>
        <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">🔒 Solo es válido para un uso.</p>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">${aviso}</p>
  `);
}

/** Correo de recuperación de contraseña. */
function correoRecuperacion(nombre, otp) {
  return correoOTP({
    titulo: 'Recuperación de contraseña',
    saludo: `Hola <strong style="color:#111827;">${escaparHTML(nombre)}</strong>, aquí está tu código de verificación:`,
    otp,
    aviso: 'Si no solicitaste este código, ignora este correo. Tu cuenta permanece segura.',
  });
}

/** Correo con el código para verificar el correo antes de registrarse. */
function correoRegistro(otp) {
  return correoOTP({
    titulo: 'Verifica tu correo',
    saludo: 'Usa este código para continuar con tu inscripción en el club:',
    otp,
    aviso: 'Si no estás creando una cuenta, ignora este correo.',
  });
}

/** Aviso a quien intenta registrarse con un correo que ya tiene cuenta. */
function correoYaRegistrado() {
  return marco(`
        <h2 style="color:#111827;margin:0 0 8px;font-size:20px;">Ya tienes una cuenta</h2>
        <p style="color:#6b7280;margin:0 0 16px;font-size:15px;">Alguien intentó crear una cuenta nueva con este correo, pero ya existe una cuenta asociada a él.</p>
        <p style="color:#6b7280;margin:0 0 16px;font-size:15px;">Si olvidaste tu contraseña, usa la opción <strong>«¿Olvidaste tu contraseña?»</strong> en la pantalla de inicio de sesión.</p>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Si no fuiste tú, ignora este correo. Tu cuenta permanece segura.</p>
  `);
}

module.exports = {
  enviarCorreo, generarOTP, escaparHTML,
  correoRecuperacion, correoRegistro, correoYaRegistrado,
};
