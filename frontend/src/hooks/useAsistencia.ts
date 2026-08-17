import { useState, useCallback, useEffect } from 'react';
import { asistenciaService } from '../services/asistenciaService';

export interface AsistenciaItem {
  id_asistencia: number;
  id_socio: number;
  socio_nombre: string | null;
  socio_documento: string | null;
  fecha: string;
  tipo_entrenamiento: string | null;
  estado: 'Presente' | 'Ausente' | 'Justificado' | 'Tarde';
  observacion: string | null;
  registrado_by: number | null;
  created_at: string;
}

export interface AlertaAsistencia {
  idSocio: number;
  socioNombre: string;
  inasistenciasAcumuladas: number;
  inasistenciasConsecutivas: number;
  motivo: 'consecutiva' | 'acumulada';
}

interface UseAsistenciaResult {
  asistencia: AsistenciaItem[];
  alertas: AlertaAsistencia[];
  loading: boolean;
  error: string | null;
  fetchAsistencia: (filtros?: { idSocio?: string | number; estado?: string; fechaInicio?: string; fechaFin?: string }) => Promise<void>;
  fetchAlertas: () => Promise<void>;
  createAsistencia: (data: Partial<AsistenciaItem>) => Promise<{ success: boolean; message: string }>;
  updateAsistencia: (id: number, data: Partial<AsistenciaItem>) => Promise<{ success: boolean; message: string }>;
  removeAsistencia: (id: number) => Promise<{ success: boolean; message: string }>;
}

export function useAsistencia(): UseAsistenciaResult {
  const [asistencia, setAsistencia] = useState<AsistenciaItem[]>([]);
  const [alertas, setAlertas] = useState<AlertaAsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAsistencia = useCallback(async (filtros: { idSocio?: string | number; estado?: string; fechaInicio?: string; fechaFin?: string } = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await asistenciaService.getAll(filtros);
      if (response.success) {
        setAsistencia(response.data || []);
      } else {
        setError(response.message || 'Error al cargar asistencia');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar asistencia');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlertas = useCallback(async () => {
    try {
      const response = await asistenciaService.getAlertas();
      if (response.success) setAlertas(response.data || []);
    } catch {
      // silencioso: no bloquea el listado principal
    }
  }, []);

  useEffect(() => { fetchAsistencia(); fetchAlertas(); }, [fetchAsistencia, fetchAlertas]);

  const createAsistencia = async (data: Partial<AsistenciaItem>) => {
    try {
      const response = await asistenciaService.create(data);
      if (response.success) {
        await fetchAsistencia();
        await fetchAlertas();
        return { success: true, message: response.message || 'Asistencia registrada' };
      }
      return { success: false, message: response.message || 'Error al registrar asistencia' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateAsistencia = async (id: number, data: Partial<AsistenciaItem>) => {
    try {
      const response = await asistenciaService.update(id, data);
      if (response.success) {
        await fetchAsistencia();
        await fetchAlertas();
        return { success: true, message: response.message || 'Asistencia actualizada' };
      }
      return { success: false, message: response.message || 'Error al actualizar asistencia' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removeAsistencia = async (id: number) => {
    try {
      const response = await asistenciaService.remove(id);
      if (response.success) {
        await fetchAsistencia();
        await fetchAlertas();
        return { success: true, message: response.message || 'Asistencia eliminada' };
      }
      return { success: false, message: response.message || 'Error al eliminar asistencia' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return { asistencia, alertas, loading, error, fetchAsistencia, fetchAlertas, createAsistencia, updateAsistencia, removeAsistencia };
}
