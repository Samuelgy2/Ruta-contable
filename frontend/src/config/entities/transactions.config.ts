import { EntityConfig } from '../../types/crud';
import { Transaction } from '../../types';

export const transactionsConfig: EntityConfig<Transaction> = {
  entity: 'transactions',
  label: 'Transacciones',
  labelSingular: 'Transacción',
  icon: 'DollarSign',

  columns: [
    { key: 'date', label: 'Fecha', sortable: true, type: 'date' },
    {
      key: 'type',
      label: 'Tipo',
      type: 'badge',
      badgeColors: {
        income: 'green',
        expense: 'red',
      },
    },
    { key: 'description', label: 'Descripción', searchable: true },
    { key: 'category', label: 'Categoría' },
    { key: 'amount', label: 'Monto', type: 'currency', sortable: true },
    {
      key: 'metodoPago',
      label: 'Método',
      badgeColors: {
        efectivo: 'blue',
        transferencia: 'purple',
        tarjeta: 'yellow',
        cheque: 'gray',
      },
    },
  ],

  formFields: [
    {
      name: 'date',
      label: 'Fecha',
      type: 'date',
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
      required: true,
    },
    {
      name: 'category',
      label: 'Categoría',
      type: 'text',
    },
    {
      name: 'amount',
      label: 'Monto',
      type: 'number',
      required: true,
      validation: { min: 0 },
    },
    {
      name: 'metodoPago',
      label: 'Método de Pago',
      type: 'select',
      options: [
        { value: 'efectivo', label: 'Efectivo' },
        { value: 'transferencia', label: 'Transferencia' },
        { value: 'tarjeta', label: 'Tarjeta' },
        { value: 'cheque', label: 'Cheque' },
      ],
    },
    {
      name: 'referencia',
      label: 'Referencia',
      type: 'text',
    },
    {
      name: 'createdBy',
      label: 'Creado Por',
      type: 'text',
    },
  ],

  searchConfig: {
    placeholder: 'Buscar por descripción o categoría...',
    fields: ['description', 'category', 'referencia'],
  },
};
