import React, { useCallback, useEffect, useState } from 'react';
import { socioService } from '../../services/socioService';
import { formatDateShort } from '../../utils/format';

// Documentos del socio (RF-050): listar, subir (PDF/JPG/PNG, máx. 5 MB), descargar y eliminar.

interface Documento {
  id_documento: number;
  tipo_documento: string;
  nombre_archivo: string;
  mime: string;
  bytes: number;
  created_at: string;
}

const TIPOS_SUGERIDOS = ['Documento de identidad', 'Certificado médico', 'Póliza de salud', 'Autorización de acudiente', 'Otro'];
const MAX_BYTES = 5 * 1024 * 1024;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white',
};

const errorMsg = (err: any) => err.response?.data?.message || err.message || 'Error inesperado';

export function SocioDocumentos({ idSocio, nombre, onToast, onClose }: {
  idSocio: number;
  nombre: string;
  onToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState(TIPOS_SUGERIDOS[0]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await socioService.getDocumentos(idSocio);
      setDocs(r.success ? r.data || [] : []);
    } catch (err) {
      onToast(errorMsg(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [idSocio, onToast]);

  useEffect(() => { void cargar(); }, [cargar]);

  const subir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo.trim()) { onToast('El tipo de documento es obligatorio', 'error'); return; }
    if (!archivo) { onToast('Selecciona un archivo', 'error'); return; }
    if (archivo.size > MAX_BYTES) { onToast('El archivo supera el máximo de 5 MB', 'error'); return; }
    setSubiendo(true);
    try {
      const r = await socioService.subirDocumento(idSocio, archivo, tipo.trim());
      onToast(r.message, r.success ? 'success' : 'error');
      if (r.success) { setArchivo(null); (e.target as HTMLFormElement).reset(); await cargar(); }
    } catch (err) {
      onToast(errorMsg(err), 'error');
    } finally {
      setSubiendo(false);
    }
  };

  const descargar = async (d: Documento) => {
    try {
      const url = URL.createObjectURL(await socioService.descargarDocumento(idSocio, d.id_documento));
      const a = document.createElement('a');
      a.href = url;
      a.download = d.nombre_archivo;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      onToast(errorMsg(err), 'error');
    }
  };

  const eliminar = async (d: Documento) => {
    if (!window.confirm(`¿Eliminar "${d.nombre_archivo}"? Esta acción no se puede deshacer.`)) return;
    try {
      const r = await socioService.eliminarDocumento(idSocio, d.id_documento);
      onToast(r.message, r.success ? 'success' : 'error');
      if (r.success) await cargar();
    } catch (err) {
      onToast(errorMsg(err), 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Documentos de {nombre}</h3>
        <button onClick={onClose} aria-label="Cerrar" style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
      </div>

      <form onSubmit={(e) => { void subir(e); }} style={{ display: 'grid', gap: '12px', marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: '#f9fafb' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          Tipo de documento <span style={{ color: '#ef4444' }}>*</span>
          <input list="tipos-doc-socio" value={tipo} onChange={e => setTipo(e.target.value)} maxLength={60} required style={{ ...inputStyle, marginTop: '6px' }} />
          <datalist id="tipos-doc-socio">{TIPOS_SUGERIDOS.map(t => <option key={t} value={t} />)}</datalist>
        </label>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          Archivo (PDF, JPG o PNG, máx. 5 MB) <span style={{ color: '#ef4444' }}>*</span>
          <input type="file" accept="application/pdf,image/jpeg,image/png" required onChange={e => setArchivo(e.target.files?.[0] ?? null)} style={{ ...inputStyle, marginTop: '6px' }} />
        </label>
        <button type="submit" disabled={subiendo} style={{ justifySelf: 'end', padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: subiendo ? '#6ee7b7' : '#10b981', color: 'white', fontWeight: 600, cursor: subiendo ? 'default' : 'pointer' }}>
          {subiendo ? 'Subiendo...' : 'Subir documento'}
        </button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            {['Tipo', 'Archivo', 'Tamaño', 'Fecha', ''].map(h => <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>Cargando...</td></tr>
          ) : docs.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>Este socio no tiene documentos</td></tr>
          ) : docs.map(d => (
            <tr key={d.id_documento} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 8px', fontSize: '14px' }}>{d.tipo_documento}</td>
              <td style={{ padding: '10px 8px', fontSize: '14px', color: '#6b7280', wordBreak: 'break-all' }}>{d.nombre_archivo}</td>
              <td style={{ padding: '10px 8px', fontSize: '13px', color: '#6b7280' }}>{(d.bytes / 1024).toFixed(0)} KB</td>
              <td style={{ padding: '10px 8px', fontSize: '13px', color: '#6b7280' }}>{formatDateShort(d.created_at)}</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button onClick={() => { void descargar(d); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: '12px', cursor: 'pointer', marginRight: '6px' }}>Descargar</button>
                <button onClick={() => { void eliminar(d); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
