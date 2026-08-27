// routes/admin.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const ExcelJS = require('exceljs'); // Única librería de exportación requerida
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

    const currency = process.env.CURRENCY || 'COP';
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
       RETURNING *`,
      [year, month, MONTH_NAMES[month - 1], fechaInicio, fechaFin, ingresos, gastos, balance, observaciones || 'Cierre manual desde panel de reportes', cerradoPorId]
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

// ─── EXPORTAR REPORTE MENSUAL A EXCEL (.XLSX) ──────────────────────────────
router.get('/periodos/:id/exportar-excel', requireAdmin, async (req, res) => {
  try {
        const { id } = req.params;
    const periodoQuery = /^\d+$/.test(id)
      ? await pool.query(
          `SELECT mp.*, u.username AS cerrado_by_username
           FROM meses_periodo mp
           LEFT JOIN users u ON u.id = mp.cerrado_by
           WHERE mp.id_periodo = $1`,
          [id]
        )
      : await pool.query(
          `SELECT mp.*, u.username AS cerrado_by_username
           FROM meses_periodo mp
           LEFT JOIN users u ON u.id = mp.cerrado_by
           WHERE mp.cerrado = true
           ORDER BY mp.fecha_cierre DESC
           LIMIT 1`
        );

    // 2. Extraer el histórico de transacciones cruzando mes y año
    const txQuery = await pool.query(
      `SELECT t.fecha, t.tipo, t.monto, c.name AS categoria, t.metodo_pago, u.username AS creado_por, t.descripcion
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.categoria_id
       LEFT JOIN users u ON u.id = t.created_by
       WHERE EXTRACT(MONTH FROM t.fecha) = $1 AND EXTRACT(YEAR FROM t.fecha) = $2
       ORDER BY t.fecha ASC`,
      [p.mes, p.anio]
    );

    // 3. Estructurar el libro con ExcelJS
    const workbook = new ExcelJS.Workbook();
    
    // Hoja A: Resumen Ejecutivo
    const resumenSheet = workbook.addWorksheet('Resumen Financiero');
    resumenSheet.appendRow([`REPORTE FINANCIERO - ${p.nombre_mes.toUpperCase()} ${p.anio}`]);
    resumenSheet.appendRow([]);
    resumenSheet.appendRow(['Concepto', 'Valor']);
    resumenSheet.appendRow(['Total Ingresos', Number(p.total_ingresos)]);
    resumenSheet.appendRow(['Total Gastos', Number(p.total_gastos)]);
    resumenSheet.appendRow(['Balance Neto', Number(p.balance)]);
    resumenSheet.appendRow([]);
    resumenSheet.appendRow(['Cerrado por', p.cerrado_by_username || 'Sistema']);
    resumenSheet.appendRow(['Fecha Cierre', p.fecha_cierre]);
    resumenSheet.appendRow(['Observaciones', p.observaciones || '']);

    // Formatear columna de saldos como moneda local
    resumenSheet.getColumn(2).numFmt = '"$"#,##0.00';

    // Hoja B: Auditoría de Transacciones
    const txSheet = workbook.addWorksheet('Detalle Transacciones');
    txSheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Método Pago', key: 'metodo_pago', width: 15 },
      { header: 'Ejecutado Por', key: 'creado_por', width: 18 },
      { header: 'Descripción', key: 'descripcion', width: 35 },
    ];

    txQuery.rows.forEach(tx => {
      txSheet.addRow({
        fecha: new Date(tx.fecha).toISOString().split('T')[0],
        tipo: tx.tipo.toUpperCase(),
        categoria: tx.categoria || 'General',
        monto: Number(tx.monto),
        metodo_pago: tx.metodo_pago || 'N/A',
        creado_por: tx.creado_por || 'N/A',
        descripcion: tx.descripcion || ''
      });
    });

    txSheet.getColumn('monto').numFmt = '"$"#,##0.00';

    // 4. Stream de descarga binaria directa (.xlsx)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_${p.nombre_mes}_${p.anio}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exportando Excel:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Error al generar el archivo Excel' });
    }
  }
});

module.exports = router;