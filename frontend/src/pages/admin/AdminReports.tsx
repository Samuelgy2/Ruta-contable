import React, { useState, useCallback, useEffect } from 'react';
import { useClubData } from '../../hooks/useClubData';
import { formatCurrency, formatDateShort, hoyLocal } from '../../utils/format';
import { exportToCSV, exportToJSON, exportReportePDF } from '../../utils/export';
import { ColumnaReporte } from '../../utils/pdfDocuments';
import { API_URL } from '../../services/apiConfig';

interface AdminReportsProps {
  onNavigate?: (tab: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CLUB_GREEN = '#10b981';
const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
  'septiembre','octubre','noviembre','diciembre'];

function getToken(): string {
  return localStorage.getItem('clubfinance_token') ?? '';
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: '#f0fdf4', border: '#10b981', icon: '✓' },
    error:   { bg: '#fef2f2', border: '#ef4444', icon: '✕' },
    warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠' },
  };
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => {
        const c = colors[t.type];
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: c.bg, border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${c.border}`, borderRadius: '10px',
            padding: '14px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: '280px', maxWidth: '400px', animation: 'slideIn 0.25s ease',
          }}>
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%',
              backgroundColor: c.border, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', flexShrink: 0,
            }}>{c.icon}</span>
            <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Overview real (balance del club) ──────────────────────────────────────────
interface OverviewSummary {
  clubBalance: { raw: number; formatted: string };
  monthlyIncome: { raw: number; formatted: string };
  monthlyExpenses: { raw: number; formatted: string };
}

interface PeriodoCerrado {
  id_periodo: number;
  anio: number;
  mes: number;
  nombre_mes: string;
  cerrado: boolean;
  fecha_cierre: string | null;
  total_ingresos: string | number;
  total_gastos: string | number;
  balance: string | number;
  cerrado_by_username: string | null;
}

async function getJSON(path: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  return res.json();
}

// Balance, transacciones confirmadas y cartera del periodo elegido (RF-023/033/036).
function useDatosPeriodo(anio: number, mes: number) {
  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [cartera, setCartera] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    try {
      const qs = `anio=${anio}&mes=${mes}`;
      const [ov, tx, ca] = await Promise.all([
        getJSON(`/admin/overview?${qs}`), getJSON(`/transactions?${qs}`), getJSON(`/cartera?${qs}`),
      ]);
      setSummary(ov.success ? ov.data.summary : null);
      // Solo información contable válida (RF-026 RN-002.1), igual que el balance del overview.
      setTransacciones(tx.success ? tx.data.filter((t: any) => t.estado === 'confirmada') : []);
      setCartera(ca.success ? ca.data : []);
    } catch {
      setSummary(null); setTransacciones([]); setCartera([]);
    } finally {
      setLoading(false);
    }
  }, [anio, mes]);

  useEffect(() => { void fetchDatos(); }, [fetchDatos]);
  return { summary, transacciones, cartera, loading, refetch: fetchDatos };
}

type TipoReporte = 'resumen' | 'transacciones' | 'cartera';

const REPORTES: Record<TipoReporte, { titulo: string; columnas: ColumnaReporte[] }> = {
  resumen: {
    titulo: 'Resumen financiero',
    columnas: [{ clave: 'concepto', titulo: 'Concepto' }, { clave: 'valor', titulo: 'Valor', moneda: true }],
  },
  transacciones: {
    titulo: 'Transacciones',
    columnas: [
      { clave: 'fecha', titulo: 'Fecha' }, { clave: 'tipo', titulo: 'Tipo' }, { clave: 'categoria', titulo: 'Categoría' },
      { clave: 'descripcion', titulo: 'Descripción' }, { clave: 'metodo', titulo: 'Método' }, { clave: 'monto', titulo: 'Monto', moneda: true },
    ],
  },
  cartera: {
    titulo: 'Cartera',
    columnas: [
      { clave: 'fecha', titulo: 'Fecha' }, { clave: 'socio', titulo: 'Socio' }, { clave: 'concepto', titulo: 'Concepto' },
      { clave: 'tipo', titulo: 'Tipo' }, { clave: 'estado', titulo: 'Estado' }, { clave: 'valor', titulo: 'Valor', moneda: true },
    ],
  },
};

function usePeriodos() {
  const [periodos, setPeriodos] = useState<PeriodoCerrado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeriodos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/periodos`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) setPeriodos(json.data || []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPeriodos(); }, [fetchPeriodos]);
  return { periodos, loading, refetch: fetchPeriodos };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function AdminReports({ onNavigate }: AdminReportsProps) {
  const { clubData } = useClubData();
  // Criterios del reporte: periodo (AAAA-MM, mes en curso por defecto) y tipo.
  const [periodo, setPeriodo] = useState(hoyLocal().slice(0, 7));
  const [tipo, setTipo] = useState<TipoReporte>('resumen');
  const periodoValido = /^\d{4}-\d{2}$/.test(periodo) ? periodo : hoyLocal().slice(0, 7);
  const anio = Number(periodoValido.slice(0, 4));
  const mes  = Number(periodoValido.slice(5, 7));
  const { summary, transacciones, cartera, loading: summaryLoading, refetch: refetchSummary } = useDatosPeriodo(anio, mes);
  const { periodos, loading: periodosLoading, refetch: refetchPeriodos } = usePeriodos();

  const [cierreLoading, setCierreLoading] = useState(false);
  const { toasts, show: showToast } = useToast();

  const currency = clubData?.moneda ?? 'COP';

  // ── Cuotas reales (tabla cartera) ──────────────────────────────────────────
  const hoy = hoyLocal();
  const cuotasPagadas    = cartera.filter(c => c.estado === 'pagado').length;
  const cuotasVencidas   = cartera.filter(c => c.estado === 'pendiente' && c.fecha < hoy).length;
  const cuotasPendientes = cartera.filter(c => c.estado === 'pendiente' && c.fecha >= hoy).length;
  const totalCuotas = cuotasPagadas + cuotasVencidas + cuotasPendientes;
  const pctPagadas    = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;
  const pctPendientes = totalCuotas > 0 ? (cuotasPendientes / totalCuotas) * 100 : 0;
  const pctVencidas   = totalCuotas > 0 ? (cuotasVencidas / totalCuotas) * 100 : 0;

  // ── Reporte seleccionado: mismas filas en pantalla, CSV, PDF y JSON (RF-036 RN-004) ──
  const sumaCartera = (estado: string) => cartera.filter(c => c.estado === estado).reduce((s, c) => s + Number(c.valor), 0);
  const filas: Record<string, string | number | null>[] =
    tipo === 'resumen' ? (summary ? [
      { concepto: 'Ingresos', valor: summary.monthlyIncome.raw },
      { concepto: 'Gastos', valor: summary.monthlyExpenses.raw },
      { concepto: 'Balance', valor: summary.clubBalance.raw },
      { concepto: 'Cartera cobrada', valor: sumaCartera('pagado') },
      { concepto: 'Cartera pendiente', valor: sumaCartera('pendiente') },
    ] : [])
    : tipo === 'transacciones' ? transacciones.map(t => ({
      fecha: formatDateShort(t.fecha), tipo: t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
      categoria: t.categoria_nombre ?? '', descripcion: t.descripcion ?? '', metodo: t.metodo_pago ?? '', monto: Number(t.monto),
    }))
    : cartera.map(c => ({
      fecha: formatDateShort(c.fecha), socio: c.socio_nombre ?? '', concepto: c.concepto ?? '',
      tipo: c.tipo_cartera_nombre ?? '', estado: c.estado, valor: Number(c.valor),
    }));
  const reporte = REPORTES[tipo];
  // RF-026 RN-002.3: el reporte lleva periodo consultado y fecha de generación.
  const periodoLabel = `${MONTH_NAMES[mes - 1]} ${anio}`;
  const archivo = `reporte-${tipo}-${periodoValido}`;
  const conTitulos = () => filas.map(f => Object.fromEntries(reporte.columnas.map(c => [c.titulo, f[c.clave]])));

  const handleExportCSV = () => {
    exportToCSV(conTitulos(), `${archivo}.csv`);
  };
  const handleExportPDF = async () => {
    await exportReportePDF({
      club: clubData?.club_nombre || 'Club', titulo: reporte.titulo, periodo: periodoLabel,
      generado: new Date().toLocaleString('es-CO'), moneda: currency, columnas: reporte.columnas, filas,
    }, `${archivo}.pdf`);
    showToast(`${reporte.titulo} generado en PDF`, 'success');
  };
  const handleExportJSON = () => {
    exportToJSON({ reporte: reporte.titulo, periodo: periodoLabel, generado: new Date().toISOString(), filas: conTitulos() }, `${archivo}.json`);
    showToast(`${reporte.titulo} exportado en JSON`, 'success');
  };

  // ── Cierre mensual (RF-034) ────────────────────────────────────────────────
  const nowDate = new Date();
  const prevMonthNum  = nowDate.getMonth() === 0 ? 12 : nowDate.getMonth();
  const prevYearNum   = nowDate.getMonth() === 0 ? nowDate.getFullYear() - 1 : nowDate.getFullYear();
  const prevMonthName = MONTH_NAMES[prevMonthNum - 1];
  const prevAlreadyClosed = periodos.some(
    p => Number(p.anio) === prevYearNum && Number(p.mes) === prevMonthNum && p.cerrado
  );

  const handleCierreMensual = async () => {
    const confirmed = window.confirm(
      `¿Cerrar definitivamente el periodo de ${prevMonthName} ${prevYearNum}?\n\nUna vez cerrado el periodo contable, no podrá sobrescribirse.`
    );
    if (!confirmed) return;

    setCierreLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/cierre-mensual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          anio: prevYearNum,
          mes: prevMonthNum,
          observaciones: 'Cierre manual desde panel de reportes',
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          `Cierre completado · Ingresos: ${formatCurrency(json.data.resumen.ingresos, currency)} · Balance: ${formatCurrency(json.data.resumen.balance, currency)}`,
          'success'
        );
        await Promise.all([refetchSummary(), refetchPeriodos()]);
      } else {
        throw new Error(json.error || 'Error desconocido');
      }
    } catch (error: any) {
      showToast(`Error en cierre: ${error.message}`, 'error');
    } finally {
      setCierreLoading(false);
    }
  };

  // ── Tarjeta de stat ────────────────────────────────────────────────────────
  const StatBox = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <div style={{
      padding: '14px 16px', borderRadius: '10px', background: '#f9fafb',
      borderLeft: `3px solid ${color ?? '#e5e7eb'}`,
    }}>
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: color ?? '#111827' }}>{value}</p>
    </div>
  );

  // ── Botón de exportación ───────────────────────────────────────────────────
  const ExportBtn = ({ icon, label, sub, onClick, disabled }: {
    icon: string; label: string; sub: string; onClick: () => void; disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '8px', padding: '24px 16px', borderRadius: '14px',
        border: '1.5px solid #e5e7eb', backgroundColor: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        opacity: disabled ? 0.6 : 1,
        width: '100%',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)';
          (e.currentTarget as HTMLElement).style.borderColor = CLUB_GREEN;
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
        (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
      }}
    >
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{label}</span>
      <span style={{ fontSize: '12px', color: '#9ca3af' }}>{sub}</span>
    </button>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
        @keyframes skeletonPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <ToastContainer toasts={toasts} />

      <div className="container">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="fade-up" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: '4px', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
              Reportes y Estadísticas
            </h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
              Elige el periodo y el tipo de reporte; se exporta lo mismo que ves
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
              Periodo
              <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} required
                style={{ padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
              Tipo de reporte
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoReporte)}
                style={{ padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', backgroundColor: 'white' }}>
                {(Object.keys(REPORTES) as TipoReporte[]).map(k => <option key={k} value={k}>{REPORTES[k].titulo}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* ── Balance general + Cuotas ───────────────────────────────── */}
        <div className="fade-up" style={{
          animationDelay: '0.05s',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px', marginBottom: '24px',
        }}>
          {/* Balance General */}
          <div style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)',
            borderRadius: '20px', padding: '28px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #f3f4f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  📊
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>Balance General</h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {periodoLabel}
              </span>
            </div>

            {summaryLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '72px', borderRadius: '12px', background: '#f3f4f6', animation: 'skeletonPulse 1.4s ease-in-out infinite' }} />
                <div style={{ height: '56px', borderRadius: '12px', background: '#f3f4f6', animation: 'skeletonPulse 1.4s ease-in-out infinite' }} />
              </div>
            ) : summary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '18px', background: summary.clubBalance.raw >= 0 ? '#ecfdf5' : '#fef2f2', borderRadius: '14px',
                  border: `1px solid ${summary.clubBalance.raw >= 0 ? '#a7f3d0' : '#fecaca'}`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <p style={{ fontSize: '12px', color: summary.clubBalance.raw >= 0 ? '#059669' : '#dc2626', margin: '0 0 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Saldo del Club
                  </p>
                  <p style={{ fontSize: '30px', fontWeight: 800, margin: 0, color: summary.clubBalance.raw >= 0 ? '#059669' : '#dc2626', letterSpacing: '-0.5px' }}>
                    {formatCurrency(summary.clubBalance.raw, currency)}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <StatBox label="Ingresos del mes" value={formatCurrency(summary.monthlyIncome.raw,  currency)} color="#10b981" />
                  <StatBox label="Gastos del mes"    value={formatCurrency(summary.monthlyExpenses.raw, currency)} color="#ef4444" />
                </div>
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>No se pudo cargar el balance del club.</p>
            )}
          </div>

          {/* Cuotas */}
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid #f3f4f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                🧾
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>Cuotas (Cartera) · <span style={{ textTransform: 'capitalize' }}>{periodoLabel}</span></h3>
            </div>

            {/* Barra de proporción */}
            {totalCuotas > 0 && (
              <div style={{ display: 'flex', height: '10px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '18px', backgroundColor: '#f3f4f6' }}>
                <div style={{ width: `${pctPagadas}%`, backgroundColor: '#10b981' }} />
                <div style={{ width: `${pctPendientes}%`, backgroundColor: '#f59e0b' }} />
                <div style={{ width: `${pctVencidas}%`, backgroundColor: '#ef4444' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <StatBox label={`Pagadas${totalCuotas > 0 ? ` · ${pctPagadas.toFixed(0)}%` : ''}`}    value={cuotasPagadas}    color="#10b981" />
              <StatBox label={`Pendientes${totalCuotas > 0 ? ` · ${pctPendientes.toFixed(0)}%` : ''}`} value={cuotasPendientes} color="#f59e0b" />
              <StatBox label={`Vencidas${totalCuotas > 0 ? ` · ${pctVencidas.toFixed(0)}%` : ''}`}   value={cuotasVencidas}   color="#ef4444" />
            </div>
          </div>
        </div>

        {/* ── Exportaciones ────────────────────────────────────────── */}
        <div className="fade-up" style={{
          animationDelay: '0.1s',
          background: 'white', borderRadius: '20px', padding: '28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              💾
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>
              {reporte.titulo} · <span style={{ textTransform: 'capitalize' }}>{periodoLabel}</span>
            </h3>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px' }}>
            {tipo === 'transacciones' ? 'Solo transacciones confirmadas.' : tipo === 'cartera' ? 'Registros de cartera con fecha en el periodo.' : 'Totales del periodo (transacciones confirmadas y cartera).'}
          </p>
          <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid #f3f4f6', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {reporte.columnas.map(c => (
                    <th key={c.clave} style={{ textAlign: c.moneda ? 'right' : 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 600 }}>{c.titulo}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaryLoading ? (
                  <tr><td colSpan={reporte.columnas.length} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Cargando...</td></tr>
                ) : filas.length === 0 ? (
                  <tr><td colSpan={reporte.columnas.length} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Sin registros en el periodo</td></tr>
                ) : filas.map((f, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    {reporte.columnas.map(c => (
                      <td key={c.clave} style={{ padding: '10px 14px', textAlign: c.moneda ? 'right' : 'left', color: '#374151' }}>
                        {c.moneda ? formatCurrency(Number(f[c.clave] ?? 0), currency) : String(f[c.clave] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <ExportBtn icon="📊" label="Exportar CSV"  sub="Formato de texto" onClick={handleExportCSV} disabled={summaryLoading} />
            <ExportBtn icon="📄" label="Exportar PDF"  sub="Documento"        onClick={() => { void handleExportPDF(); }} disabled={summaryLoading} />
            <ExportBtn icon="🗄️" label="Exportar JSON" sub="Datos estructurados" onClick={handleExportJSON} disabled={summaryLoading} />
          </div>
        </div>

        {/* ── Cierre mensual ────────────────────────────────────────── */}
        <div className="fade-up" style={{
          animationDelay: '0.15s',
          background: 'white', borderRadius: '20px', padding: '28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderLeft: `4px solid ${CLUB_GREEN}`,
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              🔒
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>Cierre Contable Mensual</h3>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px' }}>
            Calcula ingresos, gastos y balance del último mes completado ({prevMonthName} {prevYearNum}) a partir de las transacciones reales y deja el periodo cerrado e inmutable en el sistema.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button
              onClick={() => { void handleCierreMensual(); }}
              disabled={cierreLoading || prevAlreadyClosed}
              style={{
                padding: '11px 28px', borderRadius: '10px', border: 'none',
                backgroundColor: (cierreLoading || prevAlreadyClosed) ? '#9ca3af' : CLUB_GREEN,
                color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: (cierreLoading || prevAlreadyClosed) ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {cierreLoading && (
                <span style={{
                  width: '14px', height: '14px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {cierreLoading
                ? 'Procesando cierre...'
                : prevAlreadyClosed
                  ? `Periodo ${prevMonthName} ${prevYearNum} Cerrado`
                  : `Cerrar ${prevMonthName} ${prevYearNum}`}
            </button>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>
              {prevAlreadyClosed
                ? 'Este periodo ya fue cerrado y no admite sobrescritura (RF-034)'
                : 'Solo se pueden cerrar meses completados anteriores al mes en curso'}
            </span>
          </div>

          {/* Historial de periodos cerrados */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '18px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Periodos Cerrados
            </p>
            {periodosLoading ? (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Cargando historial...</p>
            ) : periodos.filter(p => p.cerrado).length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Todavía no se ha cerrado ningún mes.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {periodos.filter(p => p.cerrado).map(p => (
                  <div key={p.id_periodo} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '10px', background: '#f9fafb', flexWrap: 'wrap', gap: '10px',
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2937', textTransform: 'capitalize' }}>
                        {p.nombre_mes} {p.anio}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                        Cerrado {p.fecha_cierre ? formatDateShort(p.fecha_cierre) : '—'}
                        {p.cerrado_by_username ? ` por ${p.cerrado_by_username}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>{formatCurrency(Number(p.total_ingresos), currency)}</span>
                      <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{formatCurrency(Number(p.total_gastos), currency)}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: Number(p.balance) >= 0 ? '#059669' : '#dc2626' }}>
                        {formatCurrency(Number(p.balance), currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
