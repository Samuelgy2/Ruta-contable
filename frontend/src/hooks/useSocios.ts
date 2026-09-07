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
  nivel_aprendizaje: string | null;
  estado: 'activo' | 'inactivo' | 'suspendido';
  foto: string | null;
  observaciones: string | null;
  // Cuenta de acceso enlazada por socio_perfil.id_socio; null si no hay.
  usuarioVinculado: { id: number; username: string; email: string } | null;
}

type Resultado = { success: boolean; message: string; status?: number };

interface UseSociosResult {
  socios: Socio[];
  loading: boolean;
  error: string | null;
  fetchSocios: (search?: string) => Promise<void>;
  createSocio: (socioData: Partial<Socio>) => Promise<Resultado>;
  updateSocio: (id: number, socioData: Partial<Socio>) => Promise<Resultado>;
  deleteSocio: (id: number) => Promise<Resultado>;
  vincularUsuario: (idSocio: number, userId: number) => Promise<Resultado>;
  desvincularUsuario: (idSocio: number) => Promise<Resultado>;
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

  // No recargan la lista: la vista decide cuándo refrescar (también debe
  // refrescar el desplegable de usuarios sin socio).
  const vincularUsuario = async (idSocio: number, userId: number): Promise<Resultado> => {
    try {
      const response = await socioService.vincularUsuario(idSocio, userId);
      return { success: !!response.success, message: response.message || 'Usuario vinculado' };
    } catch (err: any) {
      return {
        success: false,
        status: err.response?.status,
        message: err.response?.data?.message || err.message || 'Error al vincular usuario',
      };
    }
  };

  const desvincularUsuario = async (idSocio: number): Promise<Resultado> => {
    try {
      const response = await socioService.desvincularUsuario(idSocio);
      return { success: !!response.success, message: response.message || 'Usuario desvinculado' };
    } catch (err: any) {
      return {
        success: false,
        status: err.response?.status,
        message: err.response?.data?.message || err.message || 'Error al desvincular usuario',
      };
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
    vincularUsuario,
    desvincularUsuario,
  };
}
