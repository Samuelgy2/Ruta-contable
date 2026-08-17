import api from './api';

export const proveedorService = {
  getAll: async (params: { search?: string; estado?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.estado) qs.set('estado', params.estado);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/proveedores${query}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/proveedores', data);
    return response.data;
  },

  update: async (id: string | number, data) => {
    const response = await api.put(`/proveedores/${id}`, data);
    return response.data;
  },

  remove: async (id: string | number) => {
    const response = await api.delete(`/proveedores/${id}`);
    return response.data;
  },
};
