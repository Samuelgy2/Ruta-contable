import api from './api';

export const asistenciaService = {
  getAll: async (params: { idSocio?: string | number; estado?: string; fechaInicio?: string; fechaFin?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.idSocio) qs.set('idSocio', String(params.idSocio));
    if (params.estado) qs.set('estado', params.estado);
    if (params.fechaInicio) qs.set('fechaInicio', params.fechaInicio);
    if (params.fechaFin) qs.set('fechaFin', params.fechaFin);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/asistencia${query}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/asistencia/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/asistencia', data);
    return response.data;
  },

  update: async (id: string | number, data) => {
    const response = await api.put(`/asistencia/${id}`, data);
    return response.data;
  },

  remove: async (id: string | number) => {
    const response = await api.delete(`/asistencia/${id}`);
    return response.data;
  },

  getAlertas: async () => {
    const response = await api.get('/asistencia/alertas');
    return response.data;
  },

  exportarExcelUrl: (params: { idSocio?: string | number; fechaInicio?: string; fechaFin?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.idSocio) qs.set('idSocio', String(params.idSocio));
    if (params.fechaInicio) qs.set('fechaInicio', params.fechaInicio);
    if (params.fechaFin) qs.set('fechaFin', params.fechaFin);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return `/asistencia/exportar-excel${query}`;
  },
};
