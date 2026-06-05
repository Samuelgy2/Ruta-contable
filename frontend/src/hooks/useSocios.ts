import { useState, useCallback, useEffect } from 'react';
import { socioService } from '../services/socioService';

interface Socio {
  id_socio: number;
  nombre: string;
  documento: string;
  tipo_documento: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string;
  fecha_ingreso: string;
  tipo_membresia: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  foto: string | null;
  observaciones: string | null;
}

interface UseSociosResult {
  socios: Socio[];
  loading: boolean;
  error: string | null;
  fetchSocios: (search?: string) => Promise<void>;
  createSocio: (socioData: Partial<Socio>) => Promise<{ success: boolean; message: string }>;
  updateSocio: (id: number, socioData: Partial<Socio>) => Promise<{ success: boolean; message: string }>;
  deleteSocio: (id: number) => Promise<{ success: boolean; message: string }>;
}

export function useSocios(): UseSociosResult {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSocios = useCallback(async (search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await socioService.getAll(search);
      if (response.success) {
        setSocios(response.data || []);
      } else {
        setError(response.message || 'Error al cargar socios');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al cargar socios';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocios();
  }, [fetchSocios]);

  const createSocio = async (socioData: Partial<Socio>) => {
    try {
      const response = await socioService.create(socioData);
      if (response.success) {
        await fetchSocios();
        return { success: true, message: response.message || 'Socio creado' };
      }
      return { success: false, message: response.message || 'Error al crear socio' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateSocio = async (id: number, socioData: Partial<Socio>) => {
    try {
      const response = await socioService.update(id.toString(), socioData);
      if (response.success) {
        await fetchSocios();
        return { success: true, message: response.message || 'Socio actualizado' };
      }
      return { success: false, message: response.message || 'Error al actualizar socio' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const deleteSocio = async (id: number) => {
    try {
      const response = await socioService.remove(id.toString());
      if (response.success) {
        await fetchSocios();
        return { success: true, message: response.message || 'Socio eliminado' };
      }
      return { success: false, message: response.message || 'Error al eliminar socio' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return {
    socios,
    loading,
    error,
    fetchSocios,
    createSocio,
    updateSocio,
    deleteSocio,
  };
}
