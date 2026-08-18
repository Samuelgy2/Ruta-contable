import React, { useState, useEffect, useCallback } from 'react';
import { useCategories, Category } from '../../hooks/useCategories';

interface AdminCategoriesProps {
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

const emptyForm = { name: '', type: 'income' as 'income' | 'expense', description: '', active: true };
type FormState = typeof emptyForm;

export function AdminCategories({ onNavigate }: AdminCategoriesProps) {
  const { categories, loading, fetchCategories, createCategory, updateCategory, removeCategory } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, show: showToast } = useToast();

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const inactivas = categories.filter(c => !c.active);

  const openCreate = (type: 'income' | 'expense') => { setEditingId(null); setForm({ ...emptyForm, type }); setShowForm(true); };
  const openEdit = (c: Category) => {
    setForm({ name: c.name, type: c.type, description: c.description ?? '', active: c.active });
    setEditingId(c.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('El nombre de la categoría es obligatorio', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = editingId !== null
        ? await updateCategory(editingId, form)
        : await createCategory(form);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDelete === null) return;
    const result = await removeCategory(confirmDelete);
    showToast(result.message, result.success ? 'warning' : 'error');
    setConfirmDelete(null);
  };

  const renderCategoryList = (list: Category[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {list.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px', fontSize: '13px' }}>Sin categorías</p>
      ) : list.map(c => (
        <div key={c.id} style={{
          padding: '12px 14px', borderRadius: '10px', border: '1px solid #e5e7eb',
          backgroundColor: c.active ? 'white' : '#f9fafb', opacity: c.active ? 1 : 0.65,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <strong style={{ fontSize: '14px', color: '#1f2937' }}>{c.name}</strong>
            {c.description && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{c.description}</p>}
            {!c.active && (
              <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#374151' }}>Inactiva</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => openEdit(c)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '12px', cursor: 'pointer' }}>Editar</button>
            <button onClick={() => setConfirmDelete(c.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {confirmDelete !== null && (
        <ConfirmDialog
          title="¿Eliminar categoría?"
          message="Esta acción no se puede deshacer. Si tiene transacciones asociadas, el sistema la rechazará."
          onConfirm={() => { void handleDeleteConfirmed(); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {editingId !== null ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
            </h3>
            <button onClick={closeForm} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {f('Nombre', <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} required />, true)}
              {f('Tipo', (
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as FormState['type'] })} style={inputStyle}>
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              ), true)}
            </div>
            {f('Descripción', <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />)}
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', fontWeight: '600' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                Categoría activa
              </label>
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
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Categorías</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{categories.length} categoría{categories.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {expenseCategories.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🔴</span>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>No hay categorías de gasto configuradas — las transacciones de egreso no podrán clasificarse</span>
          </div>
        )}
        {inactivas.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🟡</span>
            <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>{inactivas.length} categoría{inactivas.length !== 1 ? 's' : ''} inactiva{inactivas.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>Categorías de Ingresos</h4>
              <button onClick={() => openCreate('income')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Nueva</button>
            </div>
            {loading ? <p style={{ color: '#9ca3af', fontSize: '13px' }}>Cargando...</p> : renderCategoryList(incomeCategories)}
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>Categorías de Gastos</h4>
              <button onClick={() => openCreate('expense')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Nueva</button>
            </div>
            {loading ? <p style={{ color: '#9ca3af', fontSize: '13px' }}>Cargando...</p> : renderCategoryList(expenseCategories)}
          </div>
        </div>
      </div>
    </div>
  );
}
