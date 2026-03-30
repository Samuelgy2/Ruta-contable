import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminCarteraProps {
  onNavigate?: (tab: string) => void;
}

export function AdminCartera({ onNavigate }: AdminCarteraProps) {
  const { cartera, members, addCartera, updateCartera, deleteCartera } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    idSocio: '',
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    valor: '',
    estado: 'pendiente' as 'pendiente' | 'pagado' | 'anulado',
    fechaPago: '',
    observaciones: '',
  });

  const filteredCartera = cartera
    .filter(c => filterStatus === 'all' || c.estado === filterStatus)
    .filter(c => {
      const member = members.find(m => m.id === c.idSocio);
      const memberName = member?.name.toLowerCase() || '';
      return memberName.includes(searchTerm.toLowerCase()) || 
             c.concepto.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const getMemberName = (idSocio: string) => {
    const member = members.find(m => m.id === idSocio);
    return member?.name || 'Socio no encontrado';
  };

  const getMemberDocumento = (idSocio: string) => {
    const member = members.find(m => m.id === idSocio);
    return member?.documento || '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idSocio || !form.concepto || !form.valor || !form.fecha) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    addCartera({
      idSocio: form.idSocio,
      fecha: form.fecha,
      concepto: form.concepto,
      valor: parseFloat(form.valor),
      estado: form.estado,
      fechaPago: form.fechaPago || undefined,
      observaciones: form.observaciones,
    });

    setForm({
      idSocio: '',
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      valor: '',
      estado: 'pendiente',
      fechaPago: '',
      observaciones: '',
    });
    setShowForm(false);
    alert('Registro de cartera guardado correctamente');
  };

  const handlePagar = (id: string) => {
    updateCartera(id, {
      estado: 'pagado',
      fechaPago: new Date().toISOString().split('T')[0],
    });
    alert('Pago registrado');
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'badge ';
    switch (status) {
      case 'pendiente': return baseClass + 'badge-warning';
      case 'pagado': return baseClass + 'badge-success';
      case 'anulado': return baseClass + 'badge-secondary';
      default: return baseClass + 'badge-secondary';
    }
  };

  // Statistics
  const totalPendiente = cartera.filter(c => c.estado === 'pendiente').reduce((sum, c) => sum + c.valor, 0);
  const totalPagado = cartera.filter(c => c.estado === 'pagado').reduce((sum, c) => sum + c.valor, 0);
  const carteraVencida = cartera.filter(c => {
    if (c.estado !== 'pendiente') return false;
    const fecha = new Date(c.fecha);
    const diasVencido = Math.floor((new Date().getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
    return diasVencido > 30;
  });

  return (
    <div className="app">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Gestión de Cartera</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancelar' : '+ Nuevo Cargo'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Pendiente</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(totalPendiente, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Cobrado</div>
            <div className="stat-value" style={{ color: 'green' }}>{formatCurrency(totalPagado, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Vencidos (+30 días)</div>
            <div className="stat-value" style={{ color: 'red' }}>{carteraVencida.length}</div>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>Registrar Cargo a Cartera</h4>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
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
                      <option key={member.id} value={member.id}>{member.name} - {member.documento}</option>
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
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Concepto</label>
                  <input 
                    type="text" 
                    value={form.concepto}
                    onChange={(e) => setForm({...form, concepto: e.target.value})}
                    className="input"
                    placeholder="Ej: Recargo por mora, Cuota pendiente..."
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
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Observaciones</label>
                <textarea 
                  value={form.observaciones}
                  onChange={(e) => setForm({...form, observaciones: e.target.value})}
                  className="input"
                  placeholder="Observaciones..."
                  rows={2}
                />
              </div>
              <button type="submit" className="btn btn-primary">Guardar Cargo</button>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre o concepto..." 
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
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="anulado">Anulado</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Socio</th>
                <th>Documento</th>
                <th>Concepto</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCartera.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay registros de cartera
                  </td>
                </tr>
              ) : (
                filteredCartera.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDateShort(record.fecha)}</td>
                    <td>{getMemberName(record.idSocio)}</td>
                    <td>{getMemberDocumento(record.idSocio)}</td>
                    <td>{record.concepto}</td>
                    <td>{formatCurrency(record.valor, 'COP')}</td>
                    <td>
                      <span className={getStatusBadge(record.estado)}>
                        {record.estado.charAt(0).toUpperCase() + record.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      {record.estado === 'pendiente' && (
                        <button 
                          onClick={() => handlePagar(record.id)}
                          className="btn btn-sm btn-success"
                        >
                          Registrar Pago
                        </button>
                      )}
                    </td>
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
