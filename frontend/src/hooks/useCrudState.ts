import { useState, useCallback } from 'react';
import { CrudState } from '../types/crud';

export function useCrudState<T extends object>(initialFormData: Partial<T>) {
  const [state, setState] = useState<CrudState<T>>({
    searchTerm: '',
    showForm: false,
    editingId: null,
    formData: initialFormData,
    sortColumn: null,
    sortDirection: 'asc',
  });

  const setSearchTerm = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const openCreateForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showForm: true,
      editingId: null,
      formData: initialFormData,
    }));
  }, [initialFormData]);

  const openEditForm = useCallback((item: T & { id: string }) => {
    setState((prev) => ({
      ...prev,
      showForm: true,
      editingId: item.id,
      formData: { ...item },
    }));
  }, []);

  const closeForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showForm: false,
      editingId: null,
      formData: initialFormData,
    }));
  }, [initialFormData]);

  const updateFormField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
    }));
  }, []);

  const setSortColumn = useCallback((column: keyof T) => {
    setState((prev) => ({
      ...prev,
      sortColumn: column,
      sortDirection:
        prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  return {
    ...state,
    setSearchTerm,
    openCreateForm,
    openEditForm,
    closeForm,
    updateFormField,
    setSortColumn,
  };
}
