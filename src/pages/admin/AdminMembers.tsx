  import React, { useState } from 'react';
  import { useData } from '../../contexts/DataContext';
  import { formatDateShort } from '../../utils/format';
  import { Member, User } from '../../types';
  import { PasswordInput } from '../../components/ui/password-input';

  interface AdminMembersProps {
    onNavigate?: (tab: string) => void;
  }

  // Color verde del club
  const CLUB_GREEN = '#10b981';

  export function AdminMembers({ onNavigate }: AdminMembersProps) {
    const { members, fees, users, addMember, updateMember, deleteMember, addUser, updateUser, deleteUser } = useData();
    const [activeTab, setActiveTab] = useState<'members' | 'users'>('members');
    const [searchTerm, setSearchTerm] = useState('');
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [editingMember, setEditingMember] = useState<string | null>(null);
    const [memberForm, setMemberForm] = useState({
      name: '',
      email: '',
      phone: '',
      joinDate: new Date().toISOString().split('T')[0],
      active: true,
      membershipType: '',
    });

    // Estado para gestión de usuarios (igual que en AdminUsers)
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

    const handleNavigate = (tab: string) => {
      if (onNavigate) {
        onNavigate(tab);
      }
    };

    const filteredMembers = members.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getMemberFees = (memberId: string) => {
      return fees.filter(f => f.memberId === memberId);
    };

    const getMemberFeeStatus = (memberId: string) => {
      const memberFees = getMemberFees(memberId);
      const hasUnpaid = memberFees.some(f => f.status === 'pending' || f.status === 'overdue');
      return hasUnpaid ? 'pending' : 'paid';
    };

    // CRUD de Miembros
    const handleMemberSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!memberForm.name || !memberForm.email || !memberForm.phone) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }

      if (editingMember) {
        updateMember(editingMember, memberForm);
        setEditingMember(null);
        alert('Miembro actualizado correctamente');
      } else {
        addMember(memberForm);
        alert('Miembro creado correctamente');
      }

      setMemberForm({
        name: '',
        email: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        active: true,
        membershipType: '',
      });
      setShowMemberForm(false);
    };

    const handleEditMember = (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      if (member) {
        setMemberForm({
          name: member.name,
          email: member.email,
          phone: member.phone,
          joinDate: member.joinDate,
          active: member.active,
          membershipType: member.membershipType,
        });
        setEditingMember(memberId);
        setShowMemberForm(true);
      }
    };

    const handleDeleteMember = (memberId: string) => {
      if (confirm('¿Estás seguro de eliminar este miembro?')) {
        deleteMember(memberId);
        alert('Miembro eliminado correctamente');
      }
    };

    // Funciones para gestión de usuarios (igual que en AdminUsers)
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

    // Filtrar usuarios
    const filteredUsers = users.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="app">
        <div className="container">
          {/* Tabs para cambiar entre Miembros y Usuarios */}
          <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setActiveTab('members');
                setSearchTerm('');
                setShowMemberForm(false);
                setShowUserForm(false);
              }}
              style={{
                backgroundColor: activeTab === 'members' ? CLUB_GREEN : '#f3f4f6',
                color: activeTab === 'members' ? 'white' : '#374151',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Miembros
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                setSearchTerm('');
                setShowMemberForm(false);
                setShowUserForm(false);
              }}
              style={{
                backgroundColor: activeTab === 'users' ? CLUB_GREEN : '#f3f4f6',
                color: activeTab === 'users' ? 'white' : '#374151',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Usuarios del Sistema
            </button>
          </div>

          {activeTab === 'members' ? (
            <>
              {/* --- Members Section (unchanged) --- */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                  Gestión de Miembros
                </h3>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  {members.length} miembros registrados en el sistema
                </p>
              </div>

              {/* Buscador */}
              <div style={{ marginBottom: '24px' }}>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    maxWidth: '400px',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Botón para mostrar formulario de miembro */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => {
                    setEditingMember(null);
                    setMemberForm({
                      name: '',
                      email: '',
                      phone: '',
                      joinDate: new Date().toISOString().split('T')[0],
                      active: true,
                      membershipType: '',
                    });
                    setShowMemberForm(!showMemberForm);
                  }}
                  style={{
                    backgroundColor: CLUB_GREEN,
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {showMemberForm ? 'Cancelar' : '+ Nuevo Miembro'}
                </button>
              </div>

              {/* Formulario de miembro */}
              {showMemberForm && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  marginBottom: '24px',
                  maxWidth: '800px'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937' }}>
                    {editingMember ? 'Editar Miembro' : 'Nuevo Miembro'}
                  </h3>
                  <form onSubmit={handleMemberSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Nombre Completo *
                        </label>
                        <input
                          value={memberForm.name}
                          onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                          placeholder="Juan Pérez"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Cédula/Número de Identificación *
                        </label>
                        <input
                          value={memberForm.membershipType}
                          onChange={(e) => setMemberForm({ ...memberForm, membershipType: e.target.value })}
                          placeholder="123456789"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Email *
                        </label>
                        <input
                          type="email"
                          value={memberForm.email}
                          onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                          placeholder="juan@email.com"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Teléfono *
                        </label>
                        <input
                          value={memberForm.phone}
                          onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                          placeholder="3001234567"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Fecha de Ingreso
                        </label>
                        <input
                          type="date"
                          value={memberForm.joinDate}
                          onChange={(e) => setMemberForm({ ...memberForm, joinDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Estado
                        </label>
                        <select
                          value={memberForm.active ? 'true' : 'false'}
                          onChange={(e) => setMemberForm({ ...memberForm, active: e.target.value === 'true' })}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        type="submit"
                        style={{
                          backgroundColor: CLUB_GREEN,
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        {editingMember ? 'Actualizar' : 'Crear'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowMemberForm(false)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabla de miembros */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                maxWidth: '1000px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Cédula</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Nombre</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Teléfono</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Fecha Registro</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Estado</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                          No hay miembros que mostrar
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => {
                        const feeStatus = getMemberFeeStatus(member.id);
                        return (
                          <tr key={member.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', color: '#1f2937' }}>{member.membershipType}</td>
                            <td style={{ padding: '12px', color: '#1f2937' }}>{member.name}</td>
                            <td style={{ padding: '12px', color: '#1f2937' }}>{member.email}</td>
                            <td style={{ padding: '12px', color: '#1f2937' }}>{member.phone}</td>
                            <td style={{ padding: '12px', color: '#1f2937' }}>{formatDateShort(member.joinDate)}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '9999px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: feeStatus === 'paid' ? '#d1fae5' : '#fef3c7',
                                color: feeStatus === 'paid' ? '#065f46' : '#92400e'
                              }}>
                                {feeStatus === 'paid' ? 'Al día' : 'Pendiente'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleEditMember(member.id)}
                                style={{
                                  backgroundColor: '#f3f4f6',
                                  border: 'none',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  marginRight: '8px'
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                style={{
                                  backgroundColor: '#fee2e2',
                                  border: 'none',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            // ===== USUARIOS SECTION =====
            <>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                  Gestión de Usuarios del Sistema
                </h3>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  {users.length} usuarios registrados en el sistema
                </p>
              </div>

              {/* Buscador */}
              <div style={{ marginBottom: '24px' }}>
                <input 
                  type="text" 
                  placeholder="Buscar por usuario, nombre o email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    maxWidth: '400px',
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Botón para mostrar formulario de usuario */}
              <div style={{ marginBottom: '24px' }}>
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
                  style={{
                    backgroundColor: CLUB_GREEN,
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {showUserForm ? 'Cancelar' : '+ Nuevo Usuario'}
                </button>
              </div>

              {/* Formulario de usuario */}
              {showUserForm && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  marginBottom: '24px',
                  maxWidth: '800px'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937' }}>
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </h3>
                  <form onSubmit={handleUserSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Usuario *
                        </label>
                        <input
                          type="text"
                          value={userForm.username}
                          onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                          placeholder="Nombre de usuario"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Contraseña *
                        </label>
                        <PasswordInput
                          value={userForm.password}
                          onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          placeholder={editingUser ? 'Dejar vacío para mantener' : 'Contraseña'}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          required={!editingUser}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          value={userForm.fullName}
                          onChange={(e) => setUserForm({...userForm, fullName: e.target.value})}
                          placeholder="Nombre completo"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Email *
                        </label>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                          placeholder="correo@ejemplo.com"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Rol
                        </label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm({...userForm, role: e.target.value as 'user' | 'admin'})}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'white'
                          }}
                          required
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                          Estado
                        </label>
                        <select
                          value={userForm.active ? 'true' : 'false'}
                          onChange={(e) => setUserForm({...userForm, active: e.target.value === 'true'})}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'white'
                          }}
                          required
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        type="submit"
                        style={{
                          backgroundColor: CLUB_GREEN,
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        {editingUser ? 'Actualizar' : 'Crear'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowUserForm(false)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabla de usuarios */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                maxWidth: '1000px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Usuario</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Nombre Completo</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Rol</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Estado</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                          No hay usuarios que mostrar
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px', color: '#1f2937' }}>{user.username}</td>
                          <td style={{ padding: '12px', color: '#1f2937' }}>{user.fullName}</td>
                          <td style={{ padding: '12px', color: '#1f2937' }}>{user.email}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: user.role === 'admin' ? '#fef3c7' : '#dbeafe',
                              color: user.role === 'admin' ? '#92400e' : '#1e40af'
                            }}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: user.active ? '#d1fae5' : '#fee2e2',
                              color: user.active ? '#065f46' : '#991b1b'
                            }}>
                              {user.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleEditUser(user.id)}
                              style={{
                                backgroundColor: '#f3f4f6',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginRight: '8px'
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              style={{
                                backgroundColor: '#fee2e2',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️
                            </button>
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