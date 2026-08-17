import api from './api';

export const compraService = {
  getAll: async (params: { estado?: string; idProveedor?: string | number; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.estado) qs.set('estado', params.estado);
    if (params.idProveedor) qs.set('idProveedor', String(params.idProveedor));
    if (params.search) qs.set('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/compras${query}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/compras/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/compras', data);
    return response.data;
  },

  update: async (id: string | number, data) => {
    const response = await api.put(`/compras/${id}`, data);
    return response.data;
  },

  aprobar: async (id: string | number) => {
    const response = await api.post(`/compras/${id}/aprobar`);
    return response.data;
  },

  remove: async (id: string | number) => {
    const response = await api.delete(`/compras/${id}`);
    return response.data;
  },

  addDetalle: async (id: string | number, data) => {
    const response = await api.post(`/compras/${id}/detalle`, data);
    return response.data;
  },

  removeDetalle: async (id: string | number, nroLinea: string | number) => {
    const response = await api.delete(`/compras/${id}/detalle/${nroLinea}`);
    return response.data;
  },
};
