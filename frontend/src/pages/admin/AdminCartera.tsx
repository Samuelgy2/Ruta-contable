import React, { useState, useEffect, useCallback } from 'react';
import { usePaginacion } from '../../hooks/usePaginacion';
import { Paginacion } from '../../components/ui/Paginacion';
import { useCartera, CarteraItem, TipoCartera } from '../../hooks/useCartera';
import { useSocios } from '../../hooks/useSocios';
import { carteraService } from '../../services/carteraService';
import { formatCurrency, formatDateShort, hoyLocal } from '../../utils/format';

interface AdminCarteraProps {
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
    anulado:   { bg: '#f3f4f6', color: '#374151', label: 'Anulado' },
  };
  const s = map[estado] ?? map['pendiente'];
  return <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
}

const emptyForm = { idSocio: '', idTipoCartera: '', fecha: hoyLocal(), concepto: '', valor: '', observaciones: '' };
type FormState = typeof emptyForm;

export function AdminCartera({ onNavigate }: AdminCarteraProps) {
  const { cartera, loading, fetchCartera, createCartera, updateCartera } = useCartera();
  const { socios } = useSocios();
  const pagCartera = usePaginacion(cartera);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, show: showToast } = useToast();

  // Tipos de cartera (RF-081)
  const [tipos, setTipos] = useState<TipoCartera[]>([]);
  const [showTipos, setShowTipos] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState('');

  const fetchTipos = useCallback(async () => {
    try {
      const r = await carteraService.getTipos();
      if (r.success) setTipos(r.data || []);
    } catch { /* la lista queda vacía; el formulario sigue funcionando sin tipo */ }
  }, []);
  useEffect(() => { void fetchTipos(); }, [fetchTipos]);

  const errorMsg = (err: any) => err.response?.data?.message || err.message || 'Error inesperado';

  const handleCrearTipo = async () => {
    if (!nuevoTipo.trim()) { showToast('Escribe el nombre del tipo', 'error'); return; }
    try {
      const r = await carteraService.createTipo({ nombre: nuevoTipo.trim() });
      showToast(r.message, r.success ? 'success' : 'error');
      if (r.success) { setNuevoTipo(''); await fetchTipos(); }
    } catch (err) { showToast(errorMsg(err), 'error'); }
  };

  const handleEliminarTipo = async (t: TipoCartera) => {
    if (!window.confirm(`¿Eliminar el tipo "${t.nombre}"?`)) return;
    try {
      const r = await carteraService.removeTipo(t.id_tipo);
      showToast(r.message, r.success ? 'success' : 'error');
      if (r.success) await fetchTipos();
    } catch (err) { showToast(errorMsg(err), 'error'); }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchCartera({ search: searchTerm, estado: filterEstado === 'all' ? undefined : filterEstado }), 400);
    return () => clearTimeout(t);
  }, [searchTerm, filterEstado, fetchCartera]);

  // Alerta: cartera pendiente vencida hace más de 30 días
  const carteraVencida = cartera.filter(c => {
    if (c.estado !== 'pendiente') return false;
    const dias = Math.floor((Date.now() - new Date(c.fecha).getTime()) / (1000 * 60 * 60 * 24));
    return dias > 30;
  });

  const totalPendiente = cartera.filter(c => c.estado === 'pendiente').reduce((sum, c) => sum + parseFloat(c.valor), 0);
  const totalPagado = cartera.filter(c => c.estado === 'pagado').reduce((sum, c) => sum + parseFloat(c.valor), 0);

  const closeForm = () => { setShowForm(false); setForm(emptyForm); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.idSocio || !form.concepto.trim() || !form.valor || !form.fecha) {
      showToast('Socio, concepto, valor y fecha son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createCartera({
        idSocio: parseInt(form.idSocio),
        idTipoCartera: form.idTipoCartera ? parseInt(form.idTipoCartera) : undefined,
        fecha: form.fecha,
        concepto: form.concepto.trim(),
        valor: form.valor,
        observaciones: form.observaciones || undefined,
      } as any);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const [pagoModalId, setPagoModalId] = useState<number | null>(null);
  const [metodoPagoSel, setMetodoPagoSel] = useState<string>('efectivo');
  const [referenciaPago, setReferenciaPago] = useState<string>('');

  const handlePagar = (id: number) => {
    setPagoModalId(id);
    setMetodoPagoSel('efectivo');
    setReferenciaPago('');
  };

  const confirmarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pagoModalId === null) return;
    setSubmitting(true);
    try {
      const result = await updateCartera(pagoModalId, {
        estado: 'pagado',
        metodoPago: metodoPagoSel,
        referencia: referenciaPago.trim() || undefined,
      } as any);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) setPagoModalId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {pagoModalId !== null && (
        <Modal onClose={() => setPagoModalId(null)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>?? Confirmar m?todo de pago</h3>
            <button onClick={() => setPagoModalId(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>?</button>
          </div>
          <form onSubmit={(e) => { void confirmarPago(e); }}>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              {f('M?todo de Pago', (
                <select value={metodoPagoSel} onChange={e => setMetodoPagoSel(e.target.value)} style={inputStyle} required>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="cheque">Cheque</option>
                </select>
              ), true)}
              {f('Referencia / Comprobante (opcional)', (
                <input value={referenciaPago} onChange={e => setReferenciaPago(e.target.value)} style={inputStyle} placeholder="Nro. comprobante..." />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setPagoModalId(null)} disabled={submitting} style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {submitting ? ' Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>➕ Nuevo Cargo a Cartera</h3>
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
              {f('Fecha', <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inputStyle} required />, true)}
              {f('Concepto', <input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} style={inputStyle} placeholder="Recargo por mora, cuota pendiente..." required />, true)}
              {f('Valor', <input type="number" min="0" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} style={inputStyle} required />, true)}
              {f('Tipo de cartera', (
                <select value={form.idTipoCartera} onChange={e => setForm({ ...form, idTipoCartera: e.target.value })} style={inputStyle}>
                  <option value="">Sin tipo</option>
                  {tipos.filter(t => t.activo).map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>)}
                </select>
              ))}
            </div>
            {f('Observaciones', <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f3f4f6', marginTop: '16px' }}>
              <button type="button" onClick={closeForm} disabled={submitting} style={{ padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ padding: '11px 28px', borderRadius: '8px', border: 'none', backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? 'Guardando...' : 'Guardar Cargo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showTipos && (
        <Modal onClose={() => setShowTipos(false)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Tipos de cartera</h3>
            <button onClick={() => setShowTipos(false)} aria-label="Cerrar" style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} maxLength={50} placeholder="Nuevo tipo (p. ej. Contado)" aria-label="Nombre del nuevo tipo" style={{ ...inputStyle, flex: 1 }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleCrearTipo(); } }} />
            <button onClick={() => { void handleCrearTipo(); }} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontWeight: '600', cursor: 'pointer' }}>Agregar</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                {['Nombre', 'Registros', ''].map(h => <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tipos.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>No hay tipos registrados</td></tr>
              ) : tipos.map(t => (
                <tr key={t.id_tipo} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 8px', fontSize: '14px' }}>{t.nombre}</td>
                  <td style={{ padding: '10px 8px', fontSize: '14px', color: '#6b7280' }}>{t.registros}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <button onClick={() => { void handleEliminarTipo(t); }} disabled={t.registros > 0}
                      title={t.registros > 0 ? 'Tiene registros de cartera asociados' : 'Eliminar'}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', color: t.registros > 0 ? '#d1d5db' : '#dc2626', fontSize: '12px', cursor: t.registros > 0 ? 'not-allowed' : 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Cartera</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{cartera.length} registro{cartera.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowTipos(true)} style={{ padding: '11px 20px', borderRadius: '10px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Tipos de cartera
            </button>
            <button onClick={() => setShowForm(true)} style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              + Nuevo Cargo
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Total Pendiente</p>
            <p style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#d97706' }}>{formatCurrency(totalPendiente, 'COP')}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Total Cobrado</p>
            <p style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#059669' }}>{formatCurrency(totalPagado, 'COP')}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Vencidos (+30 días)</p>
            <p style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#dc2626' }}>{carteraVencida.length}</p>
          </div>
        </div>

        {carteraVencida.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🔴</span>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>
              {carteraVencida.length} registro{carteraVencida.length !== 1 ? 's' : ''} de cartera vencido{carteraVencida.length !== 1 ? 's' : ''} hace más de 30 días
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <input type="text" placeholder="Buscar por socio o concepto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ ...inputStyle, width: '180px' }}>
            <option value="all">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="anulado">Anulado</option>
          </select>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Fecha', 'Socio', 'Documento', 'Concepto', 'Tipo', 'Valor', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando...</td></tr>
              ) : cartera.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay registros de cartera</td></tr>
              ) : pagCartera.itemsPagina.map(c => (
                <tr key={c.id_cartera} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{formatDateShort(c.fecha)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{c.socio_nombre ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{c.socio_documento ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{c.concepto}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{c.tipo_cartera_nombre ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>{formatCurrency(parseFloat(c.valor), 'COP')}</td>
                  <td style={{ padding: '14px 16px' }}>{estadoBadge(c.estado)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {c.estado === 'pendiente' && (
                      <button onClick={() => { void handlePagar(c.id_cartera); }} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '12px', cursor: 'pointer' }}>Registrar Pago</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginacion {...pagCartera} etiqueta="movimientos" />
        </div>
      </div>
    </div>
  );
}
