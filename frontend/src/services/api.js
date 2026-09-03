import axios from 'axios';
import { emitDataChanged, resourceFromUrl } from '../lib/dataEvents';
import { API_URL } from './apiConfig';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token automáticamente a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clubfinance_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación y avisar de mutaciones
api.interceptors.response.use(
  (response) => {
    // Toda escritura correcta notifica al bus para que las vistas derivadas
    // (campana de notificaciones, resumen) se refresquen sin recargar.
    const method = (response.config?.method || 'get').toLowerCase();
    if (method !== 'get') {
      emitDataChanged(resourceFromUrl(response.config?.url));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('clubfinance_token');
      localStorage.removeItem('clubfinance_user');
    }
    return Promise.reject(error);
  }
);

export default api;