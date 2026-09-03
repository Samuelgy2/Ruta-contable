// ─── Configuración de la URL del backend ──────────────────────────────────────
// Punto único donde se decide a qué backend apunta el frontend. Vite sustituye
// VITE_API_URL en tiempo de build, así que cambiarla obliga a volver a desplegar.
//
// Si la variable no está definida:
//   - en desarrollo se usa una ruta relativa y el proxy de `vite.config.ts`
//     reenvía `/api` al backend local del puerto 3001;
//   - en producción se recurre al backend desplegado en Render.

const env: Record<string, any> = (import.meta as any).env ?? {};

const configured: string = String(env.VITE_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '');

const FALLBACK: string = env.DEV ? '' : 'https://ruta-contable.onrender.com';

/** Origen del backend, sin barra final y sin el sufijo `/api`. */
export const API_BASE: string = configured || FALLBACK;

/** Raíz de la API REST (`API_BASE` + `/api`). Todas las rutas cuelgan de aquí. */
export const API_URL: string = API_BASE === '/api' ? '/api' : `${API_BASE}/api`;
