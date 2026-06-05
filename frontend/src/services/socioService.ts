import api from './api';

export const socioService = {
  getAll: async (search: string = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get(`/socios${params}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/socios/${id}`);
    return response.data;
  },

  create: async (socioData) => {
    const response = await api.post('/socios', socioData);
    return response.data;
  },

  update: async (id: string | number, socioData) => {
    const response = await api.put(`/socios/${id}`, socioData);
    return response.data;
  },

  remove: async (id: string | number) => {
    const response = await api.delete(`/socios/${id}`);
    return response.data;
  },
};
