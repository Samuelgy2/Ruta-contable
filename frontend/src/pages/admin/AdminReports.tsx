import React, { useState, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { useStats } from '../../hooks/useStats';
import { formatCurrency } from '../../utils/format';
import { exportToCSV, exportToJSON, exportTransactionsReport, exportMembersWithFees, exportTransactionsReportPDF, exportMembersReportPDF } from '../../utils/export';
import { pdf } from '@react-pdf/renderer';
import { MonthlyClosePDF } from '../../utils/pdfDocuments';

interface AdminReportsProps {
  onNavigate?: (tab: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CLUB_GREEN = '#10b981';

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

// ─── Componente principal ─────────────────────────────────────────────────────
export function AdminReports({ onNavigate }: AdminReportsProps) {
  const { transactions, members, fees, systemData } = useData();
  const stats = useStats(transactions, fees, members);
  const [cierreLoading, setCierreLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const { toasts, show: showToast } = useToast();

  // Guardamos una referencia local al último periodoID creado si existiera tras el cierre
  const [ultimoPeriodoId, setUltimoPeriodoId] = useState<number | null>(null);

  // ── Exportaciones ──────────────────────────────────────────────────────────
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

  // NUEVA FUNCIÓN: Descarga directa del archivo Excel generado desde el servidor
  const handleExportReportExcel = async () => {
    setExcelLoading(true);
    try {
      const token = localStorage.getItem('clubfinance_token');
      
      // Si ya cerramos un periodo en esta sesión usamos su ID, si no, apuntamos al último por defecto
      // (Puedes ajustar la URL según cómo obtengas el ID del periodo seleccionado en tu UI)
      const periodoId = ultimoPeriodoId || 'ultimo'; 

      const response = await fetch(`/api/admin/periodos/${periodoId}/exportar-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('No se pudo generar el archivo Excel');

      // Convertimos la respuesta binaria en un enlace descargable en el navegador
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Financiero_${new Date().getFullYear()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast('Reporte financiero exportado a Excel (.xlsx)', 'success');
    } catch (error: any) {
      showToast(`Error al exportar Excel: ${error.message}`, 'error');
    } finally {
      setExcelLoading(false);
    }
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
  const handleCierreMensual = async () => {
    const now = new Date();
    const monthName = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
      'septiembre','octubre','noviembre','diciembre'][now.getMonth()];

    const confirmed = window.confirm(
      `¿Cerrar el mes de ${monthName} ${now.getFullYear()}?\n\nEsto generará el reporte financiero del periodo.`
    );
    if (!confirmed) return;

    setCierreLoading(true);
    try {
      const token = localStorage.getItem('clubfinance_token');
      const res = await fetch('/api/admin/cierre-mensual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ observaciones: 'Cierre manual desde panel de reportes' }),
      });

      const json = await res.json();
      if (json.success) {
        // Almacenamos el ID retornado por el backend para las descargas de esta sesión
        if (json.data?.periodo?.id) {
          setUltimoPeriodoId(json.data.periodo.id);
        }
        showToast(
          `Cierre completado · Ingresos: ${formatCurrency(json.data.resumen.ingresos, 'COP')} · Balance: ${formatCurrency(json.data.resumen.balance, 'COP')}`,
          'success'
        );
      } else {
        throw new Error(json.error);
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

        {/* ── Balance general ──────────────────────────────────────── */}
        <div className="fade-up" style={{
          animationDelay: '0.05s',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px', marginBottom: '24px',
        }}>
          {/* Balance */}
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                📊
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>Balance General</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '16px', background: '#f9fafb', borderRadius: '12px',
                borderLeft: `4px solid ${stats.balance >= 0 ? CLUB_GREEN : '#ef4444'}`,
              }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Balance Total</p>
                <p style={{ fontSize: '26px', fontWeight: 700, margin: 0, color: stats.balance >= 0 ? '#059669' : '#dc2626' }}>
                  {formatCurrency(stats.balance, systemData.currency)}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <StatBox label="Ingresos"    value={formatCurrency(stats.totalIncome,  systemData.currency)} color="#10b981" />
                <StatBox label="Gastos"      value={formatCurrency(stats.totalExpense, systemData.currency)} color="#ef4444" />
              </div>
            </div>
          </div>

          {/* Cuotas */}
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                🧾
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>Cuotas</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <StatBox label="Pagadas"    value={stats.paidFees}    color="#10b981" />
              <StatBox label="Pendientes" value={stats.pendingFees} color="#f59e0b" />
              <StatBox label="Vencidas"   value={stats.overdueFees} color="#ef4444" />
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
            <ExportBtn icon="👥" label="Socios y Cuotas"    sub="Formato PDF"  onClick={handleExportMembers} />
            <ExportBtn icon="📄" label="Reporte Financiero PDF" sub="Documento Oficial"  onClick={handleExportReport} />
            
            {/* BOTÓN REQUERIDO DE EXCEL ENLAZADO CON EL BACKEND EXCELJS */}
            <ExportBtn 
              icon="🟢" 
              label={excelLoading ? 'Generando...' : 'Reporte Financiero Excel'} 
              sub="Hoja de Cálculo (.xlsx)"  
              onClick={handleExportReportExcel} 
              disabled={excelLoading}
            />
            
            <ExportBtn icon="🗄️" label="Backup Completo"    sub="Formato JSON" onClick={handleExportAllData} />
          </div>
        </div>

        {/* ── Cierre mensual ────────────────────────────────────────── */}
        <div className="fade-up" style={{
          animationDelay: '0.15s',
          background: 'white', borderRadius: '20px', padding: '28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderLeft: `4px solid ${CLUB_GREEN}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              🔒
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>Cierre Contable Mensual</h3>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px' }}>
            Genera el reporte final del periodo y cierra el mes contablemente
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleCierreMensual}
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
              Cierra el periodo y genera reporte financiero
            </span>
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