import React, { useState } from 'react';
import { usePortalJersey } from '../../hooks/usePortalJersey';
import { jerseyService, PortalCampana } from '../../services/jerseyService';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface PortalJerseyProps {
  onNavigate?: (page: string) => void;
}

const CANTIDAD_MAXIMA = 10;
const ESTAMPADO_MAXIMO = 60;

interface FormPedido {
  cantidad: string;
  talla: string;
  estampado: string;
}

function formDesdeCampana(c: PortalCampana): FormPedido {
  return {
    cantidad: String(c.pedido?.cantidad ?? 1),
    talla: c.pedido?.talla ?? '',
    estampado: c.pedido?.estampado ?? '',
  };
}

// Colores del estado del pedido (mismos que el panel del administrador).
function colorEstado(estado: string): { bg: string; color: string } {
  switch (estado) {
    case 'Solicitado':    return { bg: '#dbeafe', color: '#1d4ed8' };
    case 'En producción': return { bg: '#fef3c7', color: '#92400e' };
    case 'Listo':         return { bg: '#ede9fe', color: '#6d28d9' };
    case 'Entregado':     return { bg: '#d1fae5', color: '#065f46' };
    case 'Cancelado':     return { bg: '#f3f4f6', color: '#374151' };
    default:              return { bg: '#f3f4f6', color: '#374151' };
  }
}

