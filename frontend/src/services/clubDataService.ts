import api from './api';

export const clubDataService = {
  get: async () => {
    const response = await api.get('/club-data');
    return response.data;
  },

  update: async (data) => {
    const response = await api.put('/club-data', data);
    return response.data;
  },
};
