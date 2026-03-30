import { EntityConfig } from '../../types/crud';
import { Member } from '../../types';

export const membersConfig: EntityConfig<Member> = {
  entity: 'members',
  label: 'Socios',
  labelSingular: 'Socio',
  icon: 'Users',

  columns: [
    { key: 'name', label: 'Nombre', sortable: true, searchable: true },
    { key: 'email', label: 'Email', sortable: true, searchable: true },
    { key: 'phone', label: 'Teléfono' },
    {
      key: 'membershipType',
      label: 'Membresía',
      type: 'badge',
      badgeColors: {
        'Completa': 'emerald',
        'Premium': 'purple',
        'Básica': 'blue',
        'Honoraria': 'gray',
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'status',
      statusConfig: {
        activo: { color: 'green', label: 'Activo' },
        inactivo: { color: 'gray', label: 'Inactivo' },
        suspendido: { color: 'red', label: 'Suspendido' },
      },
    },
  ],

  formFields: [
    {
      name: 'name',
      label: 'Nombre Completo',
      type: 'text',
      required: true,
      validation: { minLength: 2, maxLength: 100 },
    },
    {
      name: 'documento',
      label: 'Documento',
      type: 'text',
    },
    {
      name: 'tipoDocumento',
      label: 'Tipo de Documento',
      type: 'select',
      options: [
        { value: 'CC', label: 'Cédula de Ciudadanía' },
        { value: 'TI', label: 'Tarjeta de Identidad' },
        { value: 'CE', label: 'Cédula de Extranjería' },
        { value: 'PAS', label: 'Pasaporte' },
      ],
    },
    {
      name: 'email',
      label: 'Correo Electrónico',
      type: 'email',
    },
    {
      name: 'phone',
      label: 'Teléfono',
      type: 'tel',
    },
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'text',
    },
    {
      name: 'membershipType',
      label: 'Tipo de Membresía',
      type: 'select',
      options: [
        { value: 'Completa', label: 'Completa' },
        { value: 'Premium', label: 'Premium' },
        { value: 'Básica', label: 'Básica' },
        { value: 'Honoraria', label: 'Honoraria' },
      ],
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'suspendido', label: 'Suspendido' },
      ],
      defaultValue: 'activo',
    },
    {
      name: 'active',
      label: 'Activo en sistema',
      type: 'checkbox',
      defaultValue: true,
    },
  ],

  searchConfig: {
    placeholder: 'Buscar por nombre, email o documento...',
    fields: ['name', 'email', 'documento', 'phone'],
  },
};
