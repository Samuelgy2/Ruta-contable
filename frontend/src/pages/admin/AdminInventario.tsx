import React, { useState, useEffect, useCallback } from 'react';
import { useInventario, Producto } from '../../hooks/useInventario';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminInventarioProps {
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
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
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
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1f2937', fontSize: '17px' }}>{title}</h3>
        <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Eliminar</button>
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

const emptyForm = { name: '', price: '', description: '', categoriaId: '', stock: '0' };
type FormState = typeof emptyForm;

export function AdminInventario({ onNavigate }: AdminInventarioProps) {
  const {
    productos, categorias, jerseys, loading,
    fetchProductos, fetchJerseys, createProducto, updateProducto, removeProducto, createCategoria,
  } = useInventario();
  const [tab, setTab] = useState<'productos' | 'indumentaria'>('productos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, show: showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => fetchProductos(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm, fetchProductos]);

  useEffect(() => {
    if (tab === 'indumentaria') void fetchJerseys();
  }, [tab, fetchJerseys]);

  const stockBajo = productos.filter(p => p.stock <= 5);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Producto) => {
    setForm({
      name: p.name, price: p.price, description: p.description ?? '',
      categoriaId: p.categoria_id ? String(p.categoria_id) : '', stock: String(p.stock),
    });
    setEditingId(p.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      showToast('Nombre y precio son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(), price: parseFloat(form.price), description: form.description || undefined,
        categoriaId: form.categoriaId ? parseInt(form.categoriaId) : undefined, stock: parseInt(form.stock) || 0,
      };
      const result = editingId !== null ? await updateProducto(editingId, payload as any) : await createProducto(payload as any);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDelete === null) return;
    const result = await removeProducto(confirmDelete);
    showToast(result.message, result.success ? 'warning' : 'error');
    setConfirmDelete(null);
  };

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    const result = await createCategoria(nuevaCategoria.trim());
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) { setNuevaCategoria(''); setShowCategoriaForm(false); }
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {confirmDelete !== null && (
        <ConfirmDialog title="¿Eliminar producto?" message="Esta acción no se puede deshacer." onConfirm={() => { void handleDeleteConfirmed(); }} onCancel={() => setConfirmDelete(null)} />
      )}

      {showCategoriaForm && (
        <Modal onClose={() => setShowCategoriaForm(false)}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>Nueva Categoría de Producto</h3>
          <form onSubmit={(e) => { void handleCreateCategoria(e); }}>
            {f('Nombre', <input value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} style={inputStyle} placeholder="Ej: Indumentaria" required />, true)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowCategoriaForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{editingId !== null ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h3>
            <button onClick={closeForm} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {f('Nombre', <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} required />, true)}
              {f('Precio', <input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} required />, true)}
              {f('Categoría', (
                <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })} style={inputStyle}>
                  <option value="">Sin categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              ))}
              {f('Stock', <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inputStyle} />)}
            </div>
            {f('Descripción', <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f3f4f6', marginTop: '16px' }}>
              <button type="button" onClick={closeForm} disabled={submitting} style={{ padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ padding: '11px 28px', borderRadius: '8px', border: 'none', backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Inventario</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{productos.length} producto{productos.length !== 1 ? 's' : ''} en catálogo</p>
          </div>
          {tab === 'productos' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCategoriaForm(true)} style={{ padding: '11px 18px', borderRadius: '10px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Categoría</button>
              <button onClick={openCreate} style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>+ Nuevo Producto</button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
          {(['productos', 'indumentaria'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: tab === t ? '700' : '500',
                color: tab === t ? CLUB_GREEN : '#6b7280',
                borderBottom: tab === t ? `2px solid ${CLUB_GREEN}` : '2px solid transparent',
              }}
            >
              {t === 'productos' ? 'Productos' : 'Indumentaria (consulta)'}
            </button>
          ))}
        </div>

        {tab === 'productos' && (
          <>
            {stockBajo.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '20px' }}>
                <span style={{ fontSize: '18px' }}>🟡</span>
                <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
                  {stockBajo.length} producto{stockBajo.length !== 1 ? 's' : ''} con stock bajo (≤ 5 unidades)
                </span>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, maxWidth: '360px' }} />
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Producto', 'Categoría', 'Precio', 'Stock', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando...</td></tr>
                  ) : productos.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay productos registrados</td></tr>
                  ) : productos.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{p.name}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.categoria_nombre ?? '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{formatCurrency(parseFloat(p.price), 'COP')}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: p.stock <= 5 ? '#fef3c7' : '#f3f4f6', color: p.stock <= 5 ? '#92400e' : '#374151' }}>
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEdit(p)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '12px', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => setConfirmDelete(p.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'indumentaria' && (
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Fecha', 'Socio', 'Tipo', 'Talla', 'Estado Pedido', 'Estado Entrega'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jerseys.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay pedidos de indumentaria</td></tr>
                ) : jerseys.map(j => (
                  <tr key={j.id_pedido} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{formatDateShort(j.fecha)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{j.socio_nombre ?? '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{j.tipo}{j.talla ? ` (${j.talla})` : ''}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{j.talla ?? '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{j.estado}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{j.estado_entrega ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#9ca3af' }}>
              La gestión completa de pedidos de indumentaria vive en la página "Jersey" — aquí solo se consulta el estado real.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
