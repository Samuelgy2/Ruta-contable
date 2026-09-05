import React, { useEffect, useRef, useState } from 'react';
import { portalService } from '../../services/portalService';
import { pagoService } from '../../services/pagoService';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { descargarComprobantePago } from '../../utils/export';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface PortalPaymentsProps {
  onNavigate?: (page: string) => void;
}

interface PagoPasarela {
  id: number;
  referencia: string;
  proveedor: string;
  concepto: string | null;
  monto: string | number;
  moneda: string;
  estado: string;
  metodo_pago: string | null;
  transaction_id: number | null;
  created_at: string;
  finalized_at: string | null;
}

// Vocabulario propio de la aplicación, no el de PayPal.
const ESTADOS: Record<string, { label: string; clase: string }> = {
  APPROVED: { label: 'Aprobado',  clase: 'badge badge-active'  },
  PENDING:  { label: 'Pendiente', clase: 'badge badge-pending' },
  DECLINED: { label: 'Rechazado', clase: 'badge badge-expense' },
  VOIDED:   { label: 'Anulado',   clase: 'badge'               },
  REFUNDED: { label: 'Devuelto',  clase: 'badge badge-pending' },
  ERROR:    { label: 'Con error', clase: 'badge badge-expense' },
};

// Conceptos cobrables. El monto lo fija el backend a partir del concepto.
const CONCEPTOS = [
  { valor: 'mensualidad', etiqueta: 'Mensualidad del club' },
  { valor: 'inscripcion', etiqueta: 'Inscripción al club' },
  { valor: 'uniforme',    etiqueta: 'Uniforme del club' },
];

// El client_id es público por diseño; el secret nunca sale del backend.
const PAYPAL_CLIENT_ID = String(((import.meta as any).env ?? {}).VITE_PAYPAL_CLIENT_ID ?? '').trim();
const MONEDA = 'USD';

// Carga el SDK de PayPal una sola vez y devuelve el objeto global.
let promesaSdk: Promise<any> | null = null;

