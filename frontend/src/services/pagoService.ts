import api from './api';

export const pagoService = {
  // Crea la orden en PayPal y devuelve su identificador. El monto lo fija el
  // backend a partir del concepto: aquí nunca se envía un valor.
  checkout: async (concepto: string) => {
    const response = await api.post('/pagos/checkout', { concepto });
    return response.data;
  },

  // Estado de un pago. El backend sólo lo entrega a su dueño o a un administrador.
  getByReferencia: async (referencia: string) => {
    const response = await api.get(`/pagos/${encodeURIComponent(referencia)}`);
    return response.data;
  },

  // Listado completo con paginación. Sólo administradores.
  getAll: async (params: { estado?: string; search?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.search) qs.set('search', params.search);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/pagos${query}`);
    return response.data;
  },
};
