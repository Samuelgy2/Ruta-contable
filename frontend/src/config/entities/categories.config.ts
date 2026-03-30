import { EntityConfig } from '../../types/crud';
import { Category } from '../../types';

export const categoriesConfig: EntityConfig<Category> = {
  entity: 'categories',
  label: 'Categorías',
  labelSingular: 'Categoría',
  icon: 'Tags',

  columns: [
    { key: 'name', label: 'Nombre', sortable: true, searchable: true },
    {
      key: 'type',
      label: 'Tipo',
      type: 'badge',
      badgeColors: {
        income: 'emerald',
        expense: 'red',
      },
    },
    { key: 'description', label: 'Descripción' },
  ],

  formFields: [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'income', label: 'Ingreso' },
        { value: 'expense', label: 'Gasto' },
      ],
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
    },
    {
      name: 'active',
      label: 'Activa',
      type: 'checkbox',
      defaultValue: true,
    },
  ],

  searchConfig: {
    placeholder: 'Buscar categoría...',
    fields: ['name', 'description'],
  },
};
