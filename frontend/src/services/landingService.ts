import api from './api';
import { API_URL } from './apiConfig';
import type { ContenidoLanding, ImagenLanding } from '../features/landing/data';

export interface LandingPublicada { numero: number; contenido: ContenidoLanding; imagenes: ImagenLanding[]; }

export interface EstadoLanding {
  borrador:  { contenido: ContenidoLanding; actualizadoEn: string; actualizadoPor: string | null } | null;
  publicado: { numero: number; contenido: ContenidoLanding; publicadoEn: string; publicadoPor: string | null } | null;
  cambiosSinPublicar: boolean;
}

export interface ImagenAdmin extends ImagenLanding {
  mime: string;
  bytes: number;
  creadoEn: string;
  enBorrador: boolean;
  enPublicada: boolean;
}

export interface VersionLanding { numero: number; publicadoEn: string; publicadoPor: string | null; actual: boolean; }

// Si el backend tarda más que esto (p. ej. Render despertando), la landing
// muestra el contenido por defecto en vez de quedarse en blanco (RNF-011).
const ESPERA_PUBLICA_MS = 2500;

export const landingService = {
  // Pública, sin token: null si no hay versión publicada (el backend manda el
  // contenido por defecto, igual al del frontend) o si no responde a tiempo.
  getPublicada: async (): Promise<LandingPublicada | null> => {
    const res = await fetch(`${API_URL}/landing`, { signal: AbortSignal.timeout(ESPERA_PUBLICA_MS) });
    const json = await res.json();
    return json.success && json.data.numero ? json.data : null;
  },

  urlImagenPublica: (id: number) => `${API_URL}/landing/imagenes/${id}`,

  getEstado: async (): Promise<EstadoLanding> => (await api.get('/admin/landing')).data.data,

  guardarBorrador: async (contenido: ContenidoLanding) =>
    (await api.put('/admin/landing/borrador', { contenido })).data,

  publicar: async () => (await api.post('/admin/landing/publicar')).data,

  getVersiones: async (): Promise<VersionLanding[]> => (await api.get('/admin/landing/versiones')).data.data,

  restaurar: async (numero: number) => (await api.post(`/admin/landing/versiones/${numero}/restaurar`)).data,

  getImagenes: async (): Promise<ImagenAdmin[]> => (await api.get('/admin/landing/imagenes')).data.data,

  subirImagen: async (archivo: File, alt: string) =>
    (await api.post(`/admin/landing/imagenes?alt=${encodeURIComponent(alt)}`, archivo, {
      headers: { 'Content-Type': archivo.type },
    })).data,

  eliminarImagen: async (id: number) => (await api.delete(`/admin/landing/imagenes/${id}`)).data,

  // La vista previa necesita el token: se descarga como blob y se usa un object URL.
  urlImagenAdmin: async (id: number) =>
    URL.createObjectURL((await api.get(`/admin/landing/imagenes/${id}/archivo`, { responseType: 'blob' })).data),
};
