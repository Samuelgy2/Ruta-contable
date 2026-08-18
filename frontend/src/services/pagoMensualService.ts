import api from './api';

export const pagoMensualService = {
  getAll: async (params: { estado?: string; idSocio?: string | number; idPeriodo?: string | number; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.idSocio) qs.set('idSocio', String(params.idSocio));
    if (params.idPeriodo) qs.set('idPeriodo', String(params.idPeriodo));
    if (params.search) qs.set('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/pagos-mensuales${query}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/pagos-mensuales/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/pagos-mensuales', data);
    return response.data;
  },

  update: async (id: string | number, data) => {
    const response = await api.put(`/pagos-mensuales/${id}`, data);
    return response.data;
  },

  remove: async (id: string | number) => {
    const response = await api.delete(`/pagos-mensuales/${id}`);
    return response.data;
  },
};
