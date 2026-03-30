import React from 'react';
import { FormField } from '../../types/crud';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';

interface EntityFormProps<T> {
  fields: FormField[];
  formData: Partial<T>;
  editingId: string | null;
  onChange: <K extends keyof T>(field: K, value: T[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function EntityForm<T>({
  fields,
  formData,
  editingId,
  onChange,
  onSubmit,
  onCancel,
}: EntityFormProps<T>) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de campos requeridos
    const missingFields = fields
      .filter((f) => f.required && !formData[f.name as keyof T])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      alert(`Por favor completa los campos: ${missingFields.join(', ')}`);
      return;
    }

    onSubmit(e);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name as keyof T];

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={String(value || '')}
            onValueChange={(val) => onChange(field.name as keyof T, val as T[keyof T])}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecciona ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-md"
            value={String(value || '')}
            onChange={(e) => onChange(field.name as keyof T, e.target.value as T[keyof T])}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => 
                onChange(field.name as keyof T, checked as T[keyof T])
              }
            />
            <span className="ml-2 text-sm text-gray-600">{field.label}</span>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={String(value || '')}
            onChange={(e) => onChange(field.name as keyof T, e.target.value as T[keyof T])}
            required={field.required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={String(value || '')}
            onChange={(e) => 
              onChange(field.name as keyof T, Number(e.target.value) as T[keyof T])
            }
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={String(value || '')}
            onChange={(e) => onChange(field.name as keyof T, e.target.value as T[keyof T])}
            placeholder={field.placeholder}
            required={field.required}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );

      case 'tel':
        return (
          <Input
            type="tel"
            value={String(value || '')}
            onChange={(e) => onChange(field.name as keyof T, e.target.value as T[keyof T])}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      default: // text
        return (
          <Input
            type="text"
            value={String(value || '')}
            onChange={(e) => onChange(field.name as keyof T, e.target.value as T[keyof T])}
            placeholder={field.placeholder}
            required={field.required}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">
        {editingId ? 'Editar' : 'Crear'} Registro
      </h3>

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          {field.type !== 'checkbox' && (
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {renderField(field)}
        </div>
      ))}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          {editingId ? 'Actualizar' : 'Crear'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
