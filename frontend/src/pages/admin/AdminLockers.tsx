import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminLockersProps {
  onNavigate?: (tab: string) => void;
}

export function AdminLockers({ onNavigate }: AdminLockersProps) {
  const { lockers, members, addLocker, updateLocker, deleteLocker } = useData();
  const currentYear = new Date().getFullYear();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    idSocio: '',
    numeroCamerino: '',
    anio: currentYear,
    valor: '',
    fechaAsignacion: new Date().toISOString().split('T')[0],
    fechaPago: '',
    estado: 'Asignado' as 'Asignado' | 'Pagado' | 'Vencido' | 'Liberado',
    observaciones: '',
  });

  const filteredLockers = lockers
    .filter(l => l.anio.toString() === filterYear || filterYear === 'all')
    .filter(l => filterStatus === 'all' || l.estado === filterStatus)
    .filter(l => {
      const member = members.find(m => m.id === l.idSocio);
      const memberName = member?.name.toLowerCase() || '';
      return memberName.includes(searchTerm.toLowerCase()) || 
             l.numeroCamerino.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => a.numeroCamerino.localeCompare(b.numeroCamerino));

  const getMemberName = (idSocio: string) => {
    const member = members.find(m => m.id === idSocio);
    return member?.name || 'Socio no encontrado';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idSocio || !form.numeroCamerino || !form.valor) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    addLocker({
      idSocio: form.idSocio,
      numeroCamerino: form.numeroCamerino,
      anio: form.anio,
      valor: parseFloat(form.valor),
      fechaAsignacion: form.fechaAsignacion,
      fechaPago: form.fechaPago || undefined,
      estado: form.estado,
      observaciones: form.observaciones,
    });

    setForm({
      idSocio: '',
      numeroCamerino: '',
      anio: currentYear,
      valor: '',
      fechaAsignacion: new Date().toISOString().split('T')[0],
      fechaPago: '',
      estado: 'Asignado',
      observaciones: '',
    });
    setShowForm(false);
    alert('Camerino asignado correctamente');
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'badge ';
    switch (status) {
      case 'Asignado': return baseClass + 'badge-warning';
      case 'Pagado': return baseClass + 'badge-success';
      case 'Vencido': return baseClass + 'badge-danger';
      case 'Liberado': return baseClass + 'badge-secondary';
      default: return baseClass + 'badge-secondary';
    }
  };

  // Statistics
  const totalPendiente = lockers.filter(l => l.estado === 'Asignado').reduce((sum, l) => sum + l.valor, 0);
  const totalPagado = lockers.filter(l => l.estado === 'Pagado').reduce((sum, l) => sum + l.valor, 0);
  const assignedCount = lockers.filter(l => l.anio === currentYear).length;

  return (
    <div className="app">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Gestión de Camerinos</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancelar' : '+ Asignar Camerino'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Camerinos Asignados ({currentYear})</div>
            <div className="stat-value">{assignedCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Pendiente</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(totalPendiente, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Cobrado</div>
            <div className="stat-value" style={{ color: 'green' }}>{formatCurrency(totalPagado, 'COP')}</div>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>Asignar Camerino</h4>
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
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Número de Camerino</label>
                  <input 
                    type="text" 
                    value={form.numeroCamerino}
                    onChange={(e) => setForm({...form, numeroCamerino: e.target.value})}
                    className="input"
                    placeholder="Ej: A-01, B-12"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Año</label>
                  <input 
                    type="number" 
                    value={form.anio}
                    onChange={(e) => setForm({...form, anio: parseInt(e.target.value)})}
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
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fecha Asignación</label>
                  <input 
                    type="date" 
                    value={form.fechaAsignacion}
                    onChange={(e) => setForm({...form, fechaAsignacion: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fecha Pago</label>
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
                    <option value="Asignado">Asignado</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Vencido">Vencido</option>
                    <option value="Liberado">Liberado</option>
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
              <button type="submit" className="btn btn-primary">Guardar Asignación</button>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre o número..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          />
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="input"
            style={{ width: '120px' }}
          >
            <option value="all">Todos</option>
            <option value={currentYear.toString()}>{currentYear}</option>
            <option value={(currentYear - 1).toString()}>{currentYear - 1}</option>
            <option value={(currentYear - 2).toString()}>{currentYear - 2}</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
            style={{ width: '150px' }}
          >
            <option value="all">Todos</option>
            <option value="Asignado">Asignado</option>
            <option value="Pagado">Pagado</option>
            <option value="Vencido">Vencido</option>
            <option value="Liberado">Liberado</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Camerino</th>
                <th>Año</th>
                <th>Socio</th>
                <th>Valor</th>
                <th>Asignación</th>
                <th>Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredLockers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay camerinos asignados
                  </td>
                </tr>
              ) : (
                filteredLockers.map((locker) => (
                  <tr key={locker.id}>
                    <td><strong>{locker.numeroCamerino}</strong></td>
                    <td>{locker.anio}</td>
                    <td>{getMemberName(locker.idSocio)}</td>
                    <td>{formatCurrency(locker.valor, 'COP')}</td>
                    <td>{formatDateShort(locker.fechaAsignacion)}</td>
                    <td>{locker.fechaPago ? formatDateShort(locker.fechaPago) : '-'}</td>
                    <td>
                      <span className={getStatusBadge(locker.estado)}>
                        {locker.estado}
                      </span>
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
