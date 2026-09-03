import React, { useState, useEffect, useCallback } from 'react';
import { useSocios } from '../../hooks/useSocios';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Socio {
  id_socio: number;
  nombre: string;
  documento: string;
  tipo_documento: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string;
  fecha_ingreso: string;
  tipo_membresia: string;
  nivel_aprendizaje: string | null;
  estado: 'activo' | 'inactivo' | 'suspendido';
  foto: string | null;
  observaciones: string | null;
}

interface AdminMembersProps {
  onNavigate?: (tab: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CLUB_GREEN = '#10b981';

// ─── Helper Token ─────────────────────────────────────────────────────────────
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
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'fadeOverlay 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: '20px',
          padding: '32px', width: '100%', maxWidth: '680px',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px',
        padding: '28px 32px', width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1f2937', fontSize: '17px' }}>¿Eliminar socio?</h3>
        <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db',
              backgroundColor: 'white', color: '#374151', fontSize: '14px',
              fontWeight: '500', cursor: 'pointer',
            }}
          >Cancelar</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: 'none',
              backgroundColor: '#ef4444', color: 'white', fontSize: '14px',
              fontWeight: '500', cursor: 'pointer',
            }}
          >Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Formulario vacío ─────────────────────────────────────────────────────────
const emptyForm = {
  nombre:           '',
  documento:        '',
  tipo_documento:   'CC' as 'CC' | 'TI' | 'CE' | 'PAS',
  email:            '',
  telefono:         '',
  direccion:        '',
  fecha_nacimiento: '',
  fecha_ingreso:    new Date().toISOString().split('T')[0],
  tipo_membresia:   'Media' as 'Media' | 'Completa' | 'Beca',
  nivel_aprendizaje: '' as '' | 'Iniciación' | 'Rider School' | 'Club',
  estado:           'activo' as 'activo' | 'inactivo' | 'suspendido',
  observaciones:    '',
};

type FormState = typeof emptyForm;

