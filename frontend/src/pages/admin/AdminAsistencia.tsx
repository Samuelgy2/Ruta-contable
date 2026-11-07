import React, { useState, useEffect, useCallback } from 'react';
import { usePaginacion } from '../../hooks/usePaginacion';
import { Paginacion } from '../../components/ui/Paginacion';
import { useAsistencia, AsistenciaItem } from '../../hooks/useAsistencia';
import { useSocios } from '../../hooks/useSocios';
import { asistenciaService } from '../../services/asistenciaService';
import { clubDataService } from '../../services/clubDataService';
import { formatDateShort } from '../../utils/format';
import type { ChecklistPayload } from '../../hooks/useAsistencia';
import { API_URL } from '../../services/apiConfig';

interface AdminAsistenciaProps {
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

function estadoBadge(estado: string): JSX.Element {
  const map: Record<string, { bg: string; color: string }> = {
    Presente:    { bg: '#d1fae5', color: '#065f46' },
    Ausente:     { bg: '#fee2e2', color: '#991b1b' },
    Justificado: { bg: '#dbeafe', color: '#1e40af' },
    Tarde:       { bg: '#fef3c7', color: '#92400e' },
  };
  const s = map[estado] ?? map['Presente'];
  return <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>{estado}</span>;
}

// Fecha de hoy en la zona del navegador (toISOString daría la de UTC).
function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const emptyForm = {
  idSocio: '', fecha: hoyLocal(),
  tipoEntrenamiento: '', estado: 'Presente' as AsistenciaItem['estado'], observacion: '',
};
type FormState = typeof emptyForm;

function getToken(): string {
  return localStorage.getItem('clubfinance_token') ?? '';
}

export function AdminAsistencia({ onNavigate }: AdminAsistenciaProps) {
  const { asistencia, alertas, loading, fetchAsistencia, fetchAlertas, createAsistencia, updateAsistencia, removeAsistencia, saveChecklist } = useAsistencia();
  const { socios } = useSocios();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Lista del día: un estado por socio activo ('' = no registrar).
  const [showChecklist, setShowChecklist] = useState(false);
  const [checkFecha, setCheckFecha] = useState(hoyLocal());
  const [checkTipo, setCheckTipo] = useState('');
  const [checkEstados, setCheckEstados] = useState<Record<number, string>>({});
  const { toasts, show: showToast } = useToast();

  // ── Umbrales de alerta (RF-084 RN-003), guardados en system_data ────────────
  const [umbrales, setUmbrales] = useState<{ consecutiva: string; acumulada: string } | null>(null);
  const abrirUmbrales = async () => {
    try {
      const r = await clubDataService.get();
      setUmbrales({
        consecutiva: String(r.data?.umbral_inasistencia_consecutiva ?? 3),
        acumulada:   String(r.data?.umbral_inasistencia_acumulada ?? 5),
      });
    } catch {
      showToast('No se pudieron cargar los umbrales', 'error');
    }
  };
  const guardarUmbrales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!umbrales) return;
    setSubmitting(true);
    try {
      const r = await clubDataService.update({
        umbralInasistenciaConsecutiva: Number(umbrales.consecutiva),
        umbralInasistenciaAcumulada:   Number(umbrales.acumulada),
      });
      showToast(r.success ? 'Umbrales de alerta actualizados' : r.message, r.success ? 'success' : 'error');
      if (r.success) { setUmbrales(null); await fetchAlertas(); }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al guardar los umbrales', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchAsistencia({
      estado: filterEstado === 'all' ? undefined : filterEstado,
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    }), 400);
    return () => clearTimeout(t);
  }, [filterEstado, fechaInicio, fechaFin, fetchAsistencia]);

  const filtered = asistencia.filter(a => (a.socio_nombre ?? '').toLowerCase().includes(searchTerm.toLowerCase()));
  const pagAsistencia = usePaginacion(filtered);

  const sociosActivos = socios.filter(s => s.estado === 'activo');
  const editingSocioNombre = editingId !== null
    ? (asistencia.find(a => a.id_asistencia === editingId)?.socio_nombre ?? '—')
    : '';

  const openChecklist = () => {
    const inicial: Record<number, string> = {};
    sociosActivos.forEach(s => { inicial[s.id_socio] = 'Presente'; });
    setCheckEstados(inicial);
    setCheckFecha(hoyLocal());
    setCheckTipo('');
    setShowChecklist(true);
  };

  const marcarTodos = (estado: string) => {
    const todos: Record<number, string> = {};
    sociosActivos.forEach(s => { todos[s.id_socio] = estado; });
    setCheckEstados(todos);
  };

  const handleChecklistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const registros = Object.entries(checkEstados)
      .filter(([, estado]) => estado !== '')
      .map(([id, estado]) => ({ idSocio: Number(id), estado: estado as AsistenciaItem['estado'] }));
    if (!checkFecha || registros.length === 0) {
      showToast('Elige la fecha y al menos un socio', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload: ChecklistPayload = { fecha: checkFecha, tipoEntrenamiento: checkTipo || undefined, registros };
      const result = await saveChecklist(payload);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) setShowChecklist(false);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (a: AsistenciaItem) => {
    setForm({
      idSocio: String(a.id_socio), fecha: a.fecha.split('T')[0],
      tipoEntrenamiento: a.tipo_entrenamiento ?? '', estado: a.estado, observacion: a.observacion ?? '',
    });
    setEditingId(a.id_asistencia);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.idSocio || !form.fecha) {
      showToast('Socio y fecha son obligatorios', 'error');
      return;
    }
    setSubmitting(true);
    try {
      // Al editar no se envía el socio: el registro conserva el suyo.
      const payload = {
        ...(editingId === null ? { idSocio: parseInt(form.idSocio) } : {}),
        fecha: form.fecha,
        tipoEntrenamiento: form.tipoEntrenamiento || undefined,
        estado: form.estado, observacion: form.observacion || undefined,
      };
      const result = editingId !== null ? await updateAsistencia(editingId, payload as any) : await createAsistencia(payload as any);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDelete === null) return;
    const result = await removeAsistencia(confirmDelete);
    showToast(result.message, result.success ? 'warning' : 'error');
    setConfirmDelete(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const path = asistenciaService.exportarExcelUrl({ fechaInicio: fechaInicio || undefined, fechaFin: fechaFin || undefined });
      const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('No se pudo generar el archivo');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // El nombre lo pone el backend con el periodo (Asistencia_AAAA-MM-DD_AAAA-MM-DD.xlsx).
      a.download = res.headers.get('Content-Disposition')?.match(/filename=([^;]+)/)?.[1] ?? 'Asistencia.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Reporte exportado correctamente', 'success');
    } catch {
      showToast('Error al exportar asistencia', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      {confirmDelete !== null && (
        <ConfirmDialog title="¿Eliminar registro?" message="Esta acción no se puede deshacer." onConfirm={() => { void handleDeleteConfirmed(); }} onCancel={() => setConfirmDelete(null)} />
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{editingId !== null ? '✏️ Editar Asistencia' : '➕ Registrar Asistencia'}</h3>
            <button onClick={closeForm} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <form onSubmit={(e) => { void handleSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {editingId !== null ? f('Socio', (
                <input value={editingSocioNombre} readOnly disabled title="El socio de un registro no se puede cambiar" style={{ ...inputStyle, backgroundColor: '#f3f4f6', color: '#6b7280' }} />
              )) : f('Socio', (
                <select value={form.idSocio} onChange={e => setForm({ ...form, idSocio: e.target.value })} style={inputStyle} required>
                  <option value="">Seleccionar socio...</option>
                  {sociosActivos.map(s => (
                    <option key={s.id_socio} value={s.id_socio}>{s.nombre} — {s.documento}</option>
                  ))}
                </select>
              ), true)}
              {f('Fecha', <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inputStyle} required />, true)}
              {f('Tipo de Entrenamiento', <input value={form.tipoEntrenamiento} onChange={e => setForm({ ...form, tipoEntrenamiento: e.target.value })} style={inputStyle} placeholder="Físico, técnico..." />)}
              {f('Estado', (
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as FormState['estado'] })} style={inputStyle}>
                  <option value="Presente">Presente</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Justificado">Justificado</option>
                  <option value="Tarde">Tarde</option>
                </select>
              ))}
            </div>
            {f('Observación', <textarea value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f3f4f6', marginTop: '16px' }}>
              <button type="button" onClick={closeForm} disabled={submitting} style={{ padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ padding: '11px 28px', borderRadius: '8px', border: 'none', backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {umbrales && (
        <Modal onClose={() => setUmbrales(null)}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>⚙ Umbrales de alerta de inasistencia</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>
            Se marca un socio cuando alcanza cualquiera de los dos umbrales en los últimos 30 días.
          </p>
          <form onSubmit={(e) => { void guardarUmbrales(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {f('Inasistencias consecutivas', (
                <input type="number" min={1} max={30} step={1} value={umbrales.consecutiva} onChange={e => setUmbrales({ ...umbrales, consecutiva: e.target.value })} style={inputStyle} required />
              ), true)}
              {f('Inasistencias acumuladas', (
                <input type="number" min={1} max={30} step={1} value={umbrales.acumulada} onChange={e => setUmbrales({ ...umbrales, acumulada: e.target.value })} style={inputStyle} required />
              ), true)}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setUmbrales(null)} disabled={submitting} style={{ padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showChecklist && (
        <Modal onClose={() => setShowChecklist(false)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>📋 Lista del día</h3>
            <button onClick={() => setShowChecklist(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
          </div>
          <form onSubmit={(e) => { void handleChecklistSubmit(e); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {f('Fecha', <input type="date" value={checkFecha} onChange={e => setCheckFecha(e.target.value)} style={inputStyle} required />, true)}
              {f('Tipo de Entrenamiento', <input value={checkTipo} onChange={e => setCheckTipo(e.target.value)} style={inputStyle} placeholder="Físico, técnico..." />)}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '12px' }}>
              <button type="button" onClick={() => marcarTodos('Presente')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer' }}>Todos presentes</button>
              <button type="button" onClick={() => marcarTodos('')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer' }}>Ninguno</button>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#6b7280' }}>Si un socio ya tiene registro en esa fecha, se actualiza su estado.</p>
            <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
              {sociosActivos.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No hay socios activos</div>
              ) : sociosActivos.map(s => (
                <div key={s.id_socio} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '14px', color: '#1f2937' }}>{s.nombre}</span>
                  <select value={checkEstados[s.id_socio] ?? ''} onChange={e => setCheckEstados({ ...checkEstados, [s.id_socio]: e.target.value })} style={{ ...inputStyle, width: '150px', padding: '6px 10px' }}>
                    <option value="">No registrar</option>
                    <option value="Presente">Presente</option>
                    <option value="Ausente">Ausente</option>
                    <option value="Justificado">Justificado</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f3f4f6', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowChecklist(false)} disabled={submitting} style={{ padding: '11px 24px', borderRadius: '8px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{ padding: '11px 28px', borderRadius: '8px', border: 'none', backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? 'Guardando...' : 'Guardar lista'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Asistencia</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{asistencia.length} registro{asistencia.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { void handleExport(); }} disabled={exporting} style={{ padding: '11px 18px', borderRadius: '10px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: exporting ? 'default' : 'pointer' }}>
              {exporting ? 'Exportando...' : '⬇ Exportar Excel'}
            </button>
            <button onClick={() => { void abrirUmbrales(); }} style={{ padding: '11px 18px', borderRadius: '10px', border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              ⚙ Umbrales de alerta
            </button>
            <button onClick={openChecklist} style={{ padding: '11px 18px', borderRadius: '10px', border: `1.5px solid ${CLUB_GREEN}`, backgroundColor: 'white', color: CLUB_GREEN, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              📋 Lista del día
            </button>
            <button onClick={openCreate} style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', backgroundColor: CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              + Registrar Asistencia
            </button>
          </div>
        </div>

        {/* Panel de alertas */}
        {alertas.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #fecaca', marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔴</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>
                {alertas.length} socio{alertas.length !== 1 ? 's' : ''} con alerta de inasistencia
              </span>
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {alertas.map(al => (
                <div key={al.idSocio} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #f9fafb', fontSize: '13px' }}>
                  <span style={{ color: '#1f2937', fontWeight: '500' }}>{al.socioNombre}</span>
                  <span style={{ color: '#6b7280' }}>
                    {al.motivo === 'consecutiva'
                      ? `${al.inasistenciasConsecutivas} inasistencias consecutivas`
                      : `${al.inasistenciasAcumuladas} inasistencias acumuladas`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar por socio..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '200px' }} />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ ...inputStyle, width: '160px' }}>
            <option value="all">Todos los estados</option>
            <option value="Presente">Presente</option>
            <option value="Ausente">Ausente</option>
            <option value="Justificado">Justificado</option>
            <option value="Tarde">Tarde</option>
          </select>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Fecha', 'Socio', 'Tipo Entrenamiento', 'Estado', 'Observación', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay registros de asistencia</td></tr>
              ) : pagAsistencia.itemsPagina.map(a => (
                <tr key={a.id_asistencia} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{formatDateShort(a.fecha)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{a.socio_nombre ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{a.tipo_entrenamiento ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>{estadoBadge(a.estado)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{a.observacion ?? '—'}</td>
                  <td style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(a)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontSize: '12px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => setConfirmDelete(a.id_asistencia)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginacion {...pagAsistencia} etiqueta="registros" />
        </div>
      </div>
    </div>
  );
}
