import React, { useState, useEffect, useCallback } from 'react';
import { useCompras, Compra, DetalleCompra } from '../../hooks/useCompras';
import { useProveedores } from '../../hooks/useProveedores';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminComprasProps {
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

function Modal({ children, onClose, maxWidth = '560px' }: { children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'fadeOverlay 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {children}
      </div>
      <style>{`
        @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.93) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px 32px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1f2937', fontSize: '17px' }}>{title}</h3>
        <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Confirmar</button>
        </div>
      </div>
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

const emptyForm = {
  concepto: '', tipo: '', fecha: new Date().toISOString().split('T')[0],
  idProveedor: '', factura: '', observaciones: '',
};
type FormState = typeof emptyForm;

function estadoBadge(estado: string): JSX.Element {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
    aprobada:  { bg: '#d1fae5', color: '#065f46', label: 'Aprobada' },
  };
  const s = map[estado] ?? map['pendiente'];
  return <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
}

// ─── Detalle de compra ─────────────────────────────────────────────────────────
function DetalleModal({ compra, onClose, onAdded, onRemoved, showToast }: {
  compra: Compra; onClose: () => void;
  onAdded: (concepto: string, cantidad: number, valorUnitario: number) => Promise<{ success: boolean; message: string }>;
  onRemoved: (nroLinea: number) => Promise<{ success: boolean; message: string }>;
  showToast: (msg: string, type: ToastType) => void;
}) {
  const [lineForm, setLineForm] = useState({ concepto: '', cantidad: '1', valorUnitario: '' });
  const [detalle, setDetalle] = useState<DetalleCompra[]>(compra.detalle ?? []);
  const [submitting, setSubmitting] = useState(false);
  const puedeEditar = compra.estado === 'aprobada';

  const total = detalle.reduce((sum, d) => sum + parseFloat(d.valor_total), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineForm.concepto.trim() || !lineForm.valorUnitario) {
      showToast('Concepto y valor unitario son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    const result = await onAdded(lineForm.concepto.trim(), parseInt(lineForm.cantidad) || 1, parseFloat(lineForm.valorUnitario));
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      setLineForm({ concepto: '', cantidad: '1', valorUnitario: '' });
    }
    setSubmitting(false);
  };

  return (
    <Modal onClose={onClose} maxWidth="640px">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Detalle de Compra — {compra.concepto}</h3>
        <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
      </div>

      {!puedeEditar && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '13px', marginBottom: '16px' }}>
          Esta compra debe estar <strong>aprobada</strong> antes de poder registrar líneas de detalle.
        </div>
      )}

      <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              {['#', 'Concepto', 'Cant.', 'V. Unitario', 'V. Total', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detalle.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>Sin líneas de detalle</td></tr>
            ) : detalle.map(d => (
              <tr key={d.nro_linea} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>{d.nro_linea}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1f2937' }}>{d.concepto}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>{d.cantidad}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>{formatCurrency(parseFloat(d.valor_unitario), 'COP')}</td>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>{formatCurrency(parseFloat(d.valor_total), 'COP')}</td>
                <td style={{ padding: '10px 12px' }}>
                  {puedeEditar && (
                    <button
                      onClick={async () => {
                        const result = await onRemoved(d.nro_linea);
                        showToast(result.message, result.success ? 'warning' : 'error');
                        if (result.success) setDetalle(prev => prev.filter(x => x.nro_linea !== d.nro_linea));
                      }}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}
                    >Quitar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {detalle.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb' }}>
                <td colSpan={4} style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#374151' }}>Total</td>
                <td colSpan={2} style={{ padding: '10px 12px', fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(total, 'COP')}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {puedeEditar && (
        <form onSubmit={(e) => { void handleAdd(e); }} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          {f('Concepto', <input value={lineForm.concepto} onChange={e => setLineForm({ ...lineForm, concepto: e.target.value })} style={inputStyle} placeholder="Ítem" />)}
          {f('Cantidad', <input type="number" min="1" value={lineForm.cantidad} onChange={e => setLineForm({ ...lineForm, cantidad: e.target.value })} style={inputStyle} />)}
          {f('V. Unitario', <input type="number" min="0" value={lineForm.valorUnitario} onChange={e => setLineForm({ ...lineForm, valorUnitario: e.target.value })} style={inputStyle} placeholder="0" />)}
          <button type="submit" disabled={submitting} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN, color: 'white', fontSize: '13px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer', height: '40px' }}>
            + Agregar
          </button>
        </form>
      )}
    </Modal>
  );
}

export function AdminCompras({ onNavigate }: AdminComprasProps) {
  const { compras, loading, fetchCompras, createCompra, aprobarCompra, removeCompra, getDetalleCompra, addDetalle, removeDetalle } = useCompras();
  const { proveedores } = useProveedores();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [detalleCompra, setDetalleCompra] = useState<Compra | null>(null);
  const { toasts, show: showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => fetchCompras({ search: searchTerm, estado: filterEstado === 'all' ? undefined : filterEstado }), 400);
    return () => clearTimeout(t);
  }, [searchTerm, filterEstado, fetchCompras]);

  const proveedorNombre = (id: number | null) => proveedores.find(p => p.id_proveedor === id)?.nombre ?? '—';

  // Alerta: compras pendientes hace más de 7 días
  const comprasPendientesViejas = compras.filter(c => {
    if (c.estado !== 'pendiente') return false;
    const dias = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return dias > 7;
  });

  const closeForm = () => { setShowForm(false); setForm(emptyForm); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.concepto.trim() || !form.fecha) {
      showToast('Concepto y fecha son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createCompra({
        concepto: form.concepto.trim(),
        tipo: form.tipo || undefined,
        fecha: form.fecha,
        idProveedor: form.idProveedor ? parseInt(form.idProveedor) : undefined,
        factura: form.factura || undefined,
        observaciones: form.observaciones || undefined,
      } as any);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAprobar = async (id: number) => {
    const result = await aprobarCompra(id);
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDelete === null) return;
    const result = await removeCompra(confirmDelete);
    showToast(result.message, result.success ? 'warning' : 'error');
    setConfirmDelete(null);
  };

  const openDetalle = async (compra: Compra) => {
    const result = await getDetalleCompra(compra.id_compra);
    if (result.success && result.data) {
      setDetalleCompra(result.data);
    } else {
      showToast(result.message || 'Error al cargar detalle', 'error');
    }
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {confirmDelete !== null && (
        <ConfirmDialog
          title="¿Eliminar compra?"
          message="Esta acción no se puede deshacer. Solo se pueden eliminar compras pendientes."
          onConfirm={() => { void handleDeleteConfirmed(); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {detalleCompra && (
        <DetalleModal
          compra={detalleCompra}
          onClose={() => setDetalleCompra(null)}
          onAdded={(concepto, cantidad, valorUnitario) => addDetalle(detalleCompra.id_compra, { concepto, cantidad, valorUnitario })}
          onRemoved={(nroLinea) => removeDetalle(detalleCompra.id_compra, nroLinea)}
          showToast={showToast}
        />
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>➕ Nueva Compra</h3>
            <button onClick={closeForm} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {f('Concepto', <input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} style={inputStyle} required />, true)}
              {f('Fecha', <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inputStyle} required />, true)}
              {f('Proveedor', (
                <select value={form.idProveedor} onChange={e => setForm({ ...form, idProveedor: e.target.value })} style={inputStyle}>
                  <option value="">Sin proveedor</option>
                  {proveedores.filter(p => p.estado === 'activo').map(p => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                  ))}
                </select>
              ))}
              {f('N° Factura', <input value={form.factura} onChange={e => setForm({ ...form, factura: e.target.value })} style={inputStyle} />)}
            </div>
            {f('Observaciones', <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f3f4f6', marginTop: '16px' }}>
              <button type="button" onClick={closeForm} disabled={submitting} style={{ padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ padding: '11px 28px', borderRadius: '8px', border: 'none', backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? 'Guardando...' : 'Registrar Compra'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Compras</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{compras.length} compra{compras.length !== 1 ? 's' : ''} registrada{compras.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Nueva Compra
          </button>
        </div>

        {comprasPendientesViejas.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🔴</span>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>
              {comprasPendientesViejas.length} compra{comprasPendientesViejas.length !== 1 ? 's' : ''} lleva{comprasPendientesViejas.length === 1 ? '' : 'n'} más de 7 días sin aprobarse
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <input type="text" placeholder="Buscar por concepto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ ...inputStyle, width: '180px' }}>
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
          </select>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Fecha', 'Concepto', 'Proveedor', 'Factura', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando...</td></tr>
              ) : compras.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay compras registradas</td></tr>
              ) : compras.map(c => (
                <tr key={c.id_compra} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{formatDateShort(c.fecha)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{c.concepto}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{c.proveedor_nombre ?? proveedorNombre(c.id_proveedor)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{c.factura ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>{estadoBadge(c.estado)}</td>
                  <td style={{ padding: '14px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => { void openDetalle(c); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '12px', cursor: 'pointer' }}>Detalle</button>
                    {c.estado === 'pendiente' && (
                      <>
                        <button onClick={() => { void handleAprobar(c.id_compra); }} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '12px', cursor: 'pointer' }}>Aprobar</button>
                        <button onClick={() => setConfirmDelete(c.id_compra)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Eliminar</button>
                      </>
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