// ─── Componente principal ─────────────────────────────────────────────────────
export function AdminMembers({ onNavigate }: AdminMembersProps) {
  const { socios, loading, error, fetchSocios, createSocio, updateSocio, deleteSocio } = useSocios();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { toasts, show: showToast } = useToast();

  // Búsqueda con debounce 400ms
  useEffect(() => {
    const t = setTimeout(() => fetchSocios(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm, fetchSocios]);

  // ── Formulario ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (socio: Socio) => {
    setForm({
      nombre:           socio.nombre,
      documento:        socio.documento,
      tipo_documento:   (socio.tipo_documento as FormState['tipo_documento']) ?? 'CC',
      email:            socio.email ?? '',
      telefono:         socio.telefono ?? '',
      direccion:        socio.direccion ?? '',
      fecha_nacimiento: socio.fecha_nacimiento ? socio.fecha_nacimiento.split('T')[0] : '',
      fecha_ingreso:    socio.fecha_ingreso ? socio.fecha_ingreso.split('T')[0] : '',
      tipo_membresia:   (socio.tipo_membresia as FormState['tipo_membresia']) ?? 'Media',
      nivel_aprendizaje: (socio.nivel_aprendizaje as FormState['nivel_aprendizaje']) ?? '',
      estado:           socio.estado ?? 'activo',
      observaciones:    socio.observaciones ?? '',
    });
    setEditingId(socio.id_socio);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const f = <T extends React.ReactNode>(label: string, children: T, required = false): JSX.Element => (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white',
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.nombre || !form.documento || !form.fecha_ingreso) {
      showToast('Nombre, documento y fecha de ingreso son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, nivel_aprendizaje: form.nivel_aprendizaje || null };
      if (editingId !== null) {
        const result = await updateSocio(editingId, payload);
        showToast(result.message, result.success ? 'success' : 'error');
      } else {
        const result = await createSocio(payload);
        showToast(result.message, result.success ? 'success' : 'error');
      }
      closeForm();
      void fetchSocios(searchTerm);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar socio';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    if (confirmDelete === null) return;
    try {
      const result = await deleteSocio(confirmDelete);
      showToast(result.message, result.success ? 'warning' : 'error');
      setConfirmDelete(null);
      void fetchSocios(searchTerm);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar socio';
      showToast(msg, 'error');
      setConfirmDelete(null);
    }
  };

  // ── Badge estado ───────────────────────────────────────────────────────────
  const estadoBadge = (estado: string): JSX.Element => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      activo:     { bg: '#d1fae5', color: '#065f46', label: 'Activo' },
      inactivo:   { bg: '#f3f4f6', color: '#374151', label: 'Inactivo' },
      suspendido: { bg: '#fee2e2', color: '#991b1b', label: 'Suspendido' },
    };
    const s = map[estado] ?? map['activo'];
    return (
      <span style={{
        padding: '4px 12px', borderRadius: '9999px',
        fontSize: '12px', fontWeight: '600',
        backgroundColor: s.bg, color: s.color,
      }}>
        {s.label}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {confirmDelete !== null && (
        <ConfirmDialog
          message="Esta acción no se puede deshacer."
          onConfirm={() => { void handleDeleteConfirmed(); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {editingId !== null ? '✏️ Editar Socio' : '➕ Nuevo Socio'}
            </h3>
            <button
              onClick={closeForm}
              style={{
                background: '#f3f4f6', border: 'none', borderRadius: '8px',
                width: '34px', height: '34px', cursor: 'pointer',
                fontSize: '18px', color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>

              {f('Nombre Completo',
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]/g, '') })}
                  placeholder="Juan Pérez"
                  style={inputStyle}
                  required
                />, true
              )}

              {f('Tipo de Documento',
                <select
                  value={form.tipo_documento}
                  onChange={e => setForm({ ...form, tipo_documento: e.target.value as FormState['tipo_documento'] })}
                  style={inputStyle}
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PAS">Pasaporte</option>
                </select>, true
              )}

              {f('Número de Documento',
                <input
                  value={form.documento}
                  onChange={e => setForm({ ...form, documento: e.target.value.replace(/\D/g, '') })}
                  inputMode="numeric"
                  style={inputStyle}
                  required
                />, true
              )}

              {f('Email',
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@email.com"
                  style={inputStyle}
                />
              )}

              {f('Teléfono',
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '') })}
                  inputMode="numeric"
                  style={inputStyle}
                />
              )}

              {f('Dirección',
                <input
                  value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Calle 45 #32-10"
                  style={inputStyle}
                />
              )}

              {f('Fecha de Nacimiento',
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}
                  style={inputStyle}
                />
              )}

              {f('Fecha de Ingreso',
                <input
                  type="date"
                  value={form.fecha_ingreso}
                  onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })}
                  style={inputStyle}
                  required
                />, true
              )}

              {f('Tipo de Membresía',
                <select
                  value={form.tipo_membresia}
                  onChange={e => setForm({ ...form, tipo_membresia: e.target.value as FormState['tipo_membresia'] })}
                  style={inputStyle}
                >
                  <option value="Media">Media</option>
                  <option value="Completa">Completa</option>
                  <option value="Beca">Beca</option>
                </select>
              )}

              {f('Nivel de Aprendizaje',
                <select
                  value={form.nivel_aprendizaje}
                  onChange={e => setForm({ ...form, nivel_aprendizaje: e.target.value as FormState['nivel_aprendizaje'] })}
                  style={inputStyle}
                >
                  <option value="">Sin asignar</option>
                  <option value="Iniciación">Iniciación</option>
                  <option value="Rider School">Rider School</option>
                  <option value="Club">Club</option>
                </select>
              )}

              {f('Estado',
                <select
                  value={form.estado}
                  onChange={e => setForm({ ...form, estado: e.target.value as FormState['estado'] })}
                  style={inputStyle}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              )}
            </div>

            {f('Observaciones',
              <textarea
                value={form.observaciones}
                onChange={e => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            )}

            <div style={{
              display: 'flex', gap: '12px', justifyContent: 'flex-end',
              paddingTop: '16px', borderTop: '1px solid #f3f4f6', marginTop: '16px',
            }}>
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                style={{
                  padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                  backgroundColor: 'white', color: '#374151', fontSize: '14px',
                  fontWeight: '500', cursor: 'pointer',
                }}
              >Cancelar</button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '11px 28px', borderRadius: '8px', border: 'none',
                  backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN,
                  color: 'white', fontSize: '14px', fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                }}
              >
                {submitting ? 'Guardando...' : editingId !== null ? 'Actualizar' : 'Crear Socio'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="container">
        {/* Header */}
        <div style={{
          marginBottom: '28px', display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: '4px', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
              Gestión de Socios
            </h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
              {error ? `Error: ${error}` : loading ? 'Cargando...' : `${socios.length} socios registrados en el sistema`}
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              backgroundColor: CLUB_GREEN, color: 'white', border: 'none',
              padding: '12px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Nuevo Socio
          </button>
        </div>

        {/* Buscador */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <span style={{
              position: 'absolute', left: '14px', top: '50%',
              transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, email o documento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 40px',
                border: '1.5px solid #e5e7eb', borderRadius: '10px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Tabla */}
        <div style={{
          backgroundColor: 'white', borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {['Documento', 'Nombre', 'Email', 'Teléfono', 'Membresía', 'Nivel', 'Estado', ''].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: i === 7 ? 'right' : 'left',
                      padding: '14px 16px', color: '#6b7280',
                      fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap',
                    }}
                  >{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                    <div style={{ fontSize: '24px' }}>⏳</div>
                    <p style={{ margin: '8px 0 0', fontSize: '14px' }}>Cargando socios...</p>
                  </td>
                </tr>
              ) : socios.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '15px' }}>
                    No hay socios que mostrar
                  </td>
                </tr>
              ) : (
                socios.map(socio => (
                  <tr
                    key={socio.id_socio}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fafafa'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af' }}>
                        {socio.tipo_documento}
                      </span>{' '}
                      <span style={{ color: '#374151' }}>{socio.documento}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                      {socio.nombre}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '14px' }}>
                      {socio.email || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '14px' }}>
                      {socio.telefono || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px',
                        backgroundColor: '#eff6ff', color: '#1d4ed8',
                        fontWeight: '500', fontSize: '13px',
                      }}>
                        {socio.tipo_membresia || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px',
                        backgroundColor: '#f5f3ff', color: '#6d28d9',
                        fontWeight: '500', fontSize: '13px',
                      }}>
                        {socio.nivel_aprendizaje || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {estadoBadge(socio.estado)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => openEdit(socio)}
                        title="Editar"
                        style={{
                          backgroundColor: '#f3f4f6', border: 'none', padding: '8px 10px',
                          borderRadius: '8px', cursor: 'pointer', marginRight: '8px', fontSize: '15px',
                        }}
                      >✏️</button>
                      <button
                        onClick={() => setConfirmDelete(socio.id_socio)}
                        title="Eliminar"
                        style={{
                          backgroundColor: '#fee2e2', border: 'none', padding: '8px 10px',
                          borderRadius: '8px', cursor: 'pointer', fontSize: '15px',
                        }}
                      >🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}