export function PortalJersey({ onNavigate }: PortalJerseyProps) {
  const { data, loading, error, recargar } = usePortalJersey();

  // Estado del formulario por campaña; se crea al abrirlo.
  const [forms, setForms] = useState<Record<number, FormPedido>>({});
  const [editando, setEditando] = useState<Record<number, boolean>>({});
  const [errores, setErrores] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState<number | null>(null);
  const [exito, setExito] = useState<Record<number, string>>({});

  const abrirForm = (c: PortalCampana) => {
    setForms(prev => ({ ...prev, [c.id]: prev[c.id] ?? formDesdeCampana(c) }));
    setEditando(prev => ({ ...prev, [c.id]: true }));
    setErrores(prev => ({ ...prev, [c.id]: '' }));
    setExito(prev => ({ ...prev, [c.id]: '' }));
  };

  const cerrarForm = (id: number) => {
    setEditando(prev => ({ ...prev, [id]: false }));
  };

  const setCampo = (id: number, campo: keyof FormPedido, valor: string) => {
    setForms(prev => ({ ...prev, [id]: { ...(prev[id] ?? { cantidad: '1', talla: '', estampado: '' }), [campo]: valor } }));
  };

  const validar = (c: PortalCampana, f: FormPedido): string => {
    const cantidad = Number(f.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
      return `La cantidad debe ser un número entero entre 1 y ${CANTIDAD_MAXIMA}`;
    }
    if (!f.talla || !c.tallas.includes(f.talla)) return 'Selecciona una talla de la lista';
    if (f.estampado.trim().length > ESTAMPADO_MAXIMO) return `El estampado no puede superar ${ESTAMPADO_MAXIMO} caracteres`;
    return '';
  };

  const enviar = async (c: PortalCampana) => {
    const f = forms[c.id] ?? formDesdeCampana(c);
    const problema = validar(c, f);
    if (problema) {
      setErrores(prev => ({ ...prev, [c.id]: problema }));
      return;
    }

    setEnviando(c.id);
    setErrores(prev => ({ ...prev, [c.id]: '' }));
    try {
      const r = await jerseyService.enviarPedidoPortal({
        idCampana: c.id,
        cantidad: Number(f.cantidad),
        talla: f.talla,
        estampado: f.estampado.trim() || undefined,
      });
      if (r?.success) {
        setExito(prev => ({ ...prev, [c.id]: r.message || 'Pedido enviado' }));
        cerrarForm(c.id);
        await recargar();
      } else {
        setErrores(prev => ({ ...prev, [c.id]: r?.message || 'No se pudo enviar el pedido' }));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error de conexión al enviar el pedido';
      setErrores(prev => ({ ...prev, [c.id]: msg }));
      // Un 409 significa que el pedido cambió de estado en el panel: se refresca.
      if (err?.response?.status === 409) await recargar();
    } finally {
      setEnviando(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="empty-state">
        <h3>Cargando campañas…</h3>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card">
        <div className="form-error-box">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="header-content" style={{ padding: 0, marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Jersey del club</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Pide tu jersey en las campañas abiertas. Puedes editar el pedido mientras siga en "Solicitado".
          </p>
        </div>
      </div>

      {/* Mismo aviso que el resumen para la cuenta sin ficha de socio */}
      {!data.vinculado && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb' }}>
          <h3 style={{ marginBottom: '8px' }}>Tu cuenta está pendiente de vinculación</h3>
          <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            Todavía no está asociada a una ficha de socio del club. Un administrador debe
            vincularla para que puedas ver tus mensualidades, tu cartera y tu asistencia.
            Mientras tanto verás todos los valores en cero.
          </p>
        </div>
      )}

      {data.vinculado && data.campanas.length === 0 && (
        <div className="empty-state">
          <h3>No hay campañas abiertas</h3>
          <p style={{ color: '#6b7280' }}>Cuando el club abra una campaña de jersey la verás aquí.</p>
        </div>
      )}

      {data.vinculado && data.campanas.map(c => {
        const f = forms[c.id] ?? formDesdeCampana(c);
        const pedido = c.pedido;
        const puedeEditar = !pedido || pedido.estado === 'Solicitado';
        const abierto = editando[c.id] === true || (!pedido && editando[c.id] !== false);
        const est = pedido ? colorEstado(pedido.estado) : null;
        const cantidad = Number(f.cantidad) || 0;

        return (
          <div key={c.id} className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>{c.titulo}</h3>
                {c.descripcion && (
                  <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '14px' }}>{c.descripcion}</p>
                )}
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#374151' }}>
                  Valor unitario: <strong>{formatCurrency(c.valor, 'COP')}</strong>
                  {c.fechaFin && <> · Hasta el {formatDateShort(c.fechaFin)}</>}
                </p>
              </div>
              {pedido && est && (
                <span style={{
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '12px',
                  fontWeight: '600', backgroundColor: est.bg, color: est.color, whiteSpace: 'nowrap',
                }}>
                  {pedido.estado}
                </span>
              )}
            </div>

            {/* Pedido existente */}
            {pedido && !abierto && (
              <div className="data-summary" style={{ marginTop: '16px' }}>
                <div className="data-summary-item">
                  <span className="data-summary-label">Cantidad</span>
                  <span className="data-summary-value">{pedido.cantidad}</span>
                </div>
                <div className="data-summary-item">
                  <span className="data-summary-label">Talla</span>
                  <span className="data-summary-value">{pedido.talla ?? '—'}</span>
                </div>
                <div className="data-summary-item">
                  <span className="data-summary-label">Estampado</span>
                  <span className="data-summary-value">{pedido.estampado || '—'}</span>
                </div>
                <div className="data-summary-item">
                  <span className="data-summary-label">Total</span>
                  <span className="data-summary-value">{formatCurrency(pedido.valor, 'COP')}</span>
                </div>
                <div className="data-summary-item">
                  <span className="data-summary-label">Pedido el</span>
                  <span className="data-summary-value">{formatDateShort(pedido.fecha)}</span>
                </div>
                {pedido.fechaEntrega && (
                  <div className="data-summary-item">
                    <span className="data-summary-label">Entrega</span>
                    <span className="data-summary-value">{formatDateShort(pedido.fechaEntrega)}</span>
                  </div>
                )}
              </div>
            )}

            {pedido && !abierto && (
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {puedeEditar ? (
                  <button type="button" className="btn btn-secondary" onClick={() => abrirForm(c)}>
                    Editar pedido
                  </button>
                ) : (
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    El pedido ya está en producción o entregado y no se puede modificar.
                  </span>
                )}
                {exito[c.id] && <span style={{ fontSize: '13px', color: '#047857' }}>{exito[c.id]}</span>}
              </div>
            )}

            {/* Formulario de pedido */}
            {abierto && puedeEditar && (
              <form
                onSubmit={(e) => { e.preventDefault(); void enviar(c); }}
                style={{ marginTop: '16px' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label>Cantidad (1 a {CANTIDAD_MAXIMA})</label>
                    <input
                      type="number"
                      min={1}
                      max={CANTIDAD_MAXIMA}
                      step={1}
                      value={f.cantidad}
                      onChange={(e) => setCampo(c.id, 'cantidad', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Talla</label>
                    <select
                      value={f.talla}
                      onChange={(e) => setCampo(c.id, 'talla', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {c.tallas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Estampado (nombre y número, opcional)</label>
                    <input
                      type="text"
                      value={f.estampado}
                      maxLength={ESTAMPADO_MAXIMO}
                      placeholder="PÉREZ 10"
                      onChange={(e) => setCampo(c.id, 'estampado', e.target.value)}
                    />
                    <small style={{ color: '#9ca3af' }}>{f.estampado.length}/{ESTAMPADO_MAXIMO}</small>
                  </div>
                </div>

                <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#374151' }}>
                  Total estimado: <strong>{formatCurrency(c.valor * cantidad, 'COP')}</strong>
                </p>

                {errores[c.id] && (
                  <div className="form-error-box" style={{ marginTop: '12px' }}>{errores[c.id]}</div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" disabled={enviando === c.id}>
                    {enviando === c.id ? 'Enviando...' : pedido ? 'Guardar cambios' : 'Enviar pedido'}
                  </button>
                  {pedido && (
                    <button type="button" className="btn btn-secondary" onClick={() => cerrarForm(c.id)} disabled={enviando === c.id}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        );
      })}

      {onNavigate && (
        <button type="button" className="btn btn-secondary" onClick={() => onNavigate('overview')}>
          Volver al resumen
        </button>
      )}
    </div>
  );
}

export default PortalJersey;
