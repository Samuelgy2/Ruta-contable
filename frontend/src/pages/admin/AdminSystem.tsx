import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { PasswordInput } from '../../components/ui/password-input';
import { exportToJSON } from '../../utils/export';
import { UserRole } from '../../types';

interface AdminSystemProps {
  onNavigate?: (tab: string) => void;
}

export function AdminSystem({ onNavigate }: AdminSystemProps) {
  const { transactions, members, fees, categories, systemData, users, addUser, updateUser, deleteUser, resetAllData } = useData();
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'users'>('system');
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'user' as UserRole,
    active: true,
  });

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

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

  const handleExportAllData = () => {
    const data = {
      transactions,
      members,
      fees,
      categories,
      systemData,
      users,
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
      <div className="container">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('system')}
            className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Sistema
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Usuarios
          </button>
        </div>

        {activeTab === 'system' ? (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: 0, marginBottom: '8px' }}>Configuración del Sistema</h3>
              <p style={{ color: 'var(--color-gray-600)', margin: 0 }}>
                Herramientas administrativas y mantenimiento del sistema
              </p>
            </div>

            <div className="admin-grid">
              {/* Información del sistema */}
              <div className="admin-card">
                <h3>Información del Sistema</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Transacciones</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{transactions.length}</p>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Miembros</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{members.length}</p>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Categorías</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{categories.length}</p>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Usuarios</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{users.length}</p>
                  </div>
                </div>
              </div>

              {/* Herramientas */}
              <div className="admin-card">
                <h3>Herramientas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    onClick={handleExportAllData}
                    className="btn btn-secondary"
                    style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    <span style={{ marginRight: '12px' }}>💾</span>
                    Exportar Backup Completo
                  </button>
                  <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', margin: 0 }}>
                    Descarga todos los datos del sistema en formato JSON
                  </p>
                </div>
              </div>

              {/* Peligro */}
              <div className="admin-card" style={{ border: '2px solid var(--color-red)', gridColumn: 'span 2' }}>
                <h3 style={{ color: 'var(--color-red)' }}>⚠️ Zona de Peligro</h3>
                <p style={{ color: 'var(--color-gray-600)', marginBottom: '16px' }}>
                  Las siguientes acciones son irreversibles. Procede con precaución.
                </p>
                <button 
                  onClick={handleResetSystem}
                  className="btn btn-danger"
                  style={{ width: '100%' }}
                >
                  🔄 Reiniciar Sistema
                </button>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginTop: '12px' }}>
                  Elimina todos los datos y restaura el sistema a su estado inicial. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Gestión de Usuarios</h3>
              <button 
                onClick={() => setShowUserForm(!showUserForm)}
                className="btn btn-primary"
              >
                {showUserForm ? 'Cancelar' : '+ Nuevo Usuario'}
              </button>
            </div>

            {showUserForm && (
              <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
                <h4>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
                <form onSubmit={handleUserSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Usuario</label>
                      <input 
                        type="text" 
                        value={userForm.username}
                        onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                        className="input"
                        placeholder="Nombre de usuario"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Contraseña</label>
                      <PasswordInput 
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        className="input"
                        placeholder="Contraseña"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Nombre Completo</label>
                      <input 
                        type="text" 
                        value={userForm.fullName}
                        onChange={(e) => setUserForm({...userForm, fullName: e.target.value})}
                        className="input"
                        placeholder="Nombre completo"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Email</label>
                      <input 
                        type="email" 
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        className="input"
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Rol</label>
                      <select 
                        value={userForm.role}
                        onChange={(e) => setUserForm({...userForm, role: e.target.value as 'user' | 'admin'})}
                        className="input"
                        required
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Estado</label>
                      <select 
                        value={userForm.active ? 'true' : 'false'}
                        onChange={(e) => setUserForm({...userForm, active: e.target.value === 'true'})}
                        className="input"
                        required
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </button>
                </form>
              </div>
            )}

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre Completo</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={user.role === 'admin' ? 'badge-warning' : 'badge-info'}>
                            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                          </span>
                        </td>
                        <td>
                          <span className={user.active ? 'badge-success' : 'badge-danger'}>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleEditUser(user.id)}
                              className="btn btn-sm btn-secondary"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="btn btn-sm btn-danger"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

