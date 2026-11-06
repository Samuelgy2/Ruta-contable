import api from './api';

// Facturación (RF-055 / RF-058)
export const facturaService = {
  getAll: async (params: { estado?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.search) qs.set('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return (await api.get(`/facturas${query}`)).data;
  },
  getById: async (id: number) => (await api.get(`/facturas/${id}`)).data,
  create: async (data: unknown) => (await api.post('/facturas', data)).data,
  update: async (id: number, data: unknown) => (await api.put(`/facturas/${id}`, data)).data,
  anular: async (id: number) => (await api.post(`/facturas/${id}/anular`)).data,
  registrarPago: async (id: number, data: unknown) => (await api.post(`/facturas/${id}/pagos`, data)).data,
};
