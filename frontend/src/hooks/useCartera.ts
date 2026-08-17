import { useState, useCallback, useEffect } from 'react';
import { carteraService } from '../services/carteraService';

export interface CarteraItem {
  id_cartera: number;
  id_socio: number;
  socio_nombre: string | null;
  socio_documento: string | null;
  id_pago_mensual: number | null;
  fecha: string;
  concepto: string;
  valor: string;
  estado: 'pendiente' | 'pagado' | 'anulado';
  fecha_pago: string | null;
  observaciones: string | null;
  created_at: string;
}

interface UseCarteraResult {
  cartera: CarteraItem[];
  loading: boolean;
  error: string | null;
  fetchCartera: (filtros?: { estado?: string; idSocio?: string | number; search?: string }) => Promise<void>;
  createCartera: (data: Partial<CarteraItem>) => Promise<{ success: boolean; message: string }>;
  updateCartera: (id: number, data: Partial<CarteraItem>) => Promise<{ success: boolean; message: string }>;
  removeCartera: (id: number) => Promise<{ success: boolean; message: string }>;
}

export function useCartera(): UseCarteraResult {
  const [cartera, setCartera] = useState<CarteraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCartera = useCallback(async (filtros: { estado?: string; idSocio?: string | number; search?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await carteraService.getAll(filtros);
      if (response.success) {
        setCartera(response.data || []);
      } else {
        setError(response.message || 'Error al cargar cartera');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar cartera');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCartera(); }, [fetchCartera]);

  const createCartera = async (data: Partial<CarteraItem>) => {
    try {
      const response = await carteraService.create(data);
      if (response.success) {
        await fetchCartera();
        return { success: true, message: response.message || 'Registro creado' };
      }
      return { success: false, message: response.message || 'Error al crear registro' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateCartera = async (id: number, data: Partial<CarteraItem>) => {
    try {
      const response = await carteraService.update(id, data);
      if (response.success) {
        await fetchCartera();
        return { success: true, message: response.message || 'Registro actualizado' };
      }
      return { success: false, message: response.message || 'Error al actualizar registro' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removeCartera = async (id: number) => {
    try {
      const response = await carteraService.remove(id);
      if (response.success) {
        await fetchCartera();
        return { success: true, message: response.message || 'Registro eliminado' };
      }
      return { success: false, message: response.message || 'Error al eliminar registro' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return { cartera, loading, error, fetchCartera, createCartera, updateCartera, removeCartera };
}
