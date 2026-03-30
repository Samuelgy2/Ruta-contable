import React from 'react';
import { ColumnDef } from '../../types/crud';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDateShort } from '../../utils/format';

interface EntityTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  sortColumn: keyof T | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: keyof T) => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
}

export function EntityTable<T extends { id: string }>({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}: EntityTableProps<T>) {
  // Ordenar datos si hay columna seleccionada
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const renderCell = (item: T, column: ColumnDef<T>) => {
    const value = item[column.key as keyof T];
    
    if (column.format) {
      return column.format(value, item);
    }

    switch (column.type) {
      case 'badge':
        const color = column.badgeColors?.[String(value)] || 'gray';
        return (
          <Badge 
            className={`${
              color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
              color === 'green' ? 'bg-green-100 text-green-800' :
              color === 'blue' ? 'bg-blue-100 text-blue-800' :
              color === 'purple' ? 'bg-purple-100 text-purple-800' :
              color === 'gray' ? 'bg-gray-100 text-gray-800' :
              color === 'red' ? 'bg-red-100 text-red-800' :
              color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {String(value)}
          </Badge>
        );

      case 'status':
        const status = column.statusConfig?.[String(value)];
        return status ? (
          <Badge 
            className={`${
              status.color === 'green' ? 'bg-green-100 text-green-800' :
              status.color === 'red' ? 'bg-red-100 text-red-800' :
              status.color === 'gray' ? 'bg-gray-100 text-gray-800' :
              status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {status.label}
          </Badge>
        ) : (
          String(value || '-')
        );

      case 'date':
        return value ? formatDateShort(String(value)) : '-';

      case 'currency':
        return value ? (
          <span className="font-medium">${Number(value).toLocaleString()}</span>
        ) : '-';

      default:
        return String(value || '-');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => column.sortable && onSort(column.key as keyof T)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && sortColumn === column.key && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                No hay registros
              </td>
            </tr>
          ) : (
            sortedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3 text-sm">
                    {renderCell(item, column)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('¿Eliminar este registro?')) {
                        onDelete(item.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
