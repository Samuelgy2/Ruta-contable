import { useState, useCallback, useEffect, useRef } from 'react';
import { pagoMensualService } from '../services/pagoMensualService';

export interface PagoMensualFiltros {
  estado?: string;
  idSocio?: string | number;
  idPeriodo?: string | number;
  search?: string;
}

export interface PagoMensualItem {
  id_pago: number;
  id_socio: number;
  socio_nombre: string | null;
  socio_documento: string | null;
  id_periodo: number;
  nombre_mes: string | null;
  anio: number | null;
  valor: string;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estado: 'pendiente' | 'pagado' | 'moroso' | 'exento' | 'cancelado';
  id_transaccion: number | null;
  dias_mora: number;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePagosMensualesResult {
  pagosMensuales: PagoMensualItem[];
  loading: boolean;
  error: string | null;
  fetchPagosMensuales: (filtros?: PagoMensualFiltros) => Promise<void>;
  createPagoMensual: (data: Partial<PagoMensualItem>) => Promise<{ success: boolean; message: string }>;
  updatePagoMensual: (id: number, data: Partial<PagoMensualItem>) => Promise<{ success: boolean; message: string }>;
  removePagoMensual: (id: number) => Promise<{ success: boolean; message: string }>;
}

export function usePagosMensuales(): UsePagosMensualesResult {
  const [pagosMensuales, setPagosMensuales] = useState<PagoMensualItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Últimos filtros usados: tras crear/actualizar/eliminar se recarga con los
  // mismos filtros para que la vista no pierda su búsqueda ni su estado.
  const ultimosFiltros = useRef<PagoMensualFiltros>({});
  // Descarta respuestas de peticiones antiguas que lleguen después de una nueva.
  const requestId = useRef(0);

  const fetchPagosMensuales = useCallback(async (filtros: PagoMensualFiltros = ultimosFiltros.current) => {
    ultimosFiltros.current = filtros;
    const id = ++requestId.current;
    try {
      setLoading(true);
      setError(null);
      const response = await pagoMensualService.getAll(filtros);
      if (id !== requestId.current) return;
      if (response.success) {
        setPagosMensuales(response.data || []);
      } else {
        setError(response.message || 'Error al cargar pagos mensuales');
      }
    } catch (err: any) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || err.message || 'Error al cargar pagos mensuales');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPagosMensuales(); }, [fetchPagosMensuales]);

  const createPagoMensual = async (data: Partial<PagoMensualItem>) => {
    try {
      const response = await pagoMensualService.create(data);
      if (response.success) {
        await fetchPagosMensuales();
        return { success: true, message: response.message || 'Pago mensual creado' };
      }
      return { success: false, message: response.message || 'Error al crear pago mensual' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updatePagoMensual = async (id: number, data: Partial<PagoMensualItem>) => {
    try {
      const response = await pagoMensualService.update(id, data);
      if (response.success) {
        await fetchPagosMensuales();
        return { success: true, message: response.message || 'Pago mensual actualizado' };
      }
      return { success: false, message: response.message || 'Error al actualizar pago mensual' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removePagoMensual = async (id: number) => {
    try {
      const response = await pagoMensualService.remove(id);
      if (response.success) {
        await fetchPagosMensuales();
        return { success: true, message: response.message || 'Pago mensual eliminado' };
      }
      return { success: false, message: response.message || 'Error al eliminar pago mensual' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return { pagosMensuales, loading, error, fetchPagosMensuales, createPagoMensual, updatePagoMensual, removePagoMensual };
}
