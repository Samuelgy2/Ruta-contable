import api from './api';

export const carteraService = {
  getAll: async (params: { estado?: string; idSocio?: string | number; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.idSocio) qs.set('idSocio', String(params.idSocio));
    if (params.search) qs.set('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/cartera${query}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/cartera/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/cartera', data);
    return response.data;
  },

  update: async (id: string | number, data) => {
    const response = await api.put(`/cartera/${id}`, data);
    return response.data;
  },

  remove: async (id: string | number) => {
    const response = await api.delete(`/cartera/${id}`);
    return response.data;
  },
};
