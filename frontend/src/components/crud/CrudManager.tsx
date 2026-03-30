import React from 'react';
import { EntityConfig } from '../../types/crud';
import { useData } from '../../contexts/DataContext';
import { useCrudState } from '../../hooks/useCrudState';
import { EntityForm } from './EntityForm';
import { EntityTable } from './EntityTable';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { AppData } from '../../types';

interface CrudManagerProps<T extends { id: string }> {
  config: EntityConfig<T>;
}

export function CrudManager<T extends { id: string }>({ config }: CrudManagerProps<T>) {
  const ctx = useData();
  
  // Acceder a los datos directamente desde el contexto (que extiende AppData)
  const entityItems = (ctx as unknown as Record<string, T[]>)[config.entity] || [];
  
  // Funciones CRUD para esta entidad
  const handleCreate = (item: Omit<T, 'id'>) => ctx.create(config.entity as keyof AppData, item as unknown as Record<string, unknown>);
  const handleUpdate = (id: string, item: Partial<T>) => ctx.update(config.entity as keyof AppData, id, item as unknown as Record<string, unknown>);
  const handleDelete = (id: string) => ctx.remove(config.entity as keyof AppData, id);

  // Obtener valores iniciales para el formulario
  const getInitialFormData = (): Partial<T> => {
    const initial: Record<string, unknown> = {};
    config.formFields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      } else if (field.type === 'checkbox') {
        initial[field.name] = false;
      } else if (field.type === 'number') {
        initial[field.name] = 0;
      } else {
        initial[field.name] = '';
      }
    });
    return initial as Partial<T>;
  };

  const {
    searchTerm,
    showForm,
    editingId,
    formData,
    sortColumn,
    sortDirection,
    setSearchTerm,
    openCreateForm,
    openEditForm,
    closeForm,
    updateFormField,
    setSortColumn,
  } = useCrudState<T>(getInitialFormData());

  // Filtrar datos según búsqueda
  const filteredItems = React.useMemo(() => {
    if (!searchTerm || !config.searchConfig?.fields.length) return entityItems;
    
    const lowerQuery = searchTerm.toLowerCase();
    return entityItems.filter((item: T) =>
      config.searchConfig!.fields.some((field) => {
        const value = item[field as keyof T];
        return value && String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }, [entityItems, searchTerm, config.searchConfig?.fields]);

  // Handler para submit del formulario
  const handleSubmit = () => {
    if (editingId) {
      handleUpdate(editingId, formData);
      alert('Registro actualizado correctamente');
    } else {
      handleCreate(formData as Omit<T, 'id'>);
      alert('Registro creado correctamente');
    }
    closeForm();
  };

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y botón crear */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800">{config.label}</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder={config.searchConfig?.placeholder || 'Buscar...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button
            onClick={openCreateForm}
            className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
          >
            + Nuevo {config.labelSingular}
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <EntityTable
          data={filteredItems}
          columns={config.columns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={setSortColumn}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal de formulario */}
      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? `Editar ${config.labelSingular}` : `Crear ${config.labelSingular}`}
            </DialogTitle>
          </DialogHeader>
          <EntityForm
            fields={config.formFields}
            formData={formData}
            editingId={editingId}
            onChange={updateFormField}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
