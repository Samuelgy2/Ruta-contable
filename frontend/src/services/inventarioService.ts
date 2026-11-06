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

  createProduct: async (data: any) => {
    const response = await api.post('/inventario/productos', data);
    return response.data;
  },

  updateProduct: async (id: string | number, data: any) => {
    const response = await api.put(`/inventario/productos/${id}`, data);
    return response.data;
  },

  removeProduct: async (id: string | number) => {
    const response = await api.delete(`/inventario/productos/${id}`);
    return response.data;
  },

  getMovimientos: async (params: { idProducto?: string | number } = {}) => {
    const qs = new URLSearchParams();
    if (params.idProducto) qs.set('idProducto', String(params.idProducto));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/inventario/movimientos${query}`);
    return response.data;
  },

  createMovimiento: async (data: { idProducto: number; tipo: 'entrada' | 'salida' | 'ajuste'; cantidad: number; motivo: string; idCompra?: number }) => {
    const response = await api.post('/inventario/movimientos', data);
    return response.data;
  },

  getCategorias: async () => {
    const response = await api.get('/inventario/categorias');
    return response.data;
  },

  createCategoria: async (data: any) => {
    const response = await api.post('/inventario/categorias', data);
    return response.data;
  },

  getJerseys: async () => {
    const response = await api.get('/inventario/jerseys');
    return response.data;
  },
};
