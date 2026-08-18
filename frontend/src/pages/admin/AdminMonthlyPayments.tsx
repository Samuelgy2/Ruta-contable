import React, { useState, useEffect, useCallback } from 'react';
import { usePagosMensuales, PagoMensualItem } from '../../hooks/usePagosMensuales';
import { usePeriodos } from '../../hooks/usePeriodos';
import { useSocios } from '../../hooks/useSocios';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminMonthlyPaymentsProps {
  onNavigate?: (tab: string) => void;
}

const CLUB_GREEN = '#10b981';

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; message: string; type: ToastType; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
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
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.border}`, borderRadius: '10px', padding: '14px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: '280px', maxWidth: '360px', animation: 'slideIn 0.25s ease' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: c.border, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>{c.icon}</span>
            <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeOverlay 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {children}
      </div>
      <style>{`
        @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.93) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white',
};

const f = (label: string, children: React.ReactNode, required = false): JSX.Element => (
  <div>
    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    {children}
  </div>
);

function estadoBadge(estado: string): JSX.Element {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
    pagado:    { bg: '#d1fae5', color: '#065f46', label: 'Pagado' },
    moroso:    { bg: '#fee2e2', color: '#991b1b', label: 'Moroso' },
    exento:    { bg: '#dbeafe', color: '#1e40af', label: 'Exento' },
    cancelado: { bg: '#f3f4f6', color: '#374151', label: 'Cancelado' },
  };
  const s = map[estado] ?? map['pendiente'];
  return <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
}

const emptyForm = { idSocio: '', idPeriodo: '', valor: '', fechaVencimiento: '', observaciones: '' };
type FormState = typeof emptyForm;

