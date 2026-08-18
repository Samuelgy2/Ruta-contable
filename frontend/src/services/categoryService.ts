import api from './api';

export const categoryService = {
  getAll: async (params: { type?: string; active?: boolean; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.type) qs.set('type', params.type);
    if (params.active !== undefined) qs.set('active', String(params.active));
    if (params.search) qs.set('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/categories${query}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: string | number, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  remove: async (id: string | number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
