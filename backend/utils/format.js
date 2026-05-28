// utils/format.js
function formatCurrency(amount, currency = 'COP') {
  const locales = { COP: 'es-CO', USD: 'en-US', EUR: 'es-ES' };
  return new Intl.NumberFormat(locales[currency] || 'es-CO', {
    style: 'currency', currency,
    minimumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(amount);
}

module.exports = { formatCurrency };