// Tipos genéricos para el sistema CRUD

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  type?: 'text' | 'badge' | 'status' | 'date' | 'currency' | 'action';
  badgeColors?: Record<string, string>;
  statusConfig?: Record<string, { color: string; label: string }>;
  format?: (value: unknown, item: T) => string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'date' | 'number' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  defaultValue?: unknown;
  placeholder?: string;
}

export interface EntityConfig<T> {
  entity: string;
  label: string;
  labelSingular: string;
  icon?: string;
  columns: ColumnDef<T>[];
  formFields: FormField[];
  searchConfig?: {
    placeholder?: string;
    fields: string[];
  };
}

export interface CrudState<T> {
  searchTerm: string;
  showForm: boolean;
  editingId: string | null;
  formData: Partial<T>;
  sortColumn: keyof T | null;
  sortDirection: 'asc' | 'desc';
}
