// Panel "Usuarios" dentro de Configuración del Sistema.
import React, { useState } from 'react';
import { PasswordInput } from '../../../components/ui/password-input';
import { useUsers } from '../../../hooks/useUsers';
import { UserRole } from '../../../types';
import { CLUB_GREEN, ToastType, Modal, ConfirmDialog, inputStyle, f } from './shared';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

interface UsersPanelProps {
  showToast: (message: string, type?: ToastType) => void;
}

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

export function UsersPanel({ showToast }: UsersPanelProps) {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>Usuarios del Sistema</h3>
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
    </>
  );
}
