// utils/helpers.js
const fs = require('fs');
const path = require('path');

function validateInput(username, password) {
  const errors = [];
  if (!username || username.trim() === '') errors.push('El usuario es requerido');
  if (!password || password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');
  if (username && username.length > 50) errors.push('El usuario no puede tener más de 50 caracteres');
  if (password && password.length > 100) errors.push('La contraseña no puede tener más de 100 caracteres');
  return errors;
}

function logFailedAttempt(username, ip, reason) {
  const logEntry = `${new Date().toISOString()} | IP: ${ip} | Usuario: ${username} | Razón: ${reason}\n`;
  const logPath = path.join(__dirname, '../logs/security.log');
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logPath, logEntry);
}

module.exports = { validateInput, logFailedAttempt };