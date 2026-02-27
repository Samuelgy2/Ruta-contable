import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminMembersProps {
  onNavigate?: (tab: string) => void;
}

export function AdminMembers({ onNavigate }: AdminMembersProps) {
  const { members, fees } = useData();
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="app">
      <div className="container">
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: 0, marginBottom: '8px' }}>Lista de Miembros</h3>
          <p style={{ color: 'var(--color-gray-600)', margin: 0 }}>
            {members.length} miembros registrados en el sistema
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o cédula..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ maxWidth: '400px' }}
          />
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Fecha de Registro</th>
                <th>Estado Cuotas</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay miembros que mostrar
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const feeStatus = getMemberFeeStatus(member.id);
                  return (
                    <tr key={member.id}>
                      <td>{member.membershipType}</td>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.phone}</td>
                      <td>{formatDateShort(member.joinDate)}</td>
                      <td>
                        <span className={feeStatus === 'paid' ? 'badge-success' : 'badge-warning'}>
                          {feeStatus === 'paid' ? 'Al día' : 'Pendiente'}
                        </span>
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
