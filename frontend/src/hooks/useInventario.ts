import { useState, useCallback, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';

export interface Producto {
  id: number;
  name: string;
  price: string;
  description: string | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
  stock: number;
  created_at: string;
  updated_at: string | null;
}

export interface CategoriaProducto {
  id: number;
  nombre: string;
}

export interface PedidoJersey {
  id_pedido: number;
  id_socio: number;
  socio_nombre: string | null;
  fecha: string;
  tipo: string;
  talla: string | null;
  aplique: string | null;
  valor: string;
  estado: string;
  fecha_entrega: string | null;
  id_inventario: number | null;
  estado_entrega: string | null;
}

interface UseInventarioResult {
  productos: Producto[];
  categorias: CategoriaProducto[];
  jerseys: PedidoJersey[];
  loading: boolean;
  error: string | null;
  fetchProductos: (search?: string) => Promise<void>;
  fetchCategorias: () => Promise<void>;
  fetchJerseys: () => Promise<void>;
  createProducto: (data: Partial<Producto>) => Promise<{ success: boolean; message: string }>;
  updateProducto: (id: number, data: Partial<Producto>) => Promise<{ success: boolean; message: string }>;
  removeProducto: (id: number) => Promise<{ success: boolean; message: string }>;
  createCategoria: (nombre: string) => Promise<{ success: boolean; message: string }>;
}

export function useInventario(): UseInventarioResult {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [jerseys, setJerseys] = useState<PedidoJersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = useCallback(async (search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventarioService.getAllProducts({ search });
      if (response.success) {
        setProductos(response.data || []);
      } else {
        setError(response.message || 'Error al cargar productos');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategorias = useCallback(async () => {
    try {
      const response = await inventarioService.getCategorias();
      if (response.success) setCategorias(response.data || []);
    } catch {
      // silencioso: no bloquea el listado de productos
    }
  }, []);

  const fetchJerseys = useCallback(async () => {
    try {
      const response = await inventarioService.getJerseys();
      if (response.success) setJerseys(response.data || []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => { fetchProductos(); fetchCategorias(); }, [fetchProductos, fetchCategorias]);

  const createProducto = async (data: Partial<Producto>) => {
    try {
      const response = await inventarioService.createProduct(data);
      if (response.success) {
        await fetchProductos();
        return { success: true, message: response.message || 'Producto creado' };
      }
      return { success: false, message: response.message || 'Error al crear producto' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateProducto = async (id: number, data: Partial<Producto>) => {
    try {
      const response = await inventarioService.updateProduct(id, data);
      if (response.success) {
        await fetchProductos();
        return { success: true, message: response.message || 'Producto actualizado' };
      }
      return { success: false, message: response.message || 'Error al actualizar producto' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removeProducto = async (id: number) => {
    try {
      const response = await inventarioService.removeProduct(id);
      if (response.success) {
        await fetchProductos();
        return { success: true, message: response.message || 'Producto eliminado' };
      }
      return { success: false, message: response.message || 'Error al eliminar producto' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const createCategoria = async (nombre: string) => {
    try {
      const response = await inventarioService.createCategoria({ nombre });
      if (response.success) {
        await fetchCategorias();
        return { success: true, message: response.message || 'Categoría creada' };
      }
      return { success: false, message: response.message || 'Error al crear categoría' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return {
    productos, categorias, jerseys, loading, error,
    fetchProductos, fetchCategorias, fetchJerseys,
    createProducto, updateProducto, removeProducto, createCategoria,
  };
}
