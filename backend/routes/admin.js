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

    // Socios
    const memberStats = await pool.query(`
      SELECT
        COUNT(*)                                                 AS "totalMembers",
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END)       AS "activeMembers"
      FROM socio
    `);

    // Transacciones del mes
    const txStats = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0)  AS "monthlyIncome",
        COALESCE(SUM(CASE WHEN tipo = 'gasto'   THEN monto ELSE 0 END), 0)  AS "monthlyExpenses",
        COUNT(*)                                                              AS "totalTransactions"
      FROM transactions
      WHERE date_trunc('month', fecha) = date_trunc('month', $1::date)
        AND estado = 'confirmada'  -- RF-008/044: pendientes y anuladas no cuentan
    `, [`${year}-${String(month).padStart(2, '0')}-01`]).catch(() => ({
      rows: [{ monthlyIncome: 0, monthlyExpenses: 0, totalTransactions: 0 }]
    }));

    // Cuotas (pago_mensual): pagadas vs pendientes.
    // 'moroso' cuenta como pendiente porque sigue sin cobrarse; 'exento' y
    // 'cancelado' quedan fuera de ambos totales.
    const feeStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE estado = 'pagado')                              AS "paidFees",
        COUNT(*) FILTER (WHERE estado IN ('pendiente', 'moroso'))              AS "pendingFees",
        COUNT(*) FILTER (WHERE estado = 'moroso')                              AS "overdueFees",
        COALESCE(SUM(valor) FILTER (WHERE estado = 'pagado'), 0)               AS "paidFeesAmount",
        COALESCE(SUM(valor) FILTER (WHERE estado IN ('pendiente', 'moroso')), 0) AS "pendingFeesAmount"
      FROM pago_mensual
    `).catch(() => ({
      rows: [{ paidFees: 0, pendingFees: 0, overdueFees: 0, paidFeesAmount: 0, pendingFeesAmount: 0 }]
    }));

    // Datos del club configurados por el administrador (RF-011 / RF-013), con respaldo en variables de entorno.
    const clubRow = await pool.query(`
      SELECT
        NULLIF(TRIM(club_nombre), '') AS "clubName",
        NULLIF(TRIM(moneda), '')      AS currency
      FROM system_data
      WHERE id = 1
    `).catch(() => ({ rows: [] }));

    const club     = clubRow.rows[0] || {};
    const currency = club.currency || process.env.CURRENCY || 'COP';
    const clubName = club.clubName || process.env.CLUB_NAME || 'Mi Club';
    const paidFeesAmount    = Number(feeStats.rows[0].paidFeesAmount);
    const pendingFeesAmount = Number(feeStats.rows[0].pendingFeesAmount);
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
          paidFees:    Number(feeStats.rows[0].paidFees),
          pendingFees: Number(feeStats.rows[0].pendingFees),
          overdueFees: Number(feeStats.rows[0].overdueFees),
          paidFeesAmount:    { raw: paidFeesAmount,    formatted: formatCurrency(paidFeesAmount,    currency) },
          pendingFeesAmount: { raw: pendingFeesAmount, formatted: formatCurrency(pendingFeesAmount, currency) },
        },
        system: {
          clubName,
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
    const { anio, mes, observaciones } = req.body || {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const defaultMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const defaultYear  = currentMonth === 1 ? currentYear - 1 : currentYear;

    const year  = anio !== undefined && anio !== '' ? parseInt(anio, 10) : defaultYear;
    const month = mes !== undefined && mes !== ''   ? parseInt(mes, 10)  : defaultMonth;

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Año o mes inválido' });
    }

    // RF-034: Solo se puede cerrar un mes completado anterior al mes en curso
    if (year > currentYear || (year === currentYear && month >= currentMonth)) {
      return res.status(400).json({
        success: false,
        error: 'Solo se puede cerrar un mes completado anterior al mes en curso',
      });
    }

    // RF-034: No sobrescribir un periodo ya cerrado
    const existing = await pool.query(
      'SELECT cerrado FROM meses_periodo WHERE anio = $1 AND mes = $2',
      [year, month]
    );
    if (existing.rows.length > 0 && existing.rows[0].cerrado === true) {
      return res.status(409).json({
        success: false,
        error: `El periodo de ${MONTH_NAMES[month - 1]} ${year} ya se encuentra cerrado y no puede sobrescribirse`,
      });
    }

    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM transactions WHERE tipo = 'ingreso' AND estado = 'confirmada' AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
      [month, year]
    );
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) as total FROM transactions WHERE tipo = 'gasto' AND estado = 'confirmada' AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
      [month, year]
    );

    const ingresos = Number(incomeResult.rows[0].total);
    const gastos = Number(expenseResult.rows[0].total);
    const balance = ingresos - gastos;

    // Cálculo seguro del último día real en UTC
    const ultimoDiaReal = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const fechaInicio = `${year}-${String(month).padStart(2, '0')}-01`;
    const fechaFin    = `${year}-${String(month).padStart(2, '0')}-${String(ultimoDiaReal).padStart(2, '0')}`;
    const cerradoPorId = req.user?.id || null;

    const periodoResult = await pool.query(
      `INSERT INTO meses_periodo
         (anio, mes, nombre_mes, fecha_inicio, fecha_fin, activo, cerrado, fecha_cierre,
          total_ingresos, total_gastos, balance, observaciones, cerrado_by)
       VALUES ($1, $2, $3, $4, $5, false, true, NOW(), $6, $7, $8, $9, $10)
       ON CONFLICT (anio, mes) DO UPDATE SET
         cerrado = true,
         fecha_cierre = NOW(),
         total_ingresos = EXCLUDED.total_ingresos,
         total_gastos = EXCLUDED.total_gastos,
         balance = EXCLUDED.balance,
         observaciones = EXCLUDED.observaciones,
         cerrado_by = EXCLUDED.cerrado_by
       WHERE meses_periodo.cerrado = false
       RETURNING *`,
      [year, month, MONTH_NAMES[month - 1], fechaInicio, fechaFin, ingresos, gastos, balance, observaciones || 'Cierre manual desde panel de reportes', cerradoPorId]
    );

    // RF-034: si otro cierre (manual o el automático) ganó la carrera entre la
    // comprobación y el INSERT, el WHERE del ON CONFLICT no actualiza nada.
    if (periodoResult.rows.length === 0) {
      return res.status(409).json({
        success: false,
        error: `El periodo de ${MONTH_NAMES[month - 1]} ${year} ya se encuentra cerrado y no puede sobrescribirse`,
      });
    }

    const transaccionesResult = await pool.query(
      `SELECT id, tipo, monto, fecha, descripcion FROM transactions WHERE estado = 'confirmada' AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2 ORDER BY fecha DESC`,
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
    const result = await pool.query(
      `SELECT mp.*, u.username AS cerrado_by_username
       FROM meses_periodo mp
       LEFT JOIN users u ON u.id = mp.cerrado_by
       ORDER BY mp.anio DESC, mp.mes DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener periodos' });
  }
});

// ─── ALERTAS DEL SISTEMA (RNF-009) ────────────────────────────────────────
router.get('/alertas-sistema', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, tipo, mensaje, detalle, leida, created_at
         FROM alerta_sistema
        WHERE leida = false
        ORDER BY created_at DESC
        LIMIT 20`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener alertas del sistema' });
  }
});

router.put('/alertas-sistema/:id/leida', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    await pool.query('UPDATE alerta_sistema SET leida = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al actualizar alerta del sistema' });
  }
});

module.exports = router;
