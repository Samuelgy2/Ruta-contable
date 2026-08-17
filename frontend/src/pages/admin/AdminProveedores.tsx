import React, { useState, useEffect, useCallback } from 'react';
import { useProveedores, Proveedor } from '../../hooks/useProveedores';

interface AdminProveedoresProps {
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
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: c.bg, border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${c.border}`, borderRadius: '10px',
            padding: '14px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: '280px', maxWidth: '360px', animation: 'slideIn 0.25s ease',
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
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      animation: 'fadeOverlay 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'white', borderRadius: '20px', padding: '32px', width: '100%',
        maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {children}
      </div>
      <style>{`
        @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.93) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
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

const emptyForm = {
  nombre: '', nit: '', telefono: '', email: '', direccion: '', observaciones: '',
};
type FormState = typeof emptyForm;

export function AdminProveedores({ onNavigate }: AdminProveedoresProps) {
  const { proveedores, loading, fetchProveedores, createProveedor, updateProveedor, removeProveedor } = useProveedores();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; action: 'delete' | 'toggle'; nextEstado?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, show: showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => fetchProveedores(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm, fetchProveedores]);

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

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Proveedor) => {
    setForm({
      nombre: p.nombre, nit: p.nit ?? '', telefono: p.telefono ?? '',
      email: p.email ?? '', direccion: p.direccion ?? '', observaciones: p.observaciones ?? '',
    });
    setEditingId(p.id_proveedor);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      showToast('El nombre del proveedor es obligatorio', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = editingId !== null
        ? await updateProveedor(editingId, form)
        : await createProveedor(form);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmed = async () => {
    if (!confirmTarget) return;
    const { id, action, nextEstado } = confirmTarget;
    setConfirmTarget(null);
    if (action === 'delete') {
      const result = await removeProveedor(id);
      showToast(result.message, result.success ? 'warning' : 'error');
    } else {
      const result = await updateProveedor(id, { estado: nextEstado as any });
      showToast(result.message, result.success ? 'success' : 'error');
    }
  };

  const estadoBadge = (estado: string): JSX.Element => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      activo:   { bg: '#d1fae5', color: '#065f46', label: 'Activo' },
      inactivo: { bg: '#f3f4f6', color: '#374151', label: 'Inactivo' },
    };
    const s = map[estado] ?? map['activo'];
    return (
      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {confirmTarget && (
        <ConfirmDialog
          title={confirmTarget.action === 'delete' ? '¿Eliminar proveedor?' : `¿${confirmTarget.nextEstado === 'activo' ? 'Activar' : 'Desactivar'} proveedor?`}
          message="Esta acción no se puede deshacer. Si tiene compras pendientes asociadas, el sistema la rechazará."
          onConfirm={() => { void handleConfirmed(); }}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {editingId !== null ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'}
            </h3>
            <button onClick={closeForm} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {f('Nombre', <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Distribuidora XYZ" style={inputStyle} required />, true)}
              {f('NIT', <input value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} placeholder="900123456-7" style={inputStyle} />)}
              {f('Teléfono', <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="3001234567" style={inputStyle} />)}
              {f('Email', <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contacto@proveedor.com" style={inputStyle} />)}
            </div>
            {f('Dirección', <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Calle 45 #32-10" style={inputStyle} />)}
            <div style={{ marginTop: '16px' }}>
              {f('Observaciones', <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />)}
            </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Proveedores</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''} registrado{proveedores.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate} style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Nuevo Proveedor
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text" placeholder="Buscar por nombre o NIT..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '360px', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nombre', 'NIT', 'Teléfono', 'Email', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando...</td></tr>
              ) : proveedores.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay proveedores registrados</td></tr>
              ) : proveedores.map(p => (
                <tr key={p.id_proveedor} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{p.nombre}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.nit ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.telefono ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{p.email ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>{estadoBadge(p.estado)}</td>
                  <td style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(p)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '12px', cursor: 'pointer' }}>Editar</button>
                    <button
                      onClick={() => setConfirmTarget({ id: p.id_proveedor, action: 'toggle', nextEstado: p.estado === 'activo' ? 'inactivo' : 'activo' })}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: p.estado === 'activo' ? '#dc2626' : '#059669', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {p.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => setConfirmTarget({ id: p.id_proveedor, action: 'delete' })} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Eliminar</button>
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
