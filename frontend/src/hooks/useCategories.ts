import { useState, useCallback, useEffect } from 'react';
import { categoryService } from '../services/categoryService';

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: (search?: string) => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<{ success: boolean; message: string }>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<{ success: boolean; message: string }>;
  removeCategory: (id: number) => Promise<{ success: boolean; message: string }>;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getAll({ search });
      if (response.success) {
        setCategories(response.data || []);
      } else {
        setError(response.message || 'Error al cargar categorías');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const createCategory = async (data: Partial<Category>) => {
    try {
      const response = await categoryService.create(data);
      if (response.success) {
        await fetchCategories();
        return { success: true, message: response.message || 'Categoría creada' };
      }
      return { success: false, message: response.message || 'Error al crear categoría' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateCategory = async (id: number, data: Partial<Category>) => {
    try {
      const response = await categoryService.update(id, data);
      if (response.success) {
        await fetchCategories();
        return { success: true, message: response.message || 'Categoría actualizada' };
      }
      return { success: false, message: response.message || 'Error al actualizar categoría' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const removeCategory = async (id: number) => {
    try {
      const response = await categoryService.remove(id);
      if (response.success) {
        await fetchCategories();
        return { success: true, message: response.message || 'Categoría eliminada' };
      }
      return { success: false, message: response.message || 'Error al eliminar categoría' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return { categories, loading, error, fetchCategories, createCategory, updateCategory, removeCategory };
}
