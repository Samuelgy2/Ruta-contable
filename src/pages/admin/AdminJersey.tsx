import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminJerseyProps {
  onNavigate?: (tab: string) => void;
}

export function AdminJersey({ onNavigate }: AdminJerseyProps) {
  const { jerseyOrders, members, addJerseyOrder, updateJerseyOrder, deleteJerseyOrder } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    idSocio: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Jersey' as 'Jersey' | 'Short' | 'Medias' | 'Chaqueta',
    talla: '',
    aplica: '',
    valor: '',
    estado: 'Solicitado' as 'Solicitado' | 'En producción' | 'Listo' | 'Entregado' | 'Cancelado',
    fechaEntrega: '',
    observaciones: '',
  });

  const filteredOrders = jerseyOrders
    .filter(o => filterStatus === 'all' || o.estado === filterStatus)
    .filter(o => {
      const member = members.find(m => m.id === o.idSocio);
      const memberName = member?.name.toLowerCase() || '';
      return memberName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const getMemberName = (idSocio: string) => {
    const member = members.find(m => m.id === idSocio);
    return member?.name || 'Socio no encontrado';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idSocio || !form.fecha || !form.valor) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    addJerseyOrder({
      idSocio: form.idSocio,
      fecha: form.fecha,
      tipo: form.tipo,
      talla: form.talla,
      aplica: form.aplica,
      valor: parseFloat(form.valor),
      estado: form.estado,
      fechaEntrega: form.fechaEntrega || undefined,
      observaciones: form.observaciones,
    });

    setForm({
      idSocio: '',
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'Jersey',
      talla: '',
      aplica: '',
      valor: '',
      estado: 'Solicitado',
      fechaEntrega: '',
      observaciones: '',
    });
    setShowForm(false);
    alert('Pedido registrado correctamente');
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'badge ';
    switch (status) {
      case 'Solicitado': return baseClass + 'badge-info';
      case 'En producción': return baseClass + 'badge-warning';
      case 'Listo': return baseClass + 'badge-primary';
      case 'Entregado': return baseClass + 'badge-success';
      case 'Cancelado': return baseClass + 'badge-secondary';
      default: return baseClass + 'badge-secondary';
    }
  };

  // Statistics
  const totalPendiente = jerseyOrders.filter(o => ['Solicitado', 'En producción'].includes(o.estado)).reduce((sum, o) => sum + o.valor, 0);
  const totalEntregado = jerseyOrders.filter(o => o.estado === 'Entregado').reduce((sum, o) => sum + o.valor, 0);

  return (
    <div className="app">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Gestión de Indumentaria (Jersey)</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancelar' : '+ Nuevo Pedido'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Pedidos Pendientes</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(totalPendiente, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Entregados</div>
            <div className="stat-value" style={{ color: 'green' }}>{formatCurrency(totalEntregado, 'COP')}</div>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>Registrar Pedido de Indumentaria</h4>
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
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fecha</label>
                  <input 
                    type="date" 
                    value={form.fecha}
                    onChange={(e) => setForm({...form, fecha: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Tipo</label>
                  <select 
                    value={form.tipo}
                    onChange={(e) => setForm({...form, tipo: e.target.value as any})}
                    className="input"
                  >
                    <option value="Jersey">Jersey</option>
                    <option value="Short">Short</option>
                    <option value="Medias">Medias</option>
                    <option value="Chaqueta">Chaqueta</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Talla</label>
                  <select 
                    value={form.talla}
                    onChange={(e) => setForm({...form, talla: e.target.value})}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Aplique</label>
                  <input 
                    type="text" 
                    value={form.aplica}
                    onChange={(e) => setForm({...form, aplica: e.target.value})}
                    className="input"
                    placeholder="Logo, número, etc."
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
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Estado</label>
                  <select 
                    value={form.estado}
                    onChange={(e) => setForm({...form, estado: e.target.value as any})}
                    className="input"
                  >
                    <option value="Solicitado">Solicitado</option>
                    <option value="En producción">En producción</option>
                    <option value="Listo">Listo</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fecha Entrega</label>
                  <input 
                    type="date" 
                    value={form.fechaEntrega}
                    onChange={(e) => setForm({...form, fechaEntrega: e.target.value})}
                    className="input"
                  />
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
              <button type="submit" className="btn btn-primary">Guardar Pedido</button>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
            style={{ width: '180px' }}
          >
            <option value="all">Todos</option>
            <option value="Solicitado">Solicitado</option>
            <option value="En producción">En producción</option>
            <option value="Listo">Listo</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Socio</th>
                <th>Tipo</th>
                <th>Talla</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Entrega</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay pedidos registrados
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{formatDateShort(order.fecha)}</td>
                    <td>{getMemberName(order.idSocio)}</td>
                    <td>{order.tipo}</td>
                    <td>{order.talla || '-'}</td>
                    <td>{formatCurrency(order.valor, 'COP')}</td>
                    <td>
                      <span className={getStatusBadge(order.estado)}>
                        {order.estado}
                      </span>
                    </td>
                    <td>{order.fechaEntrega ? formatDateShort(order.fechaEntrega) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
