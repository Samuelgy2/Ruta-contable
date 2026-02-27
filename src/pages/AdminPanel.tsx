import React, { useState } from 'react';
import { Header } from '../components/common/Header';
import { StatCard } from '../components/common/StatCard';
import { useData } from '../contexts/DataContext';
import { useStats } from '../hooks/useStats';
import { formatCurrency, formatDateShort } from '../utils/format';
import { exportToCSV, exportToJSON, exportTransactionsReport, exportMembersWithFees } from '../utils/export';
import { PasswordInput } from '../components/ui/password-input';

export function AdminPanel() {
  const {
    transactions,
    members,
    fees,
    categories,
    users,
    systemData,
    addUser,
    updateUser,
    deleteUser,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSystemData,
    resetAllData,
  } = useData();

  const stats = useStats(transactions, fees, members);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'categories' | 'data' | 'system'>('overview');
  
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    active: true,
  });

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    description: '',
    active: true,
  });

  // Gestión de Usuarios
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userForm.username || !userForm.password || !userForm.fullName || !userForm.email) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (editingUser) {
      updateUser(editingUser, userForm);
      setEditingUser(null);
      alert('Usuario actualizado correctamente');
    } else {
      addUser(userForm);
      alert('Usuario creado correctamente');
    }

    setUserForm({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'user',
      active: true,
    });
    setShowUserForm(false);
  };

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserForm({
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        active: user.active,
      });
      setEditingUser(userId);
      setShowUserForm(true);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      deleteUser(userId);
      alert('Usuario eliminado correctamente');
    }
  };

  // Gestión de Categorías
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

  // Exportaciones
  const handleExportTransactions = () => {
    const data = transactions.map(t => ({
      fecha: t.date,
      tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
      categoria: t.category,
      monto: t.amount,
      descripcion: t.description,
      creadoPor: t.createdBy,
    }));
    exportToCSV(data, `transacciones-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportMembers = () => {
    exportMembersWithFees(members, fees);
  };

  const handleExportReport = () => {
    exportTransactionsReport(transactions, systemData);
  };

  const handleExportAllData = () => {
    const data = {
      transactions,
      members,
      fees,
      categories,
      systemData,
      exportDate: new Date().toISOString(),
    };
    exportToJSON(data, `backup-completo-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleResetSystem = () => {
    if (confirm('¿ESTÁS COMPLETAMENTE SEGURO? Esta acción eliminará TODOS los datos y NO se puede deshacer.')) {
      if (confirm('Última confirmación: ¿Eliminar todos los datos del sistema?')) {
        resetAllData();
        alert('Sistema reiniciado correctamente');
      }
    }
  };

  return (
    <div className="app">
      <Header />
      
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Panel de Administrador</h1>
          <p style={{ color: 'var(--color-gray-600)' }}>Gestión completa del sistema</p>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <StatCard
            title="Balance Total"
            value={formatCurrency(stats.balance, systemData.currency)}
            className={stats.balance >= 0 ? 'positive' : 'negative'}
            description="Saldo actual del club"
          />
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(stats.monthlyIncome, systemData.currency)}
            className="positive"
            description="Total de ingresos"
          />
          <StatCard
            title="Gastos del Mes"
            value={formatCurrency(stats.monthlyExpense, systemData.currency)}
            className="negative"
            description="Total de gastos"
          />
          <StatCard
            title="Socios Activos"
            value={stats.activeMembers}
            className="neutral"
            description="Miembros registrados"
          />
        </div>

        {/* Tabs principales */}
        <div className="tabs">
          <div className="tab-nav">
            <button 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              📊 Resumen
            </button>
            <button 
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              👥 Usuarios
            </button>
            <button 
              className={activeTab === 'categories' ? 'active' : ''}
              onClick={() => setActiveTab('categories')}
            >
              🏷️ Categorías
            </button>
            <button 
              className={activeTab === 'data' ? 'active' : ''}
              onClick={() => setActiveTab('data')}
            >
              💼 Datos del Club
            </button>
            <button 
              className={activeTab === 'system' ? 'active' : ''}
              onClick={() => setActiveTab('system')}
            >
              ⚙️ Sistema
            </button>
          </div>

          <div className="tab-content">
            {/* Tab Resumen */}
            {activeTab === 'overview' && (
              <div className="admin-grid">
                <div className="admin-card">
                  <h3>Estadísticas Generales</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-gray-600)' }}>Total Transacciones</span>
                      <strong>{stats.totalTransactions}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-gray-600)' }}>Total Socios</span>
                      <strong>{stats.totalMembers}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-gray-600)' }}>Cuotas Pagadas</span>
                      <strong className="positive">{stats.paidFees}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--color-gray-600)' }}>Cuotas Pendientes</span>
                      <strong className="negative">{stats.pendingFees + stats.overdueFees}</strong>
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <h3>Información del Sistema</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Club</p>
                      <p style={{ margin: 0 }}>{systemData.clubName}</p>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Año Fiscal</p>
                      <p style={{ margin: 0 }}>{systemData.fiscalYear}</p>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Moneda</p>
                      <p style={{ margin: 0 }}>{systemData.currency}</p>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Usuarios Activos</p>
                      <p style={{ margin: 0 }}>{users.filter((u: { active: any; }) => u.active).length} de {users.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Usuarios */}
            {activeTab === 'users' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0 }}>Gestión de Usuarios</h3>
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({
                        username: '',
                        password: '',
                        fullName: '',
                        email: '',
                        role: 'user',
                        active: true,
                      });
                      setShowUserForm(!showUserForm);
                    }}
                    className="btn"
                  >
                    {showUserForm ? 'Cancelar' : '+ Nuevo Usuario'}
                  </button>
                </div>

                {showUserForm && (
                  <div className="card">
                    <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                    <form onSubmit={handleUserSubmit}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Nombre de Usuario</label>
                          <input
                            value={userForm.username}
                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                            placeholder="usuario123"
                          />
                        </div>
                        <div className="form-group">
                          <label>Contraseña</label>
                          <PasswordInput
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder="••••••"
                          />
                        </div>
                        <div className="form-group">
                          <label>Nombre Completo</label>
                          <input
                            value={userForm.fullName}
                            onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                            placeholder="Juan Pérez"
                          />
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            placeholder="usuario@email.com"
                          />
                        </div>
                        <div className="form-group">
                          <label>Rol</label>
                          <select
                            value={userForm.role}
                            onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'user' | 'admin' })}
                          >
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Estado</label>
                          <select
                            value={userForm.active ? 'true' : 'false'}
                            onChange={(e) => setUserForm({ ...userForm, active: e.target.value === 'true' })}
                          >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button type="submit" className="btn">
                          {editingUser ? 'Actualizar' : 'Crear'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setShowUserForm(false)}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="card">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th className="text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.fullName}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={user.role === 'admin' ? 'badge-active' : 'badge-pending'}>
                              {user.role === 'admin' ? 'Admin' : 'Usuario'}
                            </span>
                          </td>
                          <td>
                            <span className={user.active ? 'badge-active' : 'badge'}>
                              {user.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              className="btn-secondary btn-icon"
                              onClick={() => handleEditUser(user.id)}
                              style={{ marginRight: '8px' }}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-danger btn-icon"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Tab Categorías */}
            {activeTab === 'categories' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0 }}>Gestión de Categorías</h3>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({
                        name: '',
                        type: 'income',
                        description: '',
                        active: true,
                      });
                      setShowCategoryForm(!showCategoryForm);
                    }}
                    className="btn"
                  >
                    {showCategoryForm ? 'Cancelar' : '+ Nueva Categoría'}
                  </button>
                </div>
                
                {showCategoryForm && (
                  <div className="card">
                    <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                    <form onSubmit={handleCategorySubmit}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Nombre</label>
                          <input
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            placeholder="Nombre de la categoría"
                          />
                        </div>
                        <div className="form-group">
                          <label>Tipo</label>
                          <select
                            value={categoryForm.type}
                            onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as 'income' | 'expense' })}
                          >
                            <option value="income">Ingreso</option>
                            <option value="expense">Gasto</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Descripción</label>
                        <input
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          placeholder="Descripción de la categoría"
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={categoryForm.active}
                            onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })}
                          />
                          Activa
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="btn">
                          {editingCategory ? 'Actualizar' : 'Crear'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setShowCategoryForm(false)}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="admin-grid">
                  <div className="card">
                    <h3 className="positive">Categorías de Ingresos</h3>
                    {categories.filter(c => c.type === 'income').map(category => (
                      <div key={category.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--color-gray-50)',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <p style={{ margin: 0, marginBottom: '4px' }}>{category.name}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-gray-600)' }}>
                            {category.description}
                            {!category.active && <span style={{ marginLeft: '8px', color: '#ef4444' }}>(Inactiva)</span>}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-secondary btn-icon" onClick={() => handleEditCategory(category.id)}>✏️</button>
                          <button className="btn-danger btn-icon" onClick={() => handleDeleteCategory(category.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <h3 className="negative">Categorías de Gastos</h3>
                    {categories.filter(c => c.type === 'expense').map(category => (
                      <div key={category.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--color-gray-50)',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <p style={{ margin: 0, marginBottom: '4px' }}>{category.name}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-gray-600)' }}>
                            {category.description}
                            {!category.active && <span style={{ marginLeft: '8px', color: '#ef4444' }}>(Inactiva)</span>}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-secondary btn-icon" onClick={() => handleEditCategory(category.id)}>✏️</button>
                          <button className="btn-danger btn-icon" onClick={() => handleDeleteCategory(category.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Datos del Club */}
            {activeTab === 'data' && (
              <div>
                <h3>Información del Club</h3>
                <div className="card">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      alert('Datos del club actualizados correctamente');
                    }}
                  >
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Nombre del Club</label>
                        <input
                          value={systemData.clubName}
                          onChange={(e) => updateSystemData({ clubName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>RUT/ID Fiscal</label>
                        <input
                          value={systemData.taxId}
                          onChange={(e) => updateSystemData({ taxId: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Dirección</label>
                        <input
                          value={systemData.address}
                          onChange={(e) => updateSystemData({ address: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Teléfono</label>
                        <input
                          value={systemData.phone}
                          onChange={(e) => updateSystemData({ phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={systemData.email}
                          onChange={(e) => updateSystemData({ email: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Moneda</label>
                        <input
                          value={systemData.currency}
                          onChange={(e) => updateSystemData({ currency: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Año Fiscal</label>
                        <input
                          value={systemData.fiscalYear}
                          onChange={(e) => updateSystemData({ fiscalYear: e.target.value })}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn">
                      Guardar Cambios
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab Sistema */}
            {activeTab === 'system' && (
              <div>
                <div className="card">
                  <h3>Exportar Datos</h3>
                  <p style={{ color: 'var(--color-gray-600)', marginBottom: '24px' }}>
                    Descarga información del sistema en diferentes formatos
                  </p>
                  <div className="admin-grid">
                    <button onClick={handleExportTransactions} className="btn-secondary">
                      📥 Exportar Transacciones (CSV)
                    </button>
                    <button onClick={handleExportMembers} className="btn-secondary">
                      📥 Exportar Socios (CSV)
                    </button>
                    <button onClick={handleExportReport} className="btn-secondary">
                      📥 Exportar Reporte Financiero (TXT)
                    </button>
                    <button onClick={handleExportAllData} className="btn-secondary">
                      📥 Backup Completo (JSON)
                    </button>
                  </div>
                </div>

                <div className="card" style={{ borderColor: '#ef4444', background: '#fef2f2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '24px' }}>⚠️</span>
                    <h3 style={{ margin: 0, color: '#ef4444' }}>Zona Peligrosa</h3>
                  </div>
                  <p style={{ color: 'var(--color-gray-600)', marginBottom: '20px' }}>
                    Esta acción eliminará todos los datos del sistema y restaurará los valores iniciales.
                    Esta acción no se puede deshacer.
                  </p>
                  <button onClick={handleResetSystem} className="btn-danger">
                    ⚠️ Reiniciar Sistema
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
