import React, { useCallback, useEffect, useState } from 'react';
import { usePaginacion } from '../../hooks/usePaginacion';
import { Paginacion } from '../../components/ui/Paginacion';
import { useSocios } from '../../hooks/useSocios';
import { facturaService } from '../../services/facturaService';
import { formatCurrency, formatDateShort } from '../../utils/format';

// Facturación (RF-055 / RF-058): registrar, consultar, editar (sin pagos), anular y registrar pagos.

interface AdminFacturasProps { onNavigate?: (tab: string) => void; }

interface Factura {
  id_factura: number;
  nro_factura: string | null;
  fecha: string;
  fecha_vencimiento: string | null;
  concepto: string;
  id_socio: number | null;
  socio_nombre: string | null;
  proveedor_nombre: string | null;
  valor_total: string;
  monto_pagado: string;
  saldo: string;
  estado: 'Pendiente' | 'Emitida' | 'Pagada' | 'Anulada' | 'Vencida';
  observaciones: string | null;
}
interface Detalle { nro_linea: number; servicio: string; descripcion: string | null; cantidad: number; valor_unitario: string; descuento: string; iva: string; }
interface Pago { id_pago_factura: number; fecha: string; monto: string; metodo_pago: string; referencia: string | null; }
type FacturaDetalle = Factura & { detalles: Detalle[]; pagos: Pago[] };

const CLUB_GREEN = '#10b981';
const hoy = () => new Date().toISOString().split('T')[0];
const num = (v: string | number | null | undefined) => parseFloat(String(v ?? 0)) || 0;
const errorMsg = (err: any) => err.response?.data?.message || err.message || 'Error inesperado';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white',
};
const btn = (bg: string, color = 'white', border = 'none'): React.CSSProperties => ({
  padding: '10px 18px', borderRadius: '8px', border, backgroundColor: bg, color, fontSize: '14px', fontWeight: 600, cursor: 'pointer',
});

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      <div style={{ marginTop: '6px' }}>{children}</div>
    </label>
  );
}

function Modal({ children, onClose, ancho = 760 }: { children: React.ReactNode; onClose: () => void; ancho?: number }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: `${ancho}px`, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {children}
      </div>
    </div>
  );
}

function Cabecera({ titulo, onClose }: { titulo: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1f2937' }}>{titulo}</h3>
      <button onClick={onClose} aria-label="Cerrar" style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</button>
    </div>
  );
}

