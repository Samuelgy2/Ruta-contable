import { useState, useCallback, useEffect } from 'react';
import { compraService } from '../services/compraService';

export interface DetalleCompra {
  id_compra: number;
  nro_linea: number;
  concepto: string;
  cantidad: number;
  valor_unitario: string;
  valor_total: string;
}

export interface Compra {
  id_compra: number;
  concepto: string;
  tipo: string | null;
  fecha: string;
  id_proveedor: number | null;
  proveedor_nombre: string | null;
  factura: string | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
  id_transaccion: number | null;
  observaciones: string | null;
  estado: 'pendiente' | 'aprobada';
  approved_by: number | null;
  approved_at: string | null;
  created_by: number | null;
  created_at: string;
  detalle?: DetalleCompra[];
}

interface UseComprasResult {
  compras: Compra[];
  loading: boolean;
  error: string | null;
  fetchCompras: (filtros?: { estado?: string; idProveedor?: string | number; search?: string }) => Promise<void>;
  createCompra: (data: Partial<Compra>) => Promise<{ success: boolean; message: string }>;
  updateCompra: (id: number, data: Partial<Compra>) => Promise<{ success: boolean; message: string }>;
  aprobarCompra: (id: number) => Promise<{ success: boolean; message: string }>;
  removeCompra: (id: number) => Promise<{ success: boolean; message: string }>;
  getDetalleCompra: (id: number) => Promise<{ success: boolean; data?: Compra; message?: string }>;
  addDetalle: (id: number, data: { concepto: string; cantidad: number; valorUnitario: number }) => Promise<{ success: boolean; message: string }>;
  removeDetalle: (id: number, nroLinea: number) => Promise<{ success: boolean; message: string }>;
}

export function useCompras(): UseComprasResult {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompras = useCallback(async (filtros: { estado?: string; idProveedor?: string | number; search?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await compraService.getAll(filtros);
      if (response.success) {
        setCompras(response.data || []);
      } else {
        setError(response.message || 'Error al cargar compras');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar compras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompras(); }, [fetchCompras]);

  const createCompra = async (data: Partial<Compra>) => {
    try {
      const response = await compraService.create(data);
      if (response.success) {
        await fetchCompras();
        return { success: true, message: response.message || 'Compra registrada' };
      }
      return { success: false, message: response.message || 'Error al crear compra' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateCompra = async (id: number, data: Partial<Compra>) => {
    try {
      const response = await compraService.update(id, data);
      if (response.success) {
        await fetchCompras();
        return { success: true, message: response.message || 'Compra actualizada' };
      }
      return { success: false, message: response.message || 'Error al actualizar compra' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const aprobarCompra = async (id: number) => {
    try {
      const response = await compraService.aprobar(id);
      if (response.success) {
        await fetchCompras();
        return { success: true, message: response.message || 'Compra aprobada' };
      }
      return { success: false, message: response.message || 'Error al aprobar compra' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removeCompra = async (id: number) => {
    try {
      const response = await compraService.remove(id);
      if (response.success) {
        await fetchCompras();
        return { success: true, message: response.message || 'Compra eliminada' };
      }
      return { success: false, message: response.message || 'Error al eliminar compra' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const getDetalleCompra = async (id: number) => {
    try {
      const response = await compraService.getById(id);
      return response;
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const addDetalle = async (id: number, data: { concepto: string; cantidad: number; valorUnitario: number }) => {
    try {
      const response = await compraService.addDetalle(id, data);
      return { success: response.success, message: response.message || (response.success ? 'Línea agregada' : 'Error al agregar línea') };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removeDetalle = async (id: number, nroLinea: number) => {
    try {
      const response = await compraService.removeDetalle(id, nroLinea);
      return { success: response.success, message: response.message || (response.success ? 'Línea eliminada' : 'Error al eliminar línea') };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return {
    compras, loading, error, fetchCompras, createCompra, updateCompra,
    aprobarCompra, removeCompra, getDetalleCompra, addDetalle, removeDetalle,
  };
}
