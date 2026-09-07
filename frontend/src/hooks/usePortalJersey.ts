import { useEffect, useMemo, useReducer } from 'react';
import { jerseyService, PortalJerseyData } from '../services/jerseyService';
import { onDataChanged } from '../lib/dataEvents';
import { useAuth } from '../features/auth/contexts/AuthContext';

// Estado compartido de GET /api/portal/jersey.
//
// El menú del portal (punto junto a "Jersey"), el resumen (tarjeta "Nuevo
// jersey disponible") y la página Jersey muestran la misma información. Para
// no lanzar tres peticiones idénticas, el resultado vive en módulo y cada
// componente montado se suscribe. Se vuelve a consultar cuando cambia el
// usuario de la sesión o cuando una escritura toca /portal o /jersey.

interface EstadoCompartido {
  usuarioId: string | null;
  data: PortalJerseyData | null;
  loading: boolean;
  error: string;
}

let estado: EstadoCompartido = { usuarioId: null, data: null, loading: false, error: '' };
let enCurso: Promise<void> | null = null;
const suscriptores = new Set<() => void>();

function notificar() {
  suscriptores.forEach(fn => fn());
}

function cargar(usuarioId: string, forzar = false): Promise<void> {
  if (enCurso && !forzar) return enCurso;

  estado = { ...estado, usuarioId, loading: true };
  notificar();

  enCurso = (async () => {
    try {
      const respuesta = await jerseyService.getPortal();
      if (respuesta?.success) {
        estado = { usuarioId, data: respuesta.data as PortalJerseyData, loading: false, error: '' };
      } else {
        estado = { usuarioId, data: null, loading: false, error: respuesta?.message || 'No se pudieron cargar las campañas' };
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error de conexión al cargar las campañas de jersey';
      estado = { usuarioId, data: null, loading: false, error: msg };
    } finally {
      enCurso = null;
      notificar();
    }
  })();

  return enCurso;
}

/**
 * Campañas de jersey activas del socio en sesión, compartidas entre vistas.
 * `enabled = false` no consulta nada (por ejemplo, para el administrador,
 * que no tiene socio y para quien /api/portal/jersey no aporta información).
 */
export function usePortalJersey(enabled: boolean = true) {
  const { currentUser } = useAuth();
  const usuarioId = currentUser?.id != null ? String(currentUser.id) : null;
  const [, rerender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!enabled || !usuarioId) return;

    suscriptores.add(rerender);

    // Primera consulta, o cambió el usuario de la sesión.
    if (estado.usuarioId !== usuarioId || (!estado.data && !estado.error && !enCurso)) {
      void cargar(usuarioId, estado.usuarioId !== usuarioId);
    }

    const baja = onDataChanged(recurso => {
      if (recurso === 'portal' || recurso === 'jersey') void cargar(usuarioId, true);
    });

    return () => {
      suscriptores.delete(rerender);
      baja();
    };
  }, [enabled, usuarioId]);

  const data = enabled ? estado.data : null;

  // Campañas activas en las que el socio todavía no ha pedido: son la
  // "notificación de nuevo jersey" del portal.
  const campanasSinPedido = useMemo(
    () => (data?.vinculado ? data.campanas.filter(c => c.pedido === null) : []),
    [data]
  );

  return {
    data,
    loading: enabled ? estado.loading : false,
    error: enabled ? estado.error : '',
    campanasSinPedido,
    pendientes: campanasSinPedido.length,
    recargar: () => (usuarioId ? cargar(usuarioId, true) : Promise.resolve()),
  };
}
