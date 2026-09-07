import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePaginacion } from '../../hooks/usePaginacion';
import { Paginacion } from '../../components/ui/Paginacion';
import { useSocios } from '../../hooks/useSocios';
import {
  jerseyService, JerseyCampana, JerseyPedido, JerseyEstado, JERSEY_ESTADOS,
} from '../../services/jerseyService';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminJerseyProps {
  onNavigate?: (tab: string) => void;
}

const TALLAS_DEFECTO = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const TIPOS = ['Jersey', 'Short', 'Medias', 'Chaqueta'] as const;

const campanaVacia = {
  titulo: '',
  descripcion: '',
  valor: '',
  tallas: TALLAS_DEFECTO.join(', '),
  fechaFin: '',
};

const pedidoVacio = {
  idSocio: '',
  idCampana: '',
  fecha: new Date().toISOString().split('T')[0],
  tipo: 'Jersey' as (typeof TIPOS)[number],
  talla: '',
  estampado: '',
  cantidad: '1',
  valor: '',
  estado: 'Solicitado' as JerseyEstado,
  fechaEntrega: '',
  observaciones: '',
};

function mensajeDeError(err: unknown, porDefecto: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || porDefecto;
}

export function AdminJersey({ onNavigate }: AdminJerseyProps) {
  const { socios } = useSocios();

  // ── Campañas ───────────────────────────────────────────────────────────────
  const [campanas, setCampanas] = useState<JerseyCampana[]>([]);
  const [loadingCampanas, setLoadingCampanas] = useState(true);
  const [showCampanaForm, setShowCampanaForm] = useState(false);
  const [campanaForm, setCampanaForm] = useState(campanaVacia);
  const [campanaError, setCampanaError] = useState('');
  const [guardandoCampana, setGuardandoCampana] = useState(false);

  // ── Pedidos ────────────────────────────────────────────────────────────────
  const [pedidos, setPedidos] = useState<JerseyPedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterCampana, setFilterCampana] = useState('all');
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [pedidoForm, setPedidoForm] = useState(pedidoVacio);
  const [pedidoError, setPedidoError] = useState('');
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [pedidoBusy, setPedidoBusy] = useState<number | null>(null);
  const [filaError, setFilaError] = useState<Record<number, string>>({});

  const [aviso, setAviso] = useState('');

  const mostrarAviso = (texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso(''), 3500);
  };

  const cargarCampanas = useCallback(async () => {
    setLoadingCampanas(true);
    try {
      const r = await jerseyService.getCampanas();
      setCampanas(r?.success ? (r.data as JerseyCampana[]) : []);
    } catch {
      setCampanas([]);
    } finally {
      setLoadingCampanas(false);
    }
  }, []);

  const cargarPedidos = useCallback(async () => {
    setLoadingPedidos(true);
    try {
      const r = await jerseyService.getPedidos({
        campana: filterCampana === 'all' ? undefined : filterCampana,
        estado:  filterEstado === 'all' ? undefined : filterEstado,
        search:  searchTerm || undefined,
      });
      setPedidos(r?.success ? (r.data as JerseyPedido[]) : []);
    } catch {
      setPedidos([]);
    } finally {
      setLoadingPedidos(false);
    }
  }, [filterCampana, filterEstado, searchTerm]);

  useEffect(() => { void cargarCampanas(); }, [cargarCampanas]);

  // Búsqueda con debounce; los filtros de campaña y estado recargan de inmediato.
  useEffect(() => {
    const t = setTimeout(() => { void cargarPedidos(); }, 350);
    return () => clearTimeout(t);
  }, [cargarPedidos]);

  const pagPedidos = usePaginacion(pedidos);

  const campanasActivas = useMemo(() => campanas.filter(c => c.activa), [campanas]);
  const sociosActivos = useMemo(() => socios.filter(s => s.estado === 'activo'), [socios]);

  // Tallas disponibles en el formulario manual: las de la campaña elegida o las por defecto.
  const tallasPedido = useMemo(() => {
    const c = campanas.find(x => String(x.id) === pedidoForm.idCampana);
    return c?.tallas ?? TALLAS_DEFECTO;
  }, [campanas, pedidoForm.idCampana]);

  // ── Acciones: campañas ─────────────────────────────────────────────────────
  const handleCrearCampana = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampanaError('');

    const valorNum = parseFloat(campanaForm.valor);
    const tallas = campanaForm.tallas.split(',').map(t => t.trim()).filter(Boolean);

    if (!campanaForm.titulo.trim()) return setCampanaError('El título es obligatorio');
    if (isNaN(valorNum) || valorNum <= 0) return setCampanaError('El valor debe ser mayor a cero');
    if (tallas.length === 0) return setCampanaError('Indica al menos una talla (separadas por coma)');

    setGuardandoCampana(true);
    try {
      const r = await jerseyService.createCampana({
        titulo: campanaForm.titulo.trim(),
        descripcion: campanaForm.descripcion.trim() || undefined,
        valor: valorNum,
        tallas,
        fechaFin: campanaForm.fechaFin || null,
      });
      if (r?.success) {
        mostrarAviso('Campaña creada. Los socios ya la ven en su portal.');
        setCampanaForm(campanaVacia);
        setShowCampanaForm(false);
        await cargarCampanas();
      } else {
        setCampanaError(r?.message || 'No se pudo crear la campaña');
      }
    } catch (err) {
      setCampanaError(mensajeDeError(err, 'No se pudo crear la campaña'));
    } finally {
      setGuardandoCampana(false);
    }
  };

  const handleCerrarCampana = async (campana: JerseyCampana) => {
    if (!window.confirm(`¿Cerrar la campaña "${campana.titulo}"? Los socios dejarán de poder pedir.`)) return;
    try {
      const r = await jerseyService.updateCampana(campana.id, { activa: false });
      if (r?.success) {
        mostrarAviso('Campaña cerrada');
        await cargarCampanas();
      }
    } catch (err) {
      mostrarAviso(mensajeDeError(err, 'No se pudo cerrar la campaña'));
    }
  };

  const handleReabrirCampana = async (campana: JerseyCampana) => {
    try {
      const r = await jerseyService.updateCampana(campana.id, { activa: true });
      if (r?.success) {
        mostrarAviso('Campaña reabierta');
        await cargarCampanas();
      }
    } catch (err) {
      mostrarAviso(mensajeDeError(err, 'No se pudo reabrir la campaña'));
    }
  };

  // ── Acciones: pedidos ──────────────────────────────────────────────────────
  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setPedidoError('');

    const cantidad = parseInt(pedidoForm.cantidad, 10);
    if (!pedidoForm.idSocio) return setPedidoError('Selecciona un socio');
    if (isNaN(cantidad) || cantidad < 1) return setPedidoError('La cantidad debe ser al menos 1');
    if (!pedidoForm.idCampana && (!pedidoForm.valor || parseFloat(pedidoForm.valor) <= 0)) {
      return setPedidoError('Sin campaña, el valor es obligatorio');
    }
    if (pedidoForm.estampado.length > 60) return setPedidoError('El estampado no puede superar 60 caracteres');

    setGuardandoPedido(true);
    try {
      const r = await jerseyService.createPedido({
        idSocio: parseInt(pedidoForm.idSocio, 10),
        idCampana: pedidoForm.idCampana ? parseInt(pedidoForm.idCampana, 10) : null,
        fecha: pedidoForm.fecha,
        tipo: pedidoForm.tipo,
        talla: pedidoForm.talla || undefined,
        estampado: pedidoForm.estampado.trim() || undefined,
        cantidad,
        valor: pedidoForm.idCampana ? undefined : parseFloat(pedidoForm.valor),
        estado: pedidoForm.estado,
        fechaEntrega: pedidoForm.fechaEntrega || undefined,
        observaciones: pedidoForm.observaciones.trim() || undefined,
      });
      if (r?.success) {
        mostrarAviso('Pedido registrado correctamente');
        setPedidoForm(pedidoVacio);
        setShowPedidoForm(false);
        await Promise.all([cargarPedidos(), cargarCampanas()]);
      } else {
        setPedidoError(r?.message || 'No se pudo registrar el pedido');
      }
    } catch (err) {
      setPedidoError(mensajeDeError(err, 'No se pudo registrar el pedido'));
    } finally {
      setGuardandoPedido(false);
    }
  };

  const handleCambiarEstado = async (pedido: JerseyPedido, estado: JerseyEstado) => {
    if (estado === pedido.estado) return;
    setPedidoBusy(pedido.id);
    setFilaError(prev => ({ ...prev, [pedido.id]: '' }));
    try {
      const r = await jerseyService.updatePedido(pedido.id, { estado });
      if (r?.success) {
        setPedidos(prev => prev.map(p => (p.id === pedido.id ? (r.data as JerseyPedido) : p)));
      } else {
        setFilaError(prev => ({ ...prev, [pedido.id]: r?.message || 'No se pudo cambiar el estado' }));
      }
    } catch (err) {
      setFilaError(prev => ({ ...prev, [pedido.id]: mensajeDeError(err, 'No se pudo cambiar el estado') }));
    } finally {
      setPedidoBusy(null);
    }
  };

  const handleEliminarPedido = async (pedido: JerseyPedido) => {
    if (!window.confirm(`¿Eliminar el pedido de ${pedido.socioNombre ?? 'este socio'}?`)) return;
    setPedidoBusy(pedido.id);
    try {
      const r = await jerseyService.deletePedido(pedido.id);
      if (r?.success) {
        mostrarAviso('Pedido eliminado');
        await Promise.all([cargarPedidos(), cargarCampanas()]);
      }
    } catch (err) {
      setFilaError(prev => ({ ...prev, [pedido.id]: mensajeDeError(err, 'No se pudo eliminar el pedido') }));
    } finally {
      setPedidoBusy(null);
    }
  };

  // ── Helpers de presentación ────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const baseClass = 'badge ';
    switch (status) {
      case 'Solicitado':    return baseClass + 'badge-info';
      case 'En producción': return baseClass + 'badge-warning';
      case 'Listo':         return baseClass + 'badge-primary';
      case 'Entregado':     return baseClass + 'badge-success';
      case 'Cancelado':     return baseClass + 'badge-secondary';
      default:              return baseClass + 'badge-secondary';
    }
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const estadoCampana = (c: JerseyCampana) => {
    if (!c.activa) return { label: 'Cerrada', bg: '#f3f4f6', color: '#374151' };
    if (c.fechaFin && c.fechaFin.slice(0, 10) < hoy) return { label: 'Vencida', bg: '#fef3c7', color: '#92400e' };
    return { label: 'Activa', bg: '#d1fae5', color: '#065f46' };
  };

  const totalPendiente = pedidos
    .filter(o => ['Solicitado', 'En producción'].includes(o.estado))
    .reduce((sum, o) => sum + o.valor, 0);
  const totalEntregado = pedidos
    .filter(o => o.estado === 'Entregado')
    .reduce((sum, o) => sum + o.valor, 0);

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '4px', fontWeight: '500' };

  return (
    <div className="app">
      <div className="container">
        {aviso && (
          <div className="card" style={{ marginBottom: '16px', borderLeft: '4px solid #10b981', backgroundColor: '#f0fdf4', padding: '12px 16px' }}>
            {aviso}
          </div>
        )}

        {/* ── Campañas ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Campañas de Jersey</h3>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
              Crear una campaña la publica en el portal de los socios como "Nuevo jersey disponible".
            </p>
          </div>
          <button
            onClick={() => { setShowCampanaForm(!showCampanaForm); setCampanaError(''); }}
            className="btn btn-primary"
          >
            {showCampanaForm ? 'Cancelar' : '+ Nueva campaña'}
          </button>
        </div>

        {showCampanaForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>Nueva campaña</h4>
            <form onSubmit={(e) => { void handleCrearCampana(e); }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Título *</label>
                  <input
                    type="text"
                    value={campanaForm.titulo}
                    onChange={(e) => setCampanaForm({ ...campanaForm, titulo: e.target.value })}
                    className="input"
                    placeholder="Jersey oficial 2026"
                    maxLength={120}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Valor unitario *</label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={campanaForm.valor}
                    onChange={(e) => setCampanaForm({ ...campanaForm, valor: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tallas (separadas por coma)</label>
                  <input
                    type="text"
                    value={campanaForm.tallas}
                    onChange={(e) => setCampanaForm({ ...campanaForm, tallas: e.target.value })}
                    className="input"
                    placeholder="XS, S, M, L, XL, XXL"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fecha límite (opcional)</label>
                  <input
                    type="date"
                    value={campanaForm.fechaFin}
                    onChange={(e) => setCampanaForm({ ...campanaForm, fechaFin: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  value={campanaForm.descripcion}
                  onChange={(e) => setCampanaForm({ ...campanaForm, descripcion: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Modelo, tela, fecha estimada de entrega..."
                />
              </div>
              {campanaError && <div className="form-error-box" style={{ marginBottom: '12px' }}>{campanaError}</div>}
              <button type="submit" className="btn btn-primary" disabled={guardandoCampana}>
                {guardandoCampana ? 'Guardando...' : 'Crear campaña'}
              </button>
            </form>
          </div>
        )}

        <div className="table-container" style={{ marginBottom: '32px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Valor</th>
                <th>Tallas</th>
                <th>Inicio</th>
                <th>Límite</th>
                <th>Pedidos</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loadingCampanas ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>Cargando campañas...</td></tr>
              ) : campanas.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>Todavía no hay campañas</td></tr>
              ) : (
                campanas.map(c => {
                  const est = estadoCampana(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.titulo}</strong>
                        {c.descripcion && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{c.descripcion}</div>
                        )}
                      </td>
                      <td>{formatCurrency(c.valor, 'COP')}</td>
                      <td style={{ fontSize: '13px' }}>{c.tallas.join(', ')}</td>
                      <td>{formatDateShort(c.fechaInicio)}</td>
                      <td>{c.fechaFin ? formatDateShort(c.fechaFin) : '—'}</td>
                      <td>{c.totalPedidos ?? 0}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px', borderRadius: '9999px', fontSize: '12px',
                          fontWeight: '600', backgroundColor: est.bg, color: est.color,
                        }}>
                          {est.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {c.activa ? (
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { void handleCerrarCampana(c); }}>
                            Cerrar campaña
                          </button>
                        ) : (
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { void handleReabrirCampana(c); }}>
                            Reabrir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pedidos ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Pedidos</h3>
          <button
            onClick={() => { setShowPedidoForm(!showPedidoForm); setPedidoError(''); }}
            className="btn btn-primary"
          >
            {showPedidoForm ? 'Cancelar' : '+ Nuevo pedido manual'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Pedidos pendientes</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(totalPendiente, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Entregados</div>
            <div className="stat-value" style={{ color: 'green' }}>{formatCurrency(totalEntregado, 'COP')}</div>
          </div>
        </div>

        {showPedidoForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>Registrar pedido de indumentaria</h4>
            <form onSubmit={(e) => { void handleCrearPedido(e); }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Socio *</label>
                  <select
                    value={pedidoForm.idSocio}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, idSocio: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Seleccionar socio...</option>
                    {sociosActivos.map(s => (
                      <option key={s.id_socio} value={s.id_socio}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Campaña</label>
                  <select
                    value={pedidoForm.idCampana}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, idCampana: e.target.value, talla: '' })}
                    className="input"
                  >
                    <option value="">Sin campaña (valor manual)</option>
                    {campanasActivas.map(c => (
                      <option key={c.id} value={c.id}>{c.titulo} · {formatCurrency(c.valor, 'COP')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input
                    type="date"
                    value={pedidoForm.fecha}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, fecha: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select
                    value={pedidoForm.tipo}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, tipo: e.target.value as (typeof TIPOS)[number] })}
                    className="input"
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Talla</label>
                  <select
                    value={pedidoForm.talla}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, talla: e.target.value })}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    {tallasPedido.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cantidad *</label>
                  <input
                    type="number"
                    min={1}
                    value={pedidoForm.cantidad}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, cantidad: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Estampado (nombre y número)</label>
                  <input
                    type="text"
                    value={pedidoForm.estampado}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, estampado: e.target.value })}
                    className="input"
                    placeholder="PÉREZ 10"
                    maxLength={60}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{pedidoForm.idCampana ? 'Valor (lo fija la campaña)' : 'Valor *'}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={pedidoForm.valor}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, valor: e.target.value })}
                    className="input"
                    disabled={!!pedidoForm.idCampana}
                    required={!pedidoForm.idCampana}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select
                    value={pedidoForm.estado}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, estado: e.target.value as JerseyEstado })}
                    className="input"
                  >
                    {JERSEY_ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fecha entrega</label>
                  <input
                    type="date"
                    value={pedidoForm.fechaEntrega}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, fechaEntrega: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Observaciones</label>
                <textarea
                  value={pedidoForm.observaciones}
                  onChange={(e) => setPedidoForm({ ...pedidoForm, observaciones: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              {pedidoError && <div className="form-error-box" style={{ marginBottom: '12px' }}>{pedidoError}</div>}
              <button type="submit" className="btn btn-primary" disabled={guardandoPedido}>
                {guardandoPedido ? 'Guardando...' : 'Guardar pedido'}
              </button>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por socio, documento o estampado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select
            value={filterCampana}
            onChange={(e) => setFilterCampana(e.target.value)}
            className="input"
            style={{ width: '220px' }}
          >
            <option value="all">Todas las campañas</option>
            {campanas.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input"
            style={{ width: '180px' }}
          >
            <option value="all">Todos los estados</option>
            {JERSEY_ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Socio</th>
                <th>Campaña</th>
                <th>Cant.</th>
                <th>Talla</th>
                <th>Estampado</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Entrega</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loadingPedidos ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px' }}>Cargando pedidos...</td></tr>
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay pedidos registrados
                  </td>
                </tr>
              ) : (
                pagPedidos.itemsPagina.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>{formatDateShort(pedido.fecha)}</td>
                    <td>{pedido.socioNombre ?? 'Socio no encontrado'}</td>
                    <td>{pedido.campanaTitulo ?? <span style={{ color: '#9ca3af' }}>Manual · {pedido.tipo}</span>}</td>
                    <td>{pedido.cantidad}</td>
                    <td>{pedido.talla || '-'}</td>
                    <td>{pedido.estampado || pedido.aplique || '-'}</td>
                    <td>{formatCurrency(pedido.valor, 'COP')}</td>
                    <td>
                      <select
                        value={pedido.estado}
                        disabled={pedidoBusy === pedido.id}
                        onChange={(e) => { void handleCambiarEstado(pedido, e.target.value as JerseyEstado); }}
                        className={getStatusBadge(pedido.estado)}
                        style={{ border: 'none', cursor: 'pointer', appearance: 'auto' }}
                      >
                        {JERSEY_ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {filaError[pedido.id] && (
                        <div style={{ color: '#b91c1c', fontSize: '12px', marginTop: '4px' }}>{filaError[pedido.id]}</div>
                      )}
                    </td>
                    <td>{pedido.fechaEntrega ? formatDateShort(pedido.fechaEntrega) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => { void handleEliminarPedido(pedido); }}
                        disabled={pedidoBusy === pedido.id}
                        title="Eliminar"
                        style={{
                          backgroundColor: '#fee2e2', border: 'none', padding: '6px 10px',
                          borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                        }}
                      >🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Paginacion {...pagPedidos} etiqueta="pedidos" />
        </div>
      </div>
    </div>
  );
}
