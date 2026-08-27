// Bus de eventos de datos.
//
// Cada vez que una petición que modifica datos (POST/PUT/PATCH/DELETE) termina
// bien, se emite el recurso afectado. Las vistas que muestran datos derivados
// —campana de notificaciones, resumen— se suscriben y se refrescan solas, sin
// que el usuario tenga que recargar la página.

export type DataResource =
  | 'pagos-mensuales' | 'transactions' | 'socios' | 'members' | 'cartera'
  | 'categories' | 'club-data' | 'users' | 'periodos' | 'proveedores'
  | 'compras' | 'inventario' | 'asistencia' | 'unknown';

type Listener = (resource: DataResource) => void;

const listeners = new Set<Listener>();

/** Deriva el recurso a partir de la URL de la petición ("/pagos-mensuales/3"). */
export function resourceFromUrl(url?: string): DataResource {
  if (!url) return 'unknown';
  const path = url.split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  const segment = path.split('/').filter(Boolean).find(s => s !== 'api');
  return (segment as DataResource) ?? 'unknown';
}

export function emitDataChanged(resource: DataResource): void {
  listeners.forEach(listener => {
    try {
      listener(resource);
    } catch (err) {
      console.error('Error en listener de dataEvents:', err);
    }
  });
}

/** Registra un listener y devuelve la función para darlo de baja. */
export function onDataChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
