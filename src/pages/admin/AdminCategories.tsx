import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

interface AdminCategoriesProps {
  onNavigate?: (tab: string) => void;
}

export function AdminCategories({ onNavigate }: AdminCategoriesProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    description: '',
    active: true,
  });

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.name || !categoryForm.description) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory, categoryForm);
      setEditingCategory(null);
      alert('Categoría actualizada correctamente');
    } else {
      addCategory(categoryForm);
      alert('Categoría creada correctamente');
    }

    setCategoryForm({
      name: '',
      type: 'income',
      description: '',
      active: true,
    });
    setShowCategoryForm(false);
  };

  const handleEditCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setCategoryForm({
        name: category.name,
        type: category.type,
        description: category.description,
        active: category.active,
      });
      setEditingCategory(categoryId);
      setShowCategoryForm(true);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      deleteCategory(categoryId);
      alert('Categoría eliminada correctamente');
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="app">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Gestión de Categorías</h3>
          <button 
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="btn btn-primary"
          >
            {showCategoryForm ? 'Cancelar' : '+ Nueva Categoría'}
          </button>
        </div>

        {showCategoryForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h4>
            <form onSubmit={handleCategorySubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Nombre</label>
                  <input 
                    type="text" 
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="input"
                    placeholder="Nombre de la categoría"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Tipo</label>
                  <select 
                    value={categoryForm.type}
                    onChange={(e) => setCategoryForm({...categoryForm, type: e.target.value as 'income' | 'expense'})}
                    className="input"
                    required
                  >
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Descripción</label>
                <textarea 
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  className="input"
                  placeholder="Descripción de la categoría"
                  rows={3}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={categoryForm.active}
                    onChange={(e) => setCategoryForm({...categoryForm, active: e.target.checked})}
                  />
                  Categoría activa
                </label>
              </div>
              <button type="submit" className="btn btn-primary">
                {editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'}
              </button>
            </form>
          </div>
        )}

        <div className="admin-grid">
          <div className="admin-card">
            <h3>Categorías de Ingresos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {incomeCategories.length === 0 ? (
                <p style={{ color: 'var(--color-gray-600)', textAlign: 'center', padding: '16px' }}>
                  No hay categorías de ingresos
                </p>
              ) : (
                incomeCategories.map((category) => (
                  <div key={category.id} style={{ 
                    padding: '12px', 
                    background: category.active ? 'var(--color-gray-50)' : 'var(--color-gray-100)',
                    borderRadius: '8px',
                    opacity: category.active ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{category.name}</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-gray-600)' }}>
                          {category.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditCategory(category.id)}
                          className="btn btn-sm btn-secondary"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-card">
            <h3>Categorías de Gastos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {expenseCategories.length === 0 ? (
                <p style={{ color: 'var(--color-gray-600)', textAlign: 'center', padding: '16px' }}>
                  No hay categorías de gastos
                </p>
              ) : (
                expenseCategories.map((category) => (
                  <div key={category.id} style={{ 
                    padding: '12px', 
                    background: category.active ? 'var(--color-gray-50)' : 'var(--color-gray-100)',
                    borderRadius: '8px',
                    opacity: category.active ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{category.name}</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-gray-600)' }}>
                          {category.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditCategory(category.id)}
                          className="btn btn-sm btn-secondary"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
