import React, { useEffect, useState } from 'react';
import { portalService } from '../../services/portalService';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface PortalOverviewProps {
  onNavigate?: (page: string) => void;
}

interface ResumenSocio {
  id_socio: number;
  nombre: string;
  documento: string;
  email: string | null;
  telefono: string | null;
  tipo_membresia: string | null;
  nivel_aprendizaje: string | null;
  estado: string | null;
  fecha_ingreso: string;
}

interface Resumen {
  vinculado: boolean;
  socio: ResumenSocio | null;
  cuotas: { pendientes: number; pagadas: number; totalPendiente: number; totalPagado: number };
  cartera: { pendientes: number; saldoPendiente: number };
  asistencias: { total: number; presentes: number };
  pagosEnLinea: { total: number; montoAprobado: number };
}

export function PortalOverview({ onNavigate }: PortalOverviewProps) {
  const { currentUser } = useAuth();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setLoading(true);
      try {
        const respuesta = await portalService.getResumen();

        if (cancelado) return;

        if (respuesta?.success) {
          setResumen(respuesta.data as Resumen);
          setError('');
        } else {
          setError(respuesta?.message || 'No se pudo cargar tu resumen');
        }
      } catch {
        if (!cancelado) setError('Error de conexión al cargar tu resumen');
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Cargando tu resumen…</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="form-error-box">{error}</div>
      </div>
    );
  }

  if (!resumen) return null;

  const saldoTotal = resumen.cuotas.totalPendiente + resumen.cartera.saldoPendiente;
  const alDia = saldoTotal <= 0;

  return (
    <div>
      <div className="header-content" style={{ padding: 0, marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Hola, {currentUser?.name ?? 'socio'}</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Este es el resumen de tu cuenta en el club.
          </p>
        </div>
      </div>

      {/* Cuenta todavía sin ficha de socio vinculada */}
      {!resumen.vinculado && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb' }}>
          <h3 style={{ marginBottom: '8px' }}>Tu cuenta está pendiente de vinculación</h3>
          <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            Todavía no está asociada a una ficha de socio del club. Un administrador debe
            vincularla para que puedas ver tus mensualidades, tu cartera y tu asistencia.
            Mientras tanto verás todos los valores en cero.
          </p>
        </div>
      )}

      {/* Estado de cuenta */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Saldo pendiente</h4>
          <div className={`stat-value ${alDia ? 'positive' : 'negative'}`}>
            {formatCurrency(saldoTotal)}
          </div>
          <p className="stat-description">
            {alDia ? 'Estás al día con el club' : 'Mensualidades y cartera por pagar'}
          </p>
        </div>

        <div className="stat-card">
          <h4>Mensualidades pendientes</h4>
          <div className="stat-value">{resumen.cuotas.pendientes}</div>
          <p className="stat-description">
            {formatCurrency(resumen.cuotas.totalPendiente)} por pagar
          </p>
        </div>

        <div className="stat-card">
          <h4>Mensualidades pagadas</h4>
          <div className="stat-value positive">{resumen.cuotas.pagadas}</div>
          <p className="stat-description">
            {formatCurrency(resumen.cuotas.totalPagado)} abonados
          </p>
        </div>

        <div className="stat-card">
          <h4>Asistencia</h4>
          <div className="stat-value">{resumen.asistencias.presentes}</div>
          <p className="stat-description">
            de {resumen.asistencias.total} entrenamientos registrados
          </p>
        </div>
      </div>

      {/* Tus transacciones en línea */}
      <div className="card">
        <h3>Tus pagos en línea</h3>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <h4>Pagos registrados</h4>
            <div className="stat-value">{resumen.pagosEnLinea.total}</div>
            <p className="stat-description">Incluye intentos y pagos aprobados</p>
          </div>
          <div className="stat-card">
            <h4>Total aprobado</h4>
            <div className="stat-value positive">
              {formatCurrency(resumen.pagosEnLinea.montoAprobado)}
            </div>
            <p className="stat-description">Suma de tus pagos confirmados</p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '20px' }}
            onClick={() => onNavigate('my-payments')}
          >
            Ver el detalle de mis pagos
          </button>
        )}
      </div>

      {/* Ficha de socio */}
      {resumen.vinculado && resumen.socio && (
        <div className="card">
          <h3>Tu ficha de socio</h3>
          <div className="data-summary">
            <div className="data-summary-item">
              <span className="data-summary-label">Nombre</span>
              <span className="data-summary-value">{resumen.socio.nombre}</span>
            </div>
            <div className="data-summary-item">
              <span className="data-summary-label">Documento</span>
              <span className="data-summary-value">{resumen.socio.documento}</span>
            </div>
            <div className="data-summary-item">
              <span className="data-summary-label">Membresía</span>
              <span className="data-summary-value">{resumen.socio.tipo_membresia ?? '—'}</span>
            </div>
            <div className="data-summary-item">
              <span className="data-summary-label">Nivel</span>
              <span className="data-summary-value">{resumen.socio.nivel_aprendizaje ?? '—'}</span>
            </div>
            <div className="data-summary-item">
              <span className="data-summary-label">Estado</span>
              <span className="data-summary-value">{resumen.socio.estado ?? '—'}</span>
            </div>
            <div className="data-summary-item">
              <span className="data-summary-label">Ingreso</span>
              <span className="data-summary-value">{formatDateShort(resumen.socio.fecha_ingreso)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalOverview;
