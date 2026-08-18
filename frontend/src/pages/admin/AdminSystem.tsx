import React, { useState, useCallback, useEffect } from 'react';
import { PasswordInput } from '../../components/ui/password-input';
import { useUsers } from '../../hooks/useUsers';
import { UserRole } from '../../types';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

interface AdminSystemProps {
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

function estadoBadge(active: boolean): JSX.Element {
  return active
    ? <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: '#d1fae5', color: '#065f46' }}>Activo</span>
    : <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b' }}>Inactivo</span>;
}

function rolBadge(role: UserRole): JSX.Element {
  return role === 'admin'
    ? <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e' }}>Administrador</span>
    : <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1e40af' }}>Usuario</span>;
}

const emptyForm = { username: '', password: '', fullName: '', email: '', role: 'user' as UserRole, active: true };
type FormState = typeof emptyForm;

export function AdminSystem({ onNavigate }: AdminSystemProps) {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, show: showToast } = useToast();

  const visibleUsers = users.filter((u: any) => u.username !== 'admin');
  const inactivos = visibleUsers.filter((u: any) => !u.active);
  const admins = visibleUsers.filter((u: any) => u.role === 'admin');

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (user: User) => {
    setForm({ username: user.username, password: '', fullName: user.fullName, email: user.email, role: user.role, active: user.active });
    setEditingId(user.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.username || (!editingId && !form.password) || !form.fullName || !form.email) {
      showToast('Usuario, nombre completo, email y contraseña son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = editingId !== null
        ? await updateUser(editingId, form)
        : await createUser(form);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDelete === null) return;
    const result = await deleteUser(confirmDelete);
    showToast(result.message, result.success ? 'warning' : 'error');
    setConfirmDelete(null);
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {confirmDelete !== null && (
        <ConfirmDialog title="¿Eliminar usuario?" message="Esta acción no se puede deshacer." onConfirm={() => { void handleDeleteConfirmed(); }} onCancel={() => setConfirmDelete(null)} />
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {editingId !== null ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
            </h3>
            <button onClick={closeForm} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {f('Usuario', <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} required />, true)}
              {f(editingId !== null ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña', (
                <PasswordInput value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} required={editingId === null} />
              ), editingId === null)}
              {f('Nombre Completo', <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} style={inputStyle} required />, true)}
              {f('Email', <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} required />, true)}
              {f('Rol', (
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })} style={inputStyle}>
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              ))}
              {f('Estado', (
                <select value={form.active ? 'true' : 'false'} onChange={e => setForm({ ...form, active: e.target.value === 'true' })} style={inputStyle}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              ))}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Gestión de Usuarios del Sistema</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{error ? `Error: ${error}` : `${visibleUsers.length} usuario${visibleUsers.length !== 1 ? 's' : ''} registrado${visibleUsers.length !== 1 ? 's' : ''}`}</p>
          </div>
          <button onClick={openCreate} style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Nuevo Usuario
          </button>
        </div>

        {admins.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🔴</span>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>No hay otro administrador además de la cuenta principal — si perdés acceso, nadie más puede gestionar el sistema</span>
          </div>
        )}
        {inactivos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🟡</span>
            <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>{inactivos.length} usuario{inactivos.length !== 1 ? 's' : ''} inactivo{inactivos.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Usuario', 'Nombre Completo', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando...</td></tr>
              ) : visibleUsers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay usuarios registrados</td></tr>
              ) : visibleUsers.map((user: User) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{user.username}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{user.fullName}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{user.email}</td>
                  <td style={{ padding: '14px 16px' }}>{rolBadge(user.role)}</td>
                  <td style={{ padding: '14px 16px' }}>{estadoBadge(user.active)}</td>
                  <td style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(user)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '12px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => setConfirmDelete(user.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Eliminar</button>
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
