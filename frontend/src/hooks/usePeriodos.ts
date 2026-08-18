import { useState, useCallback, useEffect } from 'react';
import { periodoService } from '../services/periodoService';

export interface PeriodoItem {
  id_periodo: number;
  anio: number;
  mes: number;
  nombre_mes: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  cerrado: boolean;
  fecha_cierre: string | null;
  observaciones: string | null;
  cerrado_by: number | null;
  total_ingresos: string;
  total_gastos: string;
  balance: string;
}

interface UsePeriodosResult {
  periodos: PeriodoItem[];
  loading: boolean;
  error: string | null;
  fetchPeriodos: (filtros?: { anio?: string | number }) => Promise<void>;
  createPeriodo: (data: Partial<PeriodoItem>) => Promise<{ success: boolean; message: string }>;
  updatePeriodo: (id: number, data: Partial<PeriodoItem>) => Promise<{ success: boolean; message: string }>;
  removePeriodo: (id: number) => Promise<{ success: boolean; message: string }>;
}

export function usePeriodos(): UsePeriodosResult {
  const [periodos, setPeriodos] = useState<PeriodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriodos = useCallback(async (filtros: { anio?: string | number } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await periodoService.getAll(filtros);
      if (response.success) {
        setPeriodos(response.data || []);
      } else {
        setError(response.message || 'Error al cargar periodos');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar periodos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPeriodos(); }, [fetchPeriodos]);

  const createPeriodo = async (data: Partial<PeriodoItem>) => {
    try {
      const response = await periodoService.create(data);
      if (response.success) {
        await fetchPeriodos();
        return { success: true, message: response.message || 'Periodo creado' };
      }
      return { success: false, message: response.message || 'Error al crear periodo' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updatePeriodo = async (id: number, data: Partial<PeriodoItem>) => {
    try {
      const response = await periodoService.update(id, data);
      if (response.success) {
        await fetchPeriodos();
        return { success: true, message: response.message || 'Periodo actualizado' };
      }
      return { success: false, message: response.message || 'Error al actualizar periodo' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removePeriodo = async (id: number) => {
    try {
      const response = await periodoService.remove(id);
      if (response.success) {
        await fetchPeriodos();
        return { success: true, message: response.message || 'Periodo eliminado' };
      }
      return { success: false, message: response.message || 'Error al eliminar periodo' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return { periodos, loading, error, fetchPeriodos, createPeriodo, updatePeriodo, removePeriodo };
}
