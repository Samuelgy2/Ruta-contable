import { useState, useCallback, useEffect } from 'react';
import { clubDataService } from '../services/clubDataService';

export interface ClubData {
  id: number;
  club_nombre: string;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logo_url: string | null;
  moneda: string;
  dia_vencimiento_default: number | null;
  porcentaje_mora: string | null;
  created_at: string;
  updated_at: string | null;
}

interface UseClubDataResult {
  clubData: ClubData | null;
  loading: boolean;
  error: string | null;
  fetchClubData: () => Promise<void>;
  updateClubData: (data: Partial<ClubData>) => Promise<{ success: boolean; message: string }>;
}

export function useClubData(): UseClubDataResult {
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clubDataService.get();
      if (response.success) {
        setClubData(response.data);
      } else {
        setError(response.message || 'Error al cargar datos del club');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar datos del club');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClubData(); }, [fetchClubData]);

  const updateClubData = async (data: Partial<ClubData>) => {
    try {
      const response = await clubDataService.update(data);
      if (response.success) {
        await fetchClubData();
        return { success: true, message: response.message || 'Datos del club actualizados' };
      }
      return { success: false, message: response.message || 'Error al actualizar datos del club' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return { clubData, loading, error, fetchClubData, updateClubData };
}
