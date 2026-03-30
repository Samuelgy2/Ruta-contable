import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminMonthlyPaymentsProps {
  onNavigate?: (tab: string) => void;
}

export function AdminMonthlyPayments({ onNavigate }: AdminMonthlyPaymentsProps) {
  const { pagosMensuales, periodos, members, addPagoMensual, updatePagoMensual, deletePagoMensual } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriodo, setFilterPeriodo] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    idSocio: '',
    idPeriodo: '',
    valor: '',
    fechaVencimiento: '',
    estado: 'pendiente' as 'pendiente' | 'pagado' | 'moroso' | 'exento' | 'cancelado',
    fechaPago: '',
    diasMora: 0,
    observaciones: '',
  });

  const filteredPayments = pagosMensuales
    .filter(p => filterStatus === 'all' || p.estado === filterStatus)
    .filter(p => filterPeriodo === 'all' || p.idPeriodo === filterPeriodo)
    .filter(p => {
      const member = members.find(m => m.id === p.idSocio);
      const memberName = member?.name.toLowerCase() || '';
      return memberName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const periodoA = periodos.find(p => p.id === a.idPeriodo);
      const periodoB = periodos.find(p => p.id === b.idPeriodo);
      if (periodoA && periodoB) {
        if (periodoA.anio !== periodoB.anio) return periodoB.anio - periodoA.anio;
        return periodoB.mes - periodoA.mes;
      }
      return 0;
    });

  const getMemberName = (idSocio: string) => {
    const member = members.find(m => m.id === idSocio);
    return member?.name || 'Socio no encontrado';
  };

  const getPeriodoName = (idPeriodo: string) => {
    const periodo = periodos.find(p => p.id === idPeriodo);
    return periodo ? `${periodo.nombreMes} ${periodo.anio}` : 'Periodo no encontrado';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idSocio || !form.idPeriodo || !form.valor || !form.fechaVencimiento) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const fechaVenc = new Date(form.fechaVencimiento);
    const fechaPago = form.fechaPago ? new Date(form.fechaPago) : null;
    let diasMora = 0;
    let estado = form.estado;

    if (fechaPago && fechaPago > fechaVenc) {
      estado = 'moroso';
      diasMora = Math.floor((fechaPago.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
    } else if (fechaPago && fechaPago <= fechaVenc) {
      estado = 'pagado';
    }

    addPagoMensual({
      idSocio: form.idSocio,
      idPeriodo: form.idPeriodo,
      valor: parseFloat(form.valor),
      fechaVencimiento: form.fechaVencimiento,
      fechaPago: form.fechaPago || undefined,
      estado,
      diasMora,
      observaciones: form.observaciones,
    });

    setForm({
      idSocio: '',
      idPeriodo: '',
      valor: '',
      fechaVencimiento: '',
      estado: 'pendiente',
      fechaPago: '',
      diasMora: 0,
      observaciones: '',
    });
    setShowForm(false);
    alert('Pago registrado correctamente');
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'badge ';
    switch (status) {
      case 'pagado': return baseClass + 'badge-success';
      case 'pendiente': return baseClass + 'badge-warning';
      case 'moroso': return baseClass + 'badge-danger';
      case 'exento': return baseClass + 'badge-info';
      case 'cancelado': return baseClass + 'badge-secondary';
      default: return baseClass + 'badge-secondary';
    }
  };

  // Statistics
  const totalPendiente = pagosMensuales.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + p.valor, 0);
  const totalPagado = pagosMensuales.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + p.valor, 0);
  const totalMoroso = pagosMensuales.filter(p => p.estado === 'moroso').reduce((sum, p) => sum + p.valor, 0);

  return (
    <div className="app">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Gestión de Mensualidades</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancelar' : '+ Registrar Pago'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Pendiente</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(totalPendiente, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Pagado</div>
            <div className="stat-value" style={{ color: 'green' }}>{formatCurrency(totalPagado, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total en Mora</div>
            <div className="stat-value" style={{ color: 'red' }}>{formatCurrency(totalMoroso, 'COP')}</div>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>Registrar Pago de Mensualidad</h4>
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
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Periodo</label>
                  <select 
                    value={form.idPeriodo}
                    onChange={(e) => setForm({...form, idPeriodo: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">Seleccionar periodo...</option>
                    {periodos.map(periodo => (
                      <option key={periodo.id} value={periodo.id}>{periodo.nombreMes} {periodo.anio}</option>
                    ))}
                  </select>
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
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="moroso">Moroso</option>
                    <option value="exento">Exento</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
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
              <button type="submit" className="btn btn-primary">Guardar Pago</button>
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
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value)}
            className="input"
            style={{ width: '200px' }}
          >
            <option value="all">Todos los meses</option>
            {periodos.map(periodo => (
              <option key={periodo.id} value={periodo.id}>{periodo.nombreMes} {periodo.anio}</option>
            ))}
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
            style={{ width: '150px' }}
          >
            <option value="all">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="moroso">Moroso</option>
            <option value="exento">Exento</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Socio</th>
                <th>Valor</th>
                <th>Vencimiento</th>
                <th>Fecha Pago</th>
                <th>Días Mora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay pagos registrados
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pago) => (
                  <tr key={pago.id}>
                    <td>{getPeriodoName(pago.idPeriodo)}</td>
                    <td>{getMemberName(pago.idSocio)}</td>
                    <td>{formatCurrency(pago.valor, 'COP')}</td>
                    <td>{formatDateShort(pago.fechaVencimiento)}</td>
                    <td>{pago.fechaPago ? formatDateShort(pago.fechaPago) : '-'}</td>
                    <td>{pago.diasMora > 0 ? `${pago.diasMora} días` : '-'}</td>
                    <td>
                      <span className={getStatusBadge(pago.estado)}>
                        {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
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
