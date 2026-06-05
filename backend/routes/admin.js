// routes/admin.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { formatCurrency } = require('../utils/format');

router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const now    = new Date();
    const year   = now.getFullYear();
    const month  = now.getMonth() + 1;
    const period = `${year}-${String(month).padStart(2, '0')}`;

    // Socios
    const memberStats = await pool.query(`
      SELECT
        COUNT(*)                                                  AS "totalMembers",
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END)       AS "activeMembers"
      FROM socio
    `);

    // Transacciones del mes (si ya tienes tabla; si no, devuelve 0)
    const txStats = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0)  AS "monthlyIncome",
        COALESCE(SUM(CASE WHEN tipo = 'gasto'   THEN monto ELSE 0 END), 0)  AS "monthlyExpenses",
        COUNT(*)                                                              AS "totalTransactions"
      FROM transactions
      WHERE date_trunc('month', fecha) = date_trunc('month', $1::date)
    `, [`${year}-${String(month).padStart(2, '0')}-01`]).catch(() => ({
      rows: [{ monthlyIncome: 0, monthlyExpenses: 0, totalTransactions: 0 }]
    }));

    const currency = process.env.CURRENCY || 'COP';
    const income   = Number(txStats.rows[0].monthlyIncome);
    const expenses = Number(txStats.rows[0].monthlyExpenses);
    const balance  = income - expenses;

    res.json({
      success: true,
      data: {
        summary: {
          clubBalance:     { raw: balance,  formatted: formatCurrency(balance,  currency) },
          totalBalance:    { raw: balance,  formatted: formatCurrency(balance,  currency) },
          monthlyIncome:   { raw: income,   formatted: formatCurrency(income,   currency) },
          monthlyExpenses: { raw: expenses, formatted: formatCurrency(expenses, currency) },
        },
        stats: {
          totalTransactions: Number(txStats.rows[0].totalTransactions),
          totalMembers:      Number(memberStats.rows[0].totalMembers),
          activeMembers:     Number(memberStats.rows[0].activeMembers),
          paidFees:   0, // conecta cuando tengas tabla de cuotas
          pendingFees: 0,
        },
        system: {
          clubName:   process.env.CLUB_NAME   || 'Mi Club',
          fiscalYear: Number(process.env.FISCAL_YEAR) || year,
          currency,
        },
        meta: {
          generatedAt: now.toISOString(),
          month,
          year,
        },
      },
    });
  } catch (err) {
    console.error('Error en overview:', err);
    res.status(500).json({ success: false, error: 'Error al generar el overview' });
  }
});

// ─── CIERRE MENSUAL ───────────────────────────────────────────────────────
const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

router.post('/cierre-mensual', requireAdmin, async (req, res) => {
  try {
    const { anio, mes, observaciones } = req.body;
    const year = parseInt(anio) || new Date().getFullYear();
    const month = parseInt(mes) || new Date().getMonth() + 1;

    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM transactions WHERE tipo = 'ingreso' AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
      [month, year]
    );
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM transactions WHERE tipo = 'gasto' AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
      [month, year]
    );

    const ingresos = Number(incomeResult.rows[0].total);
    const gastos = Number(expenseResult.rows[0].total);
    const balance = ingresos - gastos;

    const periodoResult = await pool.query(
      `INSERT INTO periodos (anio, mes, nombreMes, fechaInicio, fechaFin, activo, cerrado, fechaCierre, observaciones, cerradoBy)
       VALUES ($1, $2, $3, $4, $5, false, true, NOW(), $6, $7)
       ON CONFLICT (anio, mes) DO UPDATE SET
         cerrado = true,
         fechaCierre = NOW(),
         observaciones = EXCLUDED.observaciones,
         cerradoBy = EXCLUDED.cerradoBy
       RETURNING *`,
      [year, month, MONTH_NAMES[month - 1], `${year}-${String(month).padStart(2, '0')}-01`, `${year}-${String(month).padStart(2, '0')}-31`, observaciones || 'Cierre automático', req.user.username]
    );

    const transaccionesResult = await pool.query(
      `SELECT id, tipo, monto, fecha, descripcion FROM transactions WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2 ORDER BY fecha DESC`,
      [month, year]
    );

    res.json({
      success: true,
      message: `Cierre de ${MONTH_NAMES[month - 1]} ${year} completado`,
      data: {
        periodo: periodoResult.rows[0],
        resumen: {
          ingresos,
          gastos,
          balance,
          totalTransacciones: transaccionesResult.rows.length
        },
        transacciones: transaccionesResult.rows
      }
    });
  } catch (err) {
    console.error('Error en cierre mensual:', err);
    res.status(500).json({ success: false, error: 'Error al procesar el cierre mensual' });
  }
});

router.get('/periodos', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM periodos ORDER BY anio DESC, mes DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener periodos' });
  }
});

module.exports = router;