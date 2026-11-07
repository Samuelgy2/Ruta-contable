const pool = require('../db');

// RN-018.3 / RF-034: el cierre guarda los totales del mes y el periodo queda
// inmutable. Si después se registra, edita o borra un movimiento con fecha en
// ese mes, el total guardado deja de coincidir con las transacciones reales.
//
// Devuelve el primer periodo cerrado que contiene alguna de las fechas, o null.
// Acepta 'AAAA-MM-DD' o los Date que pg devuelve para columnas date; la
// comparación se hace en SQL para no depender de la zona horaria del servidor.
async function buscarPeriodoCerrado(fechas, db = pool) {
  const lista = fechas.filter((f) => f !== undefined && f !== null && f !== '');
  if (lista.length === 0) return null;
  const { rows } = await db.query(
    `SELECT anio, mes, nombre_mes
       FROM meses_periodo
      WHERE cerrado = true
        AND (anio, mes) IN (SELECT EXTRACT(YEAR FROM f)::int, EXTRACT(MONTH FROM f)::int
                              FROM unnest($1::date[]) AS f)
      ORDER BY anio, mes
      LIMIT 1`,
    [lista]
  );
  return rows[0] || null;
}

function mensajePeriodoCerrado(periodo) {
  return `El periodo de ${periodo.nombre_mes} ${periodo.anio} está cerrado: no se pueden registrar, modificar ni eliminar movimientos con fecha en ese mes.`;
}

module.exports = { buscarPeriodoCerrado, mensajePeriodoCerrado };
