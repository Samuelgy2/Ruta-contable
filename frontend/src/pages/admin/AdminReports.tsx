import React, { useState, useCallback, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useCartera } from '../../hooks/useCartera';
import { useClubData } from '../../hooks/useClubData';
import { formatCurrency, formatDateShort } from '../../utils/format';
import { exportToCSV, exportToJSON, exportMembersReportPDF, exportTransactionsReportPDF } from '../../utils/export';

interface AdminReportsProps {
  onNavigate?: (tab: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CLUB_GREEN = '#10b981';
const API_URL: string = (import.meta as any).env?.VITE_API_URL ?? '';

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

function useOverviewSummary() {
  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) setSummary(json.data.summary);
    } catch {
      // silencioso: no bloquea el resto de la página
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSummary(); }, [fetchSummary]);
  return { summary, loading, refetch: fetchSummary };
}

function usePeriodos() {
  const [periodos, setPeriodos] = useState<PeriodoCerrado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeriodos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/periodos`, {
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
  const { transactions, members, fees, systemData } = useData();
  const { cartera } = useCartera();
  const { clubData } = useClubData();
  const { summary, loading: summaryLoading, refetch: refetchSummary } = useOverviewSummary();
  const { periodos, loading: periodosLoading, refetch: refetchPeriodos } = usePeriodos();

  const [cierreLoading, setCierreLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState<number | 'ultimo' | null>(null);
  const { toasts, show: showToast } = useToast();

  const currency = clubData?.moneda ?? systemData.currency;

  // ── Cuotas reales (tabla cartera) ──────────────────────────────────────────
  const hoy = new Date().toISOString().split('T')[0];
  const cuotasPagadas    = cartera.filter(c => c.estado === 'pagado').length;
  const cuotasVencidas   = cartera.filter(c => c.estado === 'pendiente' && c.fecha < hoy).length;
  const cuotasPendientes = cartera.filter(c => c.estado === 'pendiente' && c.fecha >= hoy).length;
  const totalCuotas = cuotasPagadas + cuotasVencidas + cuotasPendientes;
  const pctPagadas    = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;
  const pctPendientes = totalCuotas > 0 ? (cuotasPendientes / totalCuotas) * 100 : 0;
  const pctVencidas   = totalCuotas > 0 ? (cuotasVencidas / totalCuotas) * 100 : 0;

  // ── Exportaciones (formato/backup — sin cambios) ───────────────────────────
  const handleExportTransactions = () => {
    const data = transactions.map(t => ({
      fecha:      t.date,
      tipo:       t.type === 'income' ? 'Ingreso' : 'Gasto',
      categoria:  t.category,
      monto:      t.amount,
      descripcion: t.description,
      creadoPor:  t.createdBy,
    }));
    exportToCSV(data, `transacciones-${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Transacciones exportadas en CSV', 'success');
  };

  const handleExportMembers = async () => {
    await exportMembersReportPDF(members, fees, systemData);
    showToast('Reporte de socios generado en PDF', 'success');
  };

  const handleExportReport = async () => {
    await exportTransactionsReportPDF(transactions, systemData);
    showToast('Reporte financiero generado en PDF', 'success');
  };

  const handleExportAllData = () => {
    const data = {
      transactions,
      members,
      fees,
      systemData,
      exportDate: new Date().toISOString(),
    };
    exportToJSON(data, `backup-completo-${new Date().toISOString().split('T')[0]}.json`);
    showToast('Backup completo exportado en JSON', 'success');
  };



  // ── Cierre mensual ─────────────────────────────────────────────────────────
  const MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
    'septiembre','octubre','noviembre','diciembre'];

  const handleCierreMensual = async () => {
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()];

    const confirmed = window.confirm(
      `¿Cerrar el mes de ${monthName} ${now.getFullYear()}?\n\nEsto generará el reporte financiero del periodo con los datos actuales.`
    );
    if (!confirmed) return;

    setCierreLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/cierre-mensual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ observaciones: 'Cierre manual desde panel de reportes' }),
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
        <div className="fade-up" style={{ marginBottom: '28px' }}>
          <h3 style={{ margin: 0, marginBottom: '4px', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
            Reportes y Estadísticas
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
            Resumen financiero y herramientas de exportación
          </p>
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
                {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>Cuotas (Cartera)</h3>
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
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>Exportar Datos</h3>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px' }}>
            Descarga los datos del sistema en diferentes formatos
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <ExportBtn icon="📊" label="Transacciones CSV"     sub="Formato de texto"  onClick={handleExportTransactions} />
            <ExportBtn icon="👥" label="Socios y Cuotas"       sub="Formato PDF"       onClick={handleExportMembers} />
            <ExportBtn icon="📄" label="Reporte Financiero PDF" sub="Documento Oficial" onClick={handleExportReport} /> 
            <ExportBtn icon="🗄️" label="Backup Completo" sub="Formato JSON" onClick={handleExportAllData} />
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
            Calcula ingresos, gastos y balance del mes en curso a partir de las transacciones reales y deja el periodo cerrado en el sistema.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button
              onClick={() => { void handleCierreMensual(); }}
              disabled={cierreLoading}
              style={{
                padding: '11px 28px', borderRadius: '10px', border: 'none',
                backgroundColor: cierreLoading ? '#6ee7b7' : CLUB_GREEN,
                color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: cierreLoading ? 'not-allowed' : 'pointer',
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
              {cierreLoading ? 'Procesando cierre...' : 'Cerrar Mes Actual'}
            </button>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>
              Vuelve a cerrar el mismo mes para recalcularlo con las transacciones más recientes
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
                      <button
                        onClick={() => { void handleExportPeriodoExcel(p.id_periodo, `${p.nombre_mes}_${p.anio}`); }}
                        disabled={excelLoading !== null}
                        style={{
                          padding: '6px 14px', borderRadius: '7px', border: '1px solid #d1fae5',
                          backgroundColor: '#f0fdf4', color: '#065f46', fontSize: '12px', fontWeight: 600,
                          cursor: excelLoading !== null ? 'default' : 'pointer',
                        }}
                      >
                        {excelLoading === p.id_periodo ? 'Generando...' : '⬇ Excel'}
                      </button>
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