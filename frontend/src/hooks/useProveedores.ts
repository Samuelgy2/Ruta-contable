import { useState, useCallback, useEffect } from 'react';
import { proveedorService } from '../services/proveedorService';

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  nit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  estado: 'activo' | 'inactivo';
  observaciones: string | null;
  created_at: string;
}

interface UseProveedoresResult {
  proveedores: Proveedor[];
  loading: boolean;
  error: string | null;
  fetchProveedores: (search?: string) => Promise<void>;
  createProveedor: (data: Partial<Proveedor>) => Promise<{ success: boolean; message: string }>;
  updateProveedor: (id: number, data: Partial<Proveedor>) => Promise<{ success: boolean; message: string }>;
  removeProveedor: (id: number) => Promise<{ success: boolean; message: string }>;
}

export function useProveedores(): UseProveedoresResult {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProveedores = useCallback(async (search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await proveedorService.getAll({ search });
      if (response.success) {
        setProveedores(response.data || []);
      } else {
        setError(response.message || 'Error al cargar proveedores');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProveedores(); }, [fetchProveedores]);

  const createProveedor = async (data: Partial<Proveedor>) => {
    try {
      const response = await proveedorService.create(data);
      if (response.success) {
        await fetchProveedores();
        return { success: true, message: response.message || 'Proveedor creado' };
      }
      return { success: false, message: response.message || 'Error al crear proveedor' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateProveedor = async (id: number, data: Partial<Proveedor>) => {
    try {
      const response = await proveedorService.update(id, data);
      if (response.success) {
        await fetchProveedores();
        return { success: true, message: response.message || 'Proveedor actualizado' };
      }
      return { success: false, message: response.message || 'Error al actualizar proveedor' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removeProveedor = async (id: number) => {
    try {
      const response = await proveedorService.remove(id);
      if (response.success) {
        await fetchProveedores();
        return { success: true, message: response.message || 'Proveedor eliminado' };
      }
      return { success: false, message: response.message || 'Error al eliminar proveedor' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return { proveedores, loading, error, fetchProveedores, createProveedor, updateProveedor, removeProveedor };
}