function estadoBadge(estado: string) {
  const map: Record<string, { bg: string; color: string }> = {
    Emitida: { bg: '#fef3c7', color: '#92400e' }, Pendiente: { bg: '#fef3c7', color: '#92400e' },
    Pagada: { bg: '#d1fae5', color: '#065f46' }, Anulada: { bg: '#f3f4f6', color: '#374151' }, Vencida: { bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[estado] ?? map.Emitida;
  return <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>{estado}</span>;
}

// ─── Formulario (crear / editar) ──────────────────────────────────────────────
interface LineaForm { servicio: string; descripcion: string; cantidad: string; valorUnitario: string; descuento: string; iva: string; }
const lineaVacia = (): LineaForm => ({ servicio: '', descripcion: '', cantidad: '1', valorUnitario: '', descuento: '0', iva: '0' });
const totalLinea = (l: LineaForm) => num(l.cantidad) * num(l.valorUnitario) - num(l.descuento) + num(l.iva);

function FormFactura({ inicial, onGuardado, onClose, toast }: {
  inicial: FacturaDetalle | null;
  onGuardado: () => void;
  onClose: () => void;
  toast: (m: string, ok: boolean) => void;
}) {
  const { socios } = useSocios();
  const [tercero, setTercero] = useState<'socio' | 'proveedor'>(inicial?.proveedor_nombre ? 'proveedor' : 'socio');
  const [cab, setCab] = useState({
    fecha: inicial?.fecha?.slice(0, 10) ?? hoy(),
    fechaVencimiento: inicial?.fecha_vencimiento?.slice(0, 10) ?? '',
    concepto: inicial?.concepto ?? '',
    idSocio: inicial?.id_socio ? String(inicial.id_socio) : '',
    proveedorNombre: inicial?.proveedor_nombre ?? '',
    nroFactura: inicial?.nro_factura ?? '',
    observaciones: inicial?.observaciones ?? '',
  });
  const [lineas, setLineas] = useState<LineaForm[]>(
    inicial?.detalles?.length
      ? inicial.detalles.map(d => ({ servicio: d.servicio, descripcion: d.descripcion ?? '', cantidad: String(d.cantidad), valorUnitario: String(num(d.valor_unitario)), descuento: String(num(d.descuento)), iva: String(num(d.iva)) }))
      : [lineaVacia()]
  );
  const [guardando, setGuardando] = useState(false);

  const setLinea = (i: number, campo: keyof LineaForm, valor: string) =>
    setLineas(prev => prev.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));
  const total = lineas.reduce((s, l) => s + totalLinea(l), 0);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      fecha: cab.fecha,
      fechaVencimiento: cab.fechaVencimiento || null,
      concepto: cab.concepto,
      idSocio: tercero === 'socio' && cab.idSocio ? Number(cab.idSocio) : null,
      proveedorNombre: tercero === 'proveedor' ? cab.proveedorNombre : null,
      nroFactura: cab.nroFactura || null,
      observaciones: cab.observaciones || null,
      detalles: lineas.map(l => ({ servicio: l.servicio, descripcion: l.descripcion, cantidad: Number(l.cantidad), valorUnitario: Number(l.valorUnitario), descuento: Number(l.descuento || 0), iva: Number(l.iva || 0) })),
    };
    setGuardando(true);
    try {
      const r = inicial ? await facturaService.update(inicial.id_factura, payload) : await facturaService.create(payload);
      toast(r.message, r.success);
      if (r.success) onGuardado();
    } catch (err) {
      toast(errorMsg(err), false);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={(e) => { void guardar(e); }}>
      <Cabecera titulo={inicial ? `Editar factura ${inicial.nro_factura ?? ''}` : 'Nueva factura'} onClose={onClose} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
        <Campo label="Fecha" required><input type="date" value={cab.fecha} onChange={e => setCab({ ...cab, fecha: e.target.value })} required style={inputStyle} /></Campo>
        <Campo label="Vencimiento"><input type="date" value={cab.fechaVencimiento} min={cab.fecha} onChange={e => setCab({ ...cab, fechaVencimiento: e.target.value })} style={inputStyle} /></Campo>
        <Campo label="N.º factura"><input value={cab.nroFactura} maxLength={50} placeholder="Automático si se deja vacío" onChange={e => setCab({ ...cab, nroFactura: e.target.value })} style={inputStyle} /></Campo>
      </div>
      <div style={{ display: 'grid', gap: '14px', marginBottom: '14px' }}>
        <Campo label="Concepto" required><input value={cab.concepto} maxLength={200} onChange={e => setCab({ ...cab, concepto: e.target.value })} required style={inputStyle} /></Campo>
        <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'flex', gap: '18px', fontSize: '14px' }}>
          <legend style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Asociada a <span style={{ color: '#ef4444' }}>*</span></legend>
          <label><input type="radio" checked={tercero === 'socio'} onChange={() => setTercero('socio')} /> Socio</label>
          <label><input type="radio" checked={tercero === 'proveedor'} onChange={() => setTercero('proveedor')} /> Proveedor</label>
        </fieldset>
        {tercero === 'socio' ? (
          <Campo label="Socio" required>
            <select value={cab.idSocio} onChange={e => setCab({ ...cab, idSocio: e.target.value })} required style={inputStyle}>
              <option value="">Seleccionar socio...</option>
              {socios.map(s => <option key={s.id_socio} value={s.id_socio}>{s.nombre} — {s.documento}</option>)}
            </select>
          </Campo>
        ) : (
          <Campo label="Proveedor" required><input value={cab.proveedorNombre} maxLength={150} onChange={e => setCab({ ...cab, proveedorNombre: e.target.value })} required style={inputStyle} /></Campo>
        )}
      </div>

      <h4 style={{ margin: '18px 0 8px', fontSize: '15px', color: '#1f2937' }}>Detalle <span style={{ color: '#ef4444' }}>*</span></h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
          <thead>
            <tr>{['Producto o servicio', 'Cant.', 'Valor unitario', 'Descuento', 'IVA', 'Total', ''].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '12px', color: '#6b7280', padding: '4px' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={i}>
                <td style={{ padding: '4px' }}><input aria-label={`Servicio línea ${i + 1}`} value={l.servicio} maxLength={200} required onChange={e => setLinea(i, 'servicio', e.target.value)} style={inputStyle} /></td>
                <td style={{ padding: '4px', width: '70px' }}><input aria-label={`Cantidad línea ${i + 1}`} type="number" min="1" step="1" value={l.cantidad} required onChange={e => setLinea(i, 'cantidad', e.target.value)} style={inputStyle} /></td>
                <td style={{ padding: '4px', width: '130px' }}><input aria-label={`Valor unitario línea ${i + 1}`} type="number" min="0.01" step="0.01" value={l.valorUnitario} required onChange={e => setLinea(i, 'valorUnitario', e.target.value)} style={inputStyle} /></td>
                <td style={{ padding: '4px', width: '110px' }}><input aria-label={`Descuento línea ${i + 1}`} type="number" min="0" step="0.01" value={l.descuento} onChange={e => setLinea(i, 'descuento', e.target.value)} style={inputStyle} /></td>
                <td style={{ padding: '4px', width: '100px' }}><input aria-label={`IVA línea ${i + 1}`} type="number" min="0" step="0.01" value={l.iva} onChange={e => setLinea(i, 'iva', e.target.value)} style={inputStyle} /></td>
                <td style={{ padding: '4px', fontSize: '14px', whiteSpace: 'nowrap' }}>{formatCurrency(totalLinea(l), 'COP')}</td>
                <td style={{ padding: '4px' }}>
                  <button type="button" aria-label={`Quitar línea ${i + 1}`} disabled={lineas.length === 1} onClick={() => setLineas(prev => prev.filter((_, j) => j !== i))} style={{ ...btn('white', '#dc2626', '1px solid #fecaca'), padding: '8px 10px', opacity: lineas.length === 1 ? 0.4 : 1 }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 14px' }}>
        <button type="button" onClick={() => setLineas(prev => [...prev, lineaVacia()])} style={btn('white', '#374151', '1.5px solid #e5e7eb')}>+ Agregar línea</button>
        <strong style={{ fontSize: '16px' }}>Total: {formatCurrency(total, 'COP')}</strong>
      </div>
      <Campo label="Observaciones"><textarea value={cab.observaciones} rows={2} onChange={e => setCab({ ...cab, observaciones: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Campo>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
        <button type="button" onClick={onClose} disabled={guardando} style={btn('white', '#374151', '1.5px solid #e5e7eb')}>Cancelar</button>
        <button type="submit" disabled={guardando} style={btn(guardando ? '#6ee7b7' : CLUB_GREEN)}>{guardando ? 'Guardando...' : 'Guardar factura'}</button>
      </div>
    </form>
  );
}

// ─── Detalle + pagos ──────────────────────────────────────────────────────────
function VerFactura({ factura, onCambio, onEditar, onClose, toast }: {
  factura: FacturaDetalle;
  onCambio: () => void;
  onEditar: () => void;
  onClose: () => void;
  toast: (m: string, ok: boolean) => void;
}) {
  const [pago, setPago] = useState({ monto: '', metodoPago: 'efectivo', fecha: hoy(), referencia: '' });
  const [enviando, setEnviando] = useState(false);
  const saldo = num(factura.saldo);
  const admitePagos = factura.estado !== 'Anulada' && factura.estado !== 'Pagada';
  const editable = factura.estado === 'Emitida' && num(factura.monto_pagado) === 0;

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (num(pago.monto) <= 0) { toast('El monto debe ser mayor a cero', false); return; }
    if (num(pago.monto) > saldo) { toast('El pago supera el saldo pendiente', false); return; }
    setEnviando(true);
    try {
      const r = await facturaService.registrarPago(factura.id_factura, { ...pago, monto: Number(pago.monto) });
      toast(r.message, r.success);
      if (r.success) { setPago({ ...pago, monto: '', referencia: '' }); onCambio(); }
    } catch (err) {
      toast(errorMsg(err), false);
    } finally {
      setEnviando(false);
    }
  };

  const anular = async () => {
    if (!window.confirm('¿Anular esta factura? Esta acción no se puede deshacer.')) return;
    try {
      const r = await facturaService.anular(factura.id_factura);
      toast(r.message, r.success);
      if (r.success) onCambio();
    } catch (err) {
      toast(errorMsg(err), false);
    }
  };

  const celda: React.CSSProperties = { padding: '8px', fontSize: '14px', borderBottom: '1px solid #f3f4f6' };

  return (
    <div>
      <Cabecera titulo={`Factura ${factura.nro_factura ?? `#${factura.id_factura}`}`} onClose={onClose} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '14px', marginBottom: '16px' }}>
        <div><strong>Fecha:</strong> {formatDateShort(factura.fecha)}</div>
        <div><strong>Vence:</strong> {factura.fecha_vencimiento ? formatDateShort(factura.fecha_vencimiento) : '—'}</div>
        <div><strong>{factura.proveedor_nombre ? 'Proveedor' : 'Socio'}:</strong> {factura.proveedor_nombre ?? factura.socio_nombre ?? '—'}</div>
        <div><strong>Estado:</strong> {estadoBadge(factura.estado)}</div>
        <div style={{ gridColumn: '1 / -1' }}><strong>Concepto:</strong> {factura.concepto}</div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['#', 'Producto o servicio', 'Cant.', 'Valor unit.', 'Desc.', 'IVA', 'Total'].map(h => <th key={h} style={{ ...celda, textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>{h}</th>)}</tr></thead>
          <tbody>
            {factura.detalles.map(d => (
              <tr key={d.nro_linea}>
                <td style={celda}>{d.nro_linea}</td>
                <td style={celda}>{d.servicio}{d.descripcion ? <div style={{ fontSize: '12px', color: '#6b7280' }}>{d.descripcion}</div> : null}</td>
                <td style={celda}>{d.cantidad}</td>
                <td style={celda}>{formatCurrency(num(d.valor_unitario), 'COP')}</td>
                <td style={celda}>{formatCurrency(num(d.descuento), 'COP')}</td>
                <td style={celda}>{formatCurrency(num(d.iva), 'COP')}</td>
                <td style={celda}>{formatCurrency(d.cantidad * num(d.valor_unitario) - num(d.descuento) + num(d.iva), 'COP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end', margin: '12px 0 20px', fontSize: '14px', flexWrap: 'wrap' }}>
        <span>Total: <strong>{formatCurrency(num(factura.valor_total), 'COP')}</strong></span>
        <span>Pagado: <strong style={{ color: '#059669' }}>{formatCurrency(num(factura.monto_pagado), 'COP')}</strong></span>
        <span>Saldo: <strong style={{ color: '#d97706' }}>{formatCurrency(saldo, 'COP')}</strong></span>
      </div>

      <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>Pagos</h4>
      {factura.pagos.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Sin pagos registrados</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <tbody>
            {factura.pagos.map(p => (
              <tr key={p.id_pago_factura}>
                <td style={celda}>{formatDateShort(p.fecha)}</td>
                <td style={celda}>{p.metodo_pago}</td>
                <td style={celda}>{p.referencia ?? '—'}</td>
                <td style={{ ...celda, textAlign: 'right' }}>{formatCurrency(num(p.monto), 'COP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {admitePagos && (
        <form onSubmit={(e) => { void registrar(e); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', alignItems: 'end', padding: '14px', borderRadius: '12px', backgroundColor: '#f9fafb' }}>
          <Campo label="Monto" required><input type="number" min="0.01" step="0.01" max={saldo} value={pago.monto} onChange={e => setPago({ ...pago, monto: e.target.value })} required style={inputStyle} /></Campo>
          <Campo label="Método">
            <select value={pago.metodoPago} onChange={e => setPago({ ...pago, metodoPago: e.target.value })} style={inputStyle}>
              <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option><option value="cheque">Cheque</option>
            </select>
          </Campo>
          <Campo label="Fecha"><input type="date" value={pago.fecha} onChange={e => setPago({ ...pago, fecha: e.target.value })} style={inputStyle} /></Campo>
          <Campo label="Referencia"><input value={pago.referencia} maxLength={100} onChange={e => setPago({ ...pago, referencia: e.target.value })} style={inputStyle} /></Campo>
          <button type="submit" disabled={enviando} style={btn(enviando ? '#6ee7b7' : CLUB_GREEN)}>{enviando ? '...' : 'Registrar pago'}</button>
        </form>
      )}

      {editable && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
          <button onClick={() => { void anular(); }} style={btn('white', '#dc2626', '1px solid #fecaca')}>Anular</button>
          <button onClick={onEditar} style={btn('white', '#374151', '1.5px solid #e5e7eb')}>Editar</button>
        </div>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export function AdminFacturas(_props: AdminFacturasProps) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [vista, setVista] = useState<{ modo: 'nueva' } | { modo: 'ver' | 'editar'; factura: FacturaDetalle } | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; ok: boolean } | null>(null);
  const pag = usePaginacion(facturas);

  const toast = useCallback((texto: string, ok: boolean) => {
    setAviso({ texto, ok });
    setTimeout(() => setAviso(null), 3500);
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await facturaService.getAll({ estado: estado || undefined, search: search || undefined });
      setFacturas(r.success ? r.data || [] : []);
    } catch (err) {
      toast(errorMsg(err), false);
    } finally {
      setLoading(false);
    }
  }, [estado, search, toast]);

  useEffect(() => {
    const t = setTimeout(() => { void cargar(); }, 400);
    return () => clearTimeout(t);
  }, [cargar]);

  const abrir = async (id: number, modo: 'ver' | 'editar' = 'ver') => {
    try {
      const r = await facturaService.getById(id);
      if (r.success) setVista({ modo, factura: r.data });
    } catch (err) {
      toast(errorMsg(err), false);
    }
  };

  const th: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' };
  const td: React.CSSProperties = { padding: '14px 16px', fontSize: '14px', color: '#374151' };

  return (
    <div className="app">
      {aviso && (
        <div role="status" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, padding: '14px 18px', borderRadius: '10px', backgroundColor: aviso.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${aviso.ok ? '#10b981' : '#ef4444'}`, borderLeft: `4px solid ${aviso.ok ? '#10b981' : '#ef4444'}`, fontSize: '14px', maxWidth: '360px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
          {aviso.texto}
        </div>
      )}

      {vista?.modo === 'nueva' && (
        <Modal onClose={() => setVista(null)}>
          <FormFactura inicial={null} toast={toast} onClose={() => setVista(null)} onGuardado={() => { setVista(null); void cargar(); }} />
        </Modal>
      )}
      {vista?.modo === 'editar' && (
        <Modal onClose={() => setVista(null)}>
          <FormFactura inicial={vista.factura} toast={toast} onClose={() => setVista(null)} onGuardado={() => { void abrir(vista.factura.id_factura); void cargar(); }} />
        </Modal>
      )}
      {vista?.modo === 'ver' && (
        <Modal onClose={() => setVista(null)}>
          <VerFactura factura={vista.factura} toast={toast} onClose={() => setVista(null)}
            onEditar={() => setVista({ modo: 'editar', factura: vista.factura })}
            onCambio={() => { void abrir(vista.factura.id_factura); void cargar(); }} />
        </Modal>
      )}

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1f2937' }}>Facturación</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{facturas.length} factura{facturas.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setVista({ modo: 'nueva' })} style={btn(CLUB_GREEN)}>+ Nueva factura</button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input type="search" aria-label="Buscar facturas" placeholder="Buscar por número, concepto, socio o proveedor..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '220px' }} />
          <select aria-label="Filtrar por estado" value={estado} onChange={e => setEstado(e.target.value)} style={{ ...inputStyle, width: '180px' }}>
            <option value="">Todos</option>
            <option value="Emitida">Emitida</option>
            <option value="Pagada">Pagada</option>
            <option value="Anulada">Anulada</option>
          </select>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['N.º', 'Fecha', 'Socio / proveedor', 'Concepto', 'Total', 'Saldo', 'Estado', ''].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Cargando...</td></tr>
              ) : facturas.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No hay facturas</td></tr>
              ) : pag.itemsPagina.map(fa => (
                <tr key={fa.id_factura} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ ...td, fontWeight: 600 }}>{fa.nro_factura ?? `#${fa.id_factura}`}</td>
                  <td style={td}>{formatDateShort(fa.fecha)}</td>
                  <td style={td}>{fa.proveedor_nombre ?? fa.socio_nombre ?? '—'}</td>
                  <td style={td}>{fa.concepto}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{formatCurrency(num(fa.valor_total), 'COP')}</td>
                  <td style={td}>{formatCurrency(num(fa.saldo), 'COP')}</td>
                  <td style={td}>{estadoBadge(fa.estado)}</td>
                  <td style={td}><button onClick={() => { void abrir(fa.id_factura); }} style={{ ...btn('white', '#374151', '1px solid #e5e7eb'), padding: '6px 12px', fontSize: '12px' }}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginacion {...pag} etiqueta="facturas" />
        </div>
      </div>
    </div>
  );
}
