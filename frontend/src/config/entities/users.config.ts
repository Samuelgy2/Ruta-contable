import { EntityConfig } from '../../types/crud';
import { User } from '../../types';

export const usersConfig: EntityConfig<User> = {
  entity: 'users',
  label: 'Usuarios',
  labelSingular: 'Usuario',
  icon: 'Users',

  columns: [
    { key: 'username', label: 'Usuario', sortable: true, searchable: true },
    { key: 'fullName', label: 'Nombre Completo', sortable: true, searchable: true },
    { key: 'email', label: 'Email', sortable: true, searchable: true },
    {
      key: 'role',
      label: 'Rol',
      type: 'badge',
      badgeColors: {
        admin: 'purple',
        tesorero: 'blue',
        secretaria: 'emerald',
        entrenador: 'yellow',
        user: 'gray',
      },
    },
    {
      key: 'active',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        'true': 'green',
        'false': 'red',
      },
    },
  ],

  formFields: [
    {
      name: 'username',
      label: 'Nombre de Usuario',
      type: 'text',
      required: true,
    },
    {
      name: 'password',
      label: 'Contraseña',
      type: 'text',
      required: true,
    },
    {
      name: 'fullName',
      label: 'Nombre Completo',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Correo Electrónico',
      type: 'email',
      required: true,
    },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Administrador' },
        { value: 'tesorero', label: 'Tesorero' },
        { value: 'secretario', label: 'Secretario' },
        { value: 'entrenador', label: 'Entrenador' },
        { value: 'user', label: 'Usuario' },
      ],
    },
    {
      name: 'active',
      label: 'Usuario Activo',
      type: 'checkbox',
      defaultValue: true,
    },
  ],

  searchConfig: {
    placeholder: 'Buscar por nombre de usuario o email...',
    fields: ['username', 'fullName', 'email'],
  },
};
