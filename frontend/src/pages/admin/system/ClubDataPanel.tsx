// Panel "Datos del Club" dentro de Configuración del Sistema.
import React, { useState, useEffect } from 'react';
import { useClubData } from '../../../hooks/useClubData';
import { CLUB_GREEN, ToastType, inputStyle, f } from './shared';

interface ClubDataPanelProps {
  showToast: (message: string, type?: ToastType) => void;
}

const emptyForm = {
  clubNombre: '', nit: '', direccion: '', telefono: '', email: '',
  moneda: 'COP', diaVencimientoDefault: '15', porcentajeMora: '',
};
type FormState = typeof emptyForm;

export function ClubDataPanel({ showToast }: ClubDataPanelProps) {
  const { clubData, loading, updateClubData } = useClubData();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

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
    <>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>Datos del Club</h3>
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
    </>
  );
}
