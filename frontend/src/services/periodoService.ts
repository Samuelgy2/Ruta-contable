import api from './api';

export const periodoService = {
  getAll: async (params: { anio?: string | number } = {}) => {
    const qs = new URLSearchParams();
    if (params.anio) qs.set('anio', String(params.anio));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/periodos${query}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/periodos/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/periodos', data);
    return response.data;
  },

  update: async (id: string | number, data) => {
    const response = await api.put(`/periodos/${id}`, data);
    return response.data;
  },

  remove: async (id: string | number) => {
    const response = await api.delete(`/periodos/${id}`);
    return response.data;
  },
};