export function AdminMonthlyPayments({ onNavigate }: AdminMonthlyPaymentsProps) {
  const { pagosMensuales, loading, fetchPagosMensuales, createPagoMensual, updatePagoMensual } = usePagosMensuales();
  const { periodos } = usePeriodos();
  const { socios } = useSocios();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterPeriodo, setFilterPeriodo] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, show: showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => fetchPagosMensuales({
      search: searchTerm,
      estado: filterEstado === 'all' ? undefined : filterEstado,
      idPeriodo: filterPeriodo === 'all' ? undefined : filterPeriodo,
    }), 400);
    return () => clearTimeout(t);
  }, [searchTerm, filterEstado, filterPeriodo, fetchPagosMensuales]);

  const totalPendiente = pagosMensuales.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + parseFloat(p.valor), 0);
  const totalPagado = pagosMensuales.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + parseFloat(p.valor), 0);
  const totalMoroso = pagosMensuales.filter(p => p.estado === 'moroso').reduce((sum, p) => sum + parseFloat(p.valor), 0);
  const morosos = pagosMensuales.filter(p => p.estado === 'moroso');
  const proximosVencer = pagosMensuales.filter(p => {
    if (p.estado !== 'pendiente') return false;
    const dias = Math.floor((new Date(p.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= 3;
  });

  const closeForm = () => { setShowForm(false); setForm(emptyForm); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.idSocio || !form.idPeriodo || !form.valor || !form.fechaVencimiento) {
      showToast('Socio, periodo, valor y fecha de vencimiento son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createPagoMensual({
        idSocio: parseInt(form.idSocio) as any,
        idPeriodo: parseInt(form.idPeriodo) as any,
        valor: form.valor as any,
        fechaVencimiento: form.fechaVencimiento as any,
        observaciones: form.observaciones || undefined,
      } as any);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePagar = async (id: number) => {
    const result = await updatePagoMensual(id, { estado: 'pagado' } as any);
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const handleMoroso = async (id: number) => {
    const result = await updatePagoMensual(id, { estado: 'moroso' } as any);
    showToast(result.message, result.success ? 'success' : 'error');
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>➕ Registrar Pago Mensual</h3>
            <button onClick={closeForm} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {f('Socio', (
                <select value={form.idSocio} onChange={e => setForm({ ...form, idSocio: e.target.value })} style={inputStyle} required>
                  <option value="">Seleccionar socio...</option>
                  {socios.filter(s => s.estado === 'activo').map(s => (
                    <option key={s.id_socio} value={s.id_socio}>{s.nombre} — {s.documento}</option>
                  ))}
                </select>
              ), true)}
              {f('Periodo', (
                periodos.length === 0 ? (
                  <div style={{ ...inputStyle, color: '#9ca3af', display: 'flex', alignItems: 'center' }}>No hay periodos configurados</div>
                ) : (
                  <select value={form.idPeriodo} onChange={e => setForm({ ...form, idPeriodo: e.target.value })} style={inputStyle} required>
                    <option value="">Seleccionar periodo...</option>
                    {periodos.map(p => (
                      <option key={p.id_periodo} value={p.id_periodo}>{p.nombre_mes} {p.anio}</option>
                    ))}
                  </select>
                )
              ), true)}
              {f('Valor', <input type="number" min="0" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} style={inputStyle} required />, true)}
              {f('Fecha de Vencimiento', <input type="date" value={form.fechaVencimiento} onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })} style={inputStyle} required />, true)}
            </div>
            {f('Observaciones', <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f3f4f6', marginTop: '16px' }}>
              <button type="button" onClick={closeForm} disabled={submitting} style={{ padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={submitting || periodos.length === 0} style={{ padding: '11px 28px', borderRadius: '8px', border: 'none', backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? 'Guardando...' : 'Guardar Pago'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Gestión de Mensualidades</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{pagosMensuales.length} pago{pagosMensuales.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Registrar Pago
          </button>
        </div>

        {morosos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🔴</span>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>
              {morosos.length} pago{morosos.length !== 1 ? 's' : ''} en mora
            </span>
          </div>
        )}
        {proximosVencer.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🟡</span>
            <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
              {proximosVencer.length} pago{proximosVencer.length !== 1 ? 's' : ''} vence{proximosVencer.length === 1 ? '' : 'n'} en los próximos 3 días
            </span>
          </div>
        )}

        {periodos.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>ℹ️</span>
            <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
              No hay periodos configurados. Debes crear un periodo (mes) antes de registrar pagos mensuales.
            </span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Total Pendiente</p>
            <p style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#d97706' }}>{formatCurrency(totalPendiente, 'COP')}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Total Pagado</p>
            <p style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#059669' }}>{formatCurrency(totalPagado, 'COP')}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Total en Mora</p>
            <p style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#dc2626' }}>{formatCurrency(totalMoroso, 'COP')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <input type="text" placeholder="Buscar por socio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)} style={{ ...inputStyle, width: '200px' }}>
            <option value="all">Todos los meses</option>
            {periodos.map(p => (
              <option key={p.id_periodo} value={p.id_periodo}>{p.nombre_mes} {p.anio}</option>
            ))}
          </select>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ ...inputStyle, width: '160px' }}>
            <option value="all">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="moroso">Moroso</option>
            <option value="exento">Exento</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Periodo', 'Socio', 'Documento', 'Valor', 'Vencimiento', 'Fecha Pago', 'Días Mora', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando...</td></tr>
              ) : pagosMensuales.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay pagos mensuales registrados</td></tr>
              ) : pagosMensuales.map((p: PagoMensualItem) => (
                <tr key={p.id_pago} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.nombre_mes ? `${p.nombre_mes} ${p.anio}` : '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{p.socio_nombre ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.socio_documento ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{formatCurrency(parseFloat(p.valor), 'COP')}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{formatDateShort(p.fecha_vencimiento)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.fecha_pago ? formatDateShort(p.fecha_pago) : '-'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.dias_mora > 0 ? `${p.dias_mora} días` : '-'}</td>
                  <td style={{ padding: '14px 16px' }}>{estadoBadge(p.estado)}</td>
                  <td style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
                    {p.estado === 'pendiente' && (
                      <>
                        <button onClick={() => { void handlePagar(p.id_pago); }} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '12px', cursor: 'pointer' }}>Registrar Pago</button>
                        <button onClick={() => { void handleMoroso(p.id_pago); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1.5px solid #fecaca', backgroundColor: 'white', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Marcar Moroso</button>
                      </>
                    )}
                    {p.estado === 'moroso' && (
                      <button onClick={() => { void handlePagar(p.id_pago); }} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '12px', cursor: 'pointer' }}>Registrar Pago</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
