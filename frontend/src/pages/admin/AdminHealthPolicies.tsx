import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminHealthPoliciesProps {
  onNavigate?: (tab: string) => void;
}

export function AdminHealthPolicies({ onNavigate }: AdminHealthPoliciesProps) {
  const { healthPolicies, members, addHealthPolicy, updateHealthPolicy, deleteHealthPolicy } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    idSocio: '',
    tipo: 'Básica' as 'Básica' | 'Premium' | 'Familiar',
    numeroPoliza: '',
    fechaContratacion: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    fechaPago: '',
    valor: '',
    estado: 'Activa' as 'Activa' | 'Vencida' | 'Cancelada',
    observaciones: '',
  });

  const filteredPolicies = healthPolicies
    .filter(p => filterStatus === 'all' || p.estado === filterStatus)
    .filter(p => {
      const member = members.find(m => m.id === p.idSocio);
      const memberName = member?.name.toLowerCase() || '';
      return memberName.includes(searchTerm.toLowerCase()) || 
             (p.numeroPoliza && p.numeroPoliza.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .sort((a, b) => new Date(b.fechaVencimiento).getTime() - new Date(a.fechaVencimiento).getTime());

  const getMemberName = (idSocio: string) => {
    const member = members.find(m => m.id === idSocio);
    return member?.name || 'Socio no encontrado';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idSocio || !form.fechaContratacion || !form.fechaVencimiento || !form.valor) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    addHealthPolicy({
      idSocio: form.idSocio,
      tipo: form.tipo,
      numeroPoliza: form.numeroPoliza || undefined,
      fechaContratacion: form.fechaContratacion,
      fechaVencimiento: form.fechaVencimiento,
      fechaPago: form.fechaPago || undefined,
      valor: parseFloat(form.valor),
      estado: form.estado,
      observaciones: form.observaciones,
    });

    setForm({
      idSocio: '',
      tipo: 'Básica',
      numeroPoliza: '',
      fechaContratacion: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      fechaPago: '',
      valor: '',
      estado: 'Activa',
      observaciones: '',
    });
    setShowForm(false);
    alert('Póliza registrada correctamente');
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'badge ';
    switch (status) {
      case 'Activa': return baseClass + 'badge-success';
      case 'Vencida': return baseClass + 'badge-danger';
      case 'Cancelada': return baseClass + 'badge-secondary';
      default: return baseClass + 'badge-secondary';
    }
  };

  const getDaysRemaining = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return { text: 'Vencida', color: 'red' };
    if (dias <= 30) return { text: `${dias} días`, color: 'orange' };
    return { text: `${dias} días`, color: 'green' };
  };

  // Statistics
  const totalActivas = healthPolicies.filter(p => p.estado === 'Activa').length;
  const totalValor = healthPolicies.filter(p => p.estado === 'Activa').reduce((sum, p) => sum + p.valor, 0);
  const porVencer = healthPolicies.filter(p => {
    if (p.estado !== 'Activa') return false;
    const dias = getDaysRemaining(p.fechaVencimiento);
    return dias.color === 'orange';
  }).length;

  return (
    <div className="app">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Gestión de Pólizas de Salud</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancelar' : '+ Nueva Póliza'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Pólizas Activas</div>
            <div className="stat-value" style={{ color: 'green' }}>{totalActivas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Valor Total Activo</div>
            <div className="stat-value">{formatCurrency(totalValor, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Por Vencer (30 días)</div>
            <div className="stat-value" style={{ color: 'orange' }}>{porVencer}</div>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>Registrar Póliza de Salud</h4>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Socio</label>
                  <select 
                    value={form.idSocio}
                    onChange={(e) => setForm({...form, idSocio: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">Seleccionar socio...</option>
                    {members.filter(m => m.estado === 'activo').map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Tipo de Póliza</label>
                  <select 
                    value={form.tipo}
                    onChange={(e) => setForm({...form, tipo: e.target.value as any})}
                    className="input"
                  >
                    <option value="Básica">Básica</option>
                    <option value="Premium">Premium</option>
                    <option value="Familiar">Familiar</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Número de Póliza</label>
                  <input 
                    type="text" 
                    value={form.numeroPoliza}
                    onChange={(e) => setForm({...form, numeroPoliza: e.target.value})}
                    className="input"
                    placeholder="POL-0000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fecha de Contratación</label>
                  <input 
                    type="date" 
                    value={form.fechaContratacion}
                    onChange={(e) => setForm({...form, fechaContratacion: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fecha de Vencimiento</label>
                  <input 
                    type="date" 
                    value={form.fechaVencimiento}
                    onChange={(e) => setForm({...form, fechaVencimiento: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Valor</label>
                  <input 
                    type="number" 
                    value={form.valor}
                    onChange={(e) => setForm({...form, valor: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fecha de Pago</label>
                  <input 
                    type="date" 
                    value={form.fechaPago}
                    onChange={(e) => setForm({...form, fechaPago: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Estado</label>
                  <select 
                    value={form.estado}
                    onChange={(e) => setForm({...form, estado: e.target.value as any})}
                    className="input"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Vencida">Vencida</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Observaciones</label>
                <textarea 
                  value={form.observaciones}
                  onChange={(e) => setForm({...form, observaciones: e.target.value})}
                  className="input"
                  rows={2}
                />
              </div>
              <button type="submit" className="btn btn-primary">Guardar Póliza</button>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre o número de póliza..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
            style={{ width: '150px' }}
          >
            <option value="all">Todos</option>
            <option value="Activa">Activa</option>
            <option value="Vencida">Vencida</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Póliza</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Contratación</th>
                <th>Vencimiento</th>
                <th>Días Restantes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay pólizas registradas
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((policy) => {
                  const diasRestantes = getDaysRemaining(policy.fechaVencimiento);
                  return (
                    <tr key={policy.id}>
                      <td>{getMemberName(policy.idSocio)}</td>
                      <td>{policy.numeroPoliza || '-'}</td>
                      <td>{policy.tipo}</td>
                      <td>{formatCurrency(policy.valor, 'COP')}</td>
                      <td>{formatDateShort(policy.fechaContratacion)}</td>
                      <td>{formatDateShort(policy.fechaVencimiento)}</td>
                      <td style={{ color: diasRestantes.color, fontWeight: 'bold' }}>
                        {diasRestantes.text}
                      </td>
                      <td>
                        <span className={getStatusBadge(policy.estado)}>
                          {policy.estado}
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