function cargarSdkPayPal(): Promise<any> {
  if ((window as any).paypal) return Promise.resolve((window as any).paypal);
  if (promesaSdk) return promesaSdk;

  promesaSdk = new Promise((resolve, reject) => {
    if (!PAYPAL_CLIENT_ID) {
      // Vite incrusta las variables VITE_* al compilar: definirla en el
      // servidor no basta, hay que volver a desplegar el frontend.
      reject(new Error(
        'Falta configurar VITE_PAYPAL_CLIENT_ID en el entorno de build del frontend. '
        + 'Defínela (en Vercel o en frontend/.env) y vuelve a desplegar.'
      ));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=${MONEDA}&intent=capture`;
    script.onload = () => resolve((window as any).paypal);
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'));
    document.body.appendChild(script);
  });

  return promesaSdk;
}

export function PortalPayments({ onNavigate }: PortalPaymentsProps) {
  const { currentUser } = useAuth();
  const [pagos, setPagos] = useState<PagoPasarela[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [concepto, setConcepto] = useState(CONCEPTOS[0].valor);
  const [aviso, setAviso] = useState('');
  const [sdkListo, setSdkListo] = useState(false);

  const contenedorBotones = useRef<HTMLDivElement | null>(null);
  // El concepto elegido se lee dentro de createOrder, que el SDK sólo registra
  // una vez: con una referencia se evita que capture el valor inicial.
  const conceptoRef = useRef(concepto);
  conceptoRef.current = concepto;

  const cargar = async () => {
    setLoading(true);
    try {
      const respuesta = await portalService.getPagos();

      if (respuesta?.success) {
        setPagos((respuesta.data ?? []) as PagoPasarela[]);
        setError('');
      } else {
        setError(respuesta?.message || 'No se pudieron cargar tus pagos');
      }
    } catch {
      setError('Error de conexión al cargar tus pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void cargar(); }, []);

  // Botones de PayPal: se montan una sola vez cuando el SDK está disponible.
  useEffect(() => {
    let cancelado = false;

    cargarSdkPayPal()
      .then(paypal => {
        if (cancelado || !contenedorBotones.current || !paypal?.Buttons) return;

        setSdkListo(true);

        paypal.Buttons({
          // El backend crea la orden y fija el monto según el concepto.
          createOrder: async () => {
            setAviso('');
            setError('');

            const respuesta = await pagoService.checkout(conceptoRef.current);

            if (!respuesta?.success || !respuesta.data?.ordenId) {
              throw new Error(respuesta?.message || 'No se pudo crear la orden de pago');
            }

            return respuesta.data.ordenId;
          },

          // El cobro real lo confirma el webhook: aquí sólo se avisa y recarga.
          onApprove: async () => {
            setAviso('Pago aprobado. Estamos confirmando el cobro con PayPal; en unos segundos aparecerá como aprobado.');
            await cargar();
          },

          onCancel: () => {
            setAviso('Has cancelado el pago. No se ha cobrado nada.');
          },

          onError: (e: unknown) => {
            console.error('Error del SDK de PayPal:', e);
            setError('No se pudo completar el pago con PayPal. Inténtalo de nuevo.');
          },
        }).render(contenedorBotones.current);
      })
      .catch(e => {
        if (!cancelado) {
          console.error(e);
          // Si el fallo trae explicación (variable de build ausente), se muestra.
          const detalle = e instanceof Error && e.message ? e.message : 'no se pudo cargar PayPal.';
          setError(`El pago en línea no está disponible: ${detalle}`);
        }
      });

    return () => { cancelado = true; };
  }, []);

  // El comprobante lo construye el frontend: PayPal sólo devuelve JSON.
  const descargarComprobante = (pago: PagoPasarela) => {
    void descargarComprobantePago({
      referencia: pago.referencia,
      concepto: pago.concepto,
      monto: Number(pago.monto),
      moneda: pago.moneda,
      estado: pago.estado,
      metodoPago: pago.metodo_pago,
      fecha: pago.finalized_at ?? pago.created_at,
      socio: currentUser?.name ?? 'Socio',
    });
  };

  const totalAprobado = pagos
    .filter(p => p.estado === 'APPROVED')
    .reduce((suma, p) => suma + Number(p.monto), 0);

  return (
    <div>
      <div className="header-content" style={{ padding: 0, marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Mis Pagos</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Historial de tus pagos en línea con el club.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Pagos registrados</h4>
          <div className="stat-value">{pagos.length}</div>
          <p className="stat-description">Incluye intentos y pagos aprobados</p>
        </div>
        <div className="stat-card">
          <h4>Total aprobado</h4>
          <div className="stat-value positive">{formatCurrency(totalAprobado, 'USD ')}</div>
          <p className="stat-description">Suma de tus pagos confirmados</p>
        </div>
      </div>

      {/* Nuevo pago */}
      <div className="card">
        <h3>Pagar en línea</h3>
        <div className="form-group">
          <label htmlFor="pago-concepto">Concepto</label>
          <select
            id="pago-concepto"
            value={concepto}
            onChange={e => setConcepto(e.target.value)}
          >
            {CONCEPTOS.map(c => (
              <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
            ))}
          </select>
          <p className="stat-description" style={{ marginTop: '6px' }}>
            El valor a pagar lo determina el club según el concepto. Los cobros se hacen en dólares.
          </p>
        </div>

        {/* Aquí monta PayPal sus propios botones. */}
        <div ref={contenedorBotones} />

        {!sdkListo && !error && (
          <p className="stat-description">Cargando la pasarela de pago…</p>
        )}

        {aviso && <p className="stat-description positive" style={{ margin: '12px 0 0' }}>{aviso}</p>}
        {error && <div className="form-error-box" style={{ marginTop: '12px' }}>{error}</div>}
      </div>

      {loading ? (
        <div className="empty-state">
          <h3>Cargando tus pagos…</h3>
        </div>
      ) : pagos.length === 0 ? (
        <div className="empty-state">
          <h3>Todavía no tienes pagos</h3>
          <p>Cuando realices un pago en línea aparecerá aquí con su comprobante.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Concepto</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map(pago => {
                const estado = ESTADOS[pago.estado] ?? { label: pago.estado, clase: 'badge' };
                return (
                  <tr key={pago.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{pago.referencia}</td>
                    <td>{pago.concepto ?? '—'}</td>
                    <td><span className={estado.clase}>{estado.label}</span></td>
                    <td>{formatCurrency(Number(pago.monto), `${pago.moneda} `)}</td>
                    <td>{pago.metodo_pago ?? 'PayPal'}</td>
                    <td>{formatDateShort(pago.finalized_at ?? pago.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => descargarComprobante(pago)}
                      >
                        Descargar PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PortalPayments;
