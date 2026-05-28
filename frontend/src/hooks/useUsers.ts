import { useState, useCallback, useEffect } from 'react';
import { userService } from '../services/userService';
import { UserRole } from '../types';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<{ success: boolean; message: string }>;
  updateUser: (id: number, userData: Partial<User>) => Promise<{ success: boolean; message: string }>;
  deleteUser: (id: number) => Promise<{ success: boolean; message: string }>;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAll();
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError(response.message || 'Error al cargar usuarios');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al cargar usuarios';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (userData: Partial<User>) => {
    try {
      const response = await userService.create(userData);
      if (response.success) {
        await fetchUsers();
        return { success: true, message: response.message || 'Usuario creado' };
      }
      return { success: false, message: response.message || 'Error al crear usuario' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateUser = async (id: number, userData: Partial<User>) => {
    try {
      const response = await userService.update(id.toString(), userData);
      if (response.success) {
        await fetchUsers();
        return { success: true, message: response.message || 'Usuario actualizado' };
      }
      return { success: false, message: response.message || 'Error al actualizar usuario' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const response = await userService.delete(id.toString());
      if (response.success) {
        await fetchUsers();
        return { success: true, message: response.message || 'Usuario eliminado' };
      }
      return { success: false, message: response.message || 'Error al eliminar usuario' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
