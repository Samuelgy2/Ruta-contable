import api from './api';

export const inventarioService = {
  getAllProducts: async (params: { search?: string; categoriaId?: string | number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.categoriaId) qs.set('categoriaId', String(params.categoriaId));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/inventario/productos${query}`);
    return response.data;
  },

  getProductById: async (id: string | number) => {
    const response = await api.get(`/inventario/productos/${id}`);
    return response.data;
  },

  createProduct: async (data) => {
    const response = await api.post('/inventario/productos', data);
    return response.data;
  },

  updateProduct: async (id: string | number, data) => {
    const response = await api.put(`/inventario/productos/${id}`, data);
    return response.data;
  },

  removeProduct: async (id: string | number) => {
    const response = await api.delete(`/inventario/productos/${id}`);
    return response.data;
  },

  getCategorias: async () => {
    const response = await api.get('/inventario/categorias');
    return response.data;
  },

  createCategoria: async (data) => {
    const response = await api.post('/inventario/categorias', data);
    return response.data;
  },

  getJerseys: async () => {
    const response = await api.get('/inventario/jerseys');
    return response.data;
  },
};
