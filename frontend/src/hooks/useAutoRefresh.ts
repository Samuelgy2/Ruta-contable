import { useEffect, useRef } from 'react';
import { DataResource, onDataChanged } from '../lib/dataEvents';

interface AutoRefreshOptions {
  /** Recursos que disparan el refresco. Vacío o ausente = cualquiera. */
  resources?: DataResource[];
  /** Sondeo periódico en ms. 0 lo desactiva. */
  pollMs?: number;
  /** Refrescar al volver a la pestaña. */
  onFocus?: boolean;
  enabled?: boolean;
}

/**
 * Mantiene una vista al día sin recargar la página: reacciona a las mutaciones
 * emitidas por el bus de datos, al volver el foco a la pestaña y a un sondeo
 * periódico opcional.
 */
export function useAutoRefresh(refresh: () => void, options: AutoRefreshOptions = {}): void {
  const { resources, pollMs = 60000, onFocus = true, enabled = true } = options;

  // Ref para que cambiar la identidad de `refresh` en cada render no reinstale
  // los listeners ni reinicie el intervalo.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const resourceKey = resources ? resources.join(',') : '';

  useEffect(() => {
    if (!enabled) return;

    const watched = resourceKey ? resourceKey.split(',') : null;

    const unsubscribe = onDataChanged(resource => {
      if (!watched || watched.includes(resource)) refreshRef.current();
    });

    const handleFocus = () => {
      if (document.visibilityState === 'visible') refreshRef.current();
    };

    if (onFocus) {
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleFocus);
    }

    const interval = pollMs > 0
      ? window.setInterval(() => {
          if (document.visibilityState === 'visible') refreshRef.current();
        }, pollMs)
      : undefined;

    return () => {
      unsubscribe();
      if (onFocus) {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
      }
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [enabled, resourceKey, pollMs, onFocus]);
}
