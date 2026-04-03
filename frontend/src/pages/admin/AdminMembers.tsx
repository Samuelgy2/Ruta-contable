import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatDateShort } from '../../utils/format';
import { Member } from '../../types';

interface AdminMembersProps {
  onNavigate?: (tab: string) => void;
}

// Color verde del club
const CLUB_GREEN = '#10b981';

export function AdminMembers({ onNavigate }: AdminMembersProps) {
  const { members, fees, addMember, updateMember, deleteMember } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    documento: '',
    tipoDocumento: 'CC' as 'CC' | 'TI' | 'CE' | 'PAS',
    email: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    active: true,
    membershipType: '',
    estado: 'activo' as 'activo' | 'inactivo' | 'suspendido',
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
      
      if (!memberForm.name || !memberForm.documento || !memberForm.email || !memberForm.phone) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }

      if (editingMember) {
        updateMember(editingMember, memberForm);
        setEditingMember(null);
        alert('Socio actualizado correctamente');
      } else {
        addMember(memberForm);
        alert('Socio creado correctamente');
      }

      setMemberForm({
        name: '',
        documento: '',
        tipoDocumento: 'CC',
        email: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        active: true,
        membershipType: '',
        estado: 'activo',
      });
      setShowMemberForm(false);
    };

    const handleEditMember = (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      if (member) {
        setMemberForm({
          name: member.name,
          documento: member.documento || '',
          tipoDocumento: member.tipoDocumento || 'CC',
          email: member.email,
          phone: member.phone,
          joinDate: member.joinDate,
          active: member.active,
          membershipType: member.membershipType,
          estado: member.estado || 'activo',
        });
        setEditingMember(memberId);
        setShowMemberForm(true);
      }
    };

    const handleDeleteMember = (memberId: string) => {
      if (confirm('¿Estás seguro de eliminar este Socio?')) {
        deleteMember(memberId);
        alert('Socio eliminado correctamente');
      }
    };

    return (
      <div className="app">
        <div className="container">
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
              Gestión de Socios
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {members.length} Socios registrados en el sistema
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
                  documento: '',
                  tipoDocumento: 'CC',
                  email: '',
                  phone: '',
                  joinDate: new Date().toISOString().split('T')[0],
                  active: true,
                  membershipType: '',
                  estado: 'activo',
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
              {showMemberForm ? 'Cancelar' : '+ Nuevo Socio'}
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
                {editingMember ? 'Editar Socio' : 'Nuevo Socio'}
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
                      Tipo de Documento *
                    </label>
                    <select
                      value={memberForm.tipoDocumento}
                      onChange={(e) => setMemberForm({ ...memberForm, tipoDocumento: e.target.value as 'CC' | 'TI' | 'CE' | 'PAS' })}
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
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="TI">Tarjeta de Identidad</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="PAS">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Número de Identificación *
                    </label>
                    <input
                      value={memberForm.documento}
                      onChange={(e) => setMemberForm({ ...memberForm, documento: e.target.value })}
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
                      Teléfono
                    </label>
                    <input
                      type="tel"
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
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Fecha de Registro
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
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                      Estado
                    </label>
                    <select
                      value={memberForm.estado}
                      onChange={(e) => setMemberForm({ ...memberForm, estado: e.target.value as 'activo' | 'inactivo' | 'suspendido' })}
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
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
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
                      No hay Socios que mostrar
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
        </div>
      </div>
    );
  }