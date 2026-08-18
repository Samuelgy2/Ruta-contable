import React, { useState, useEffect, useCallback } from 'react';
import { useClubData } from '../../hooks/useClubData';

interface AdminClubDataProps {
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
  clubNombre: '', nit: '', direccion: '', telefono: '', email: '',
  moneda: 'COP', diaVencimientoDefault: '15', porcentajeMora: '',
};
type FormState = typeof emptyForm;

export function AdminClubData({ onNavigate }: AdminClubDataProps) {
  const { clubData, loading, updateClubData } = useClubData();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, show: showToast } = useToast();

  useEffect(() => {
    if (clubData) {
      setForm({
        clubNombre: clubData.club_nombre ?? '',
        nit: clubData.nit ?? '',
        direccion: clubData.direccion ?? '',
        telefono: clubData.telefono ?? '',
        email: clubData.email ?? '',
        moneda: clubData.moneda ?? 'COP',
        diaVencimientoDefault: clubData.dia_vencimiento_default ? String(clubData.dia_vencimiento_default) : '15',
        porcentajeMora: clubData.porcentaje_mora ?? '',
      });
    }
  }, [clubData]);

  const camposFaltantes = clubData && (!clubData.nit || !clubData.direccion || !clubData.telefono || !clubData.email);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.clubNombre.trim()) {
      showToast('El nombre del club es obligatorio', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateClubData({
        clubNombre: form.clubNombre.trim(),
        nit: form.nit || undefined,
        direccion: form.direccion || undefined,
        telefono: form.telefono || undefined,
        email: form.email || undefined,
        moneda: form.moneda,
        diaVencimientoDefault: form.diaVencimientoDefault ? (parseInt(form.diaVencimientoDefault) as any) : undefined,
        porcentajeMora: form.porcentajeMora ? (form.porcentajeMora as any) : undefined,
      } as any);
      showToast(result.message, result.success ? 'success' : 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      <div className="container">
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Datos del Club</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Configura la información general de tu club</p>
        </div>

        {camposFaltantes && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px' }}>🟡</span>
            <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>Faltan datos de contacto del club (NIT, dirección, teléfono o email)</span>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '24px', maxWidth: '760px' }}>
          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>Cargando...</p>
          ) : (
            <form onSubmit={(e) => { void handleSubmit(e); }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                {f('Nombre del Club', <input value={form.clubNombre} onChange={e => setForm({ ...form, clubNombre: e.target.value })} style={inputStyle} required />, true)}
                {f('NIT / ID Fiscal', <input value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} style={inputStyle} />)}
                <div style={{ gridColumn: '1 / -1' }}>
                  {f('Dirección', <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} style={inputStyle} />)}
                </div>
                {f('Teléfono', <input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={inputStyle} />)}
                {f('Email', <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />)}
                {f('Moneda', (
                  <select value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })} style={inputStyle}>
                    <option value="COP">Peso Colombiano (COP)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                ))}
                {f('Día de vencimiento por defecto', <input type="number" min="1" max="28" value={form.diaVencimientoDefault} onChange={e => setForm({ ...form, diaVencimientoDefault: e.target.value })} style={inputStyle} />)}
                {f('% Mora', <input type="number" min="0" step="0.01" value={form.porcentajeMora} onChange={e => setForm({ ...form, porcentajeMora: e.target.value })} style={inputStyle} />)}
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                <button type="submit" disabled={submitting} style={{ padding: '11px 28px', borderRadius: '8px', border: 'none', backgroundColor: submitting ? '#6ee7b7' : CLUB_GREEN, color: 'white', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'default' : 'pointer' }}>
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
