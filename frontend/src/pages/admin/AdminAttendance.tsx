import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { formatDateShort } from '../../utils/format';

interface AdminAttendanceProps {
  onNavigate?: (tab: string) => void;
}

export function AdminAttendance({ onNavigate }: AdminAttendanceProps) {
  const { asistencia, members, addAttendance, updateAttendance, deleteAttendance } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    idSocio: '',
    fecha: new Date().toISOString().split('T')[0],
    tipoEntrenamiento: 'Fútbol',
    estado: 'Presente' as 'Presente' | 'Ausente' | 'Justificado' | 'Tarde',
    observacion: '',
  });

  const filteredAttendance = asistencia
    .filter(a => filterDate === '' || a.fecha === filterDate)
    .filter(a => filterStatus === 'all' || a.estado === filterStatus)
    .filter(a => {
      const member = members.find(m => m.id === a.idSocio);
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
    if (!form.idSocio || !form.fecha) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    addAttendance({
      ...form,
      registradoBy: 'admin',
    });

    setForm({
      idSocio: '',
      fecha: new Date().toISOString().split('T')[0],
      tipoEntrenamiento: 'Fútbol',
      estado: 'Presente',
      observacion: '',
    });
    setShowForm(false);
    alert('Asistencia registrada correctamente');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Presente': return '✅';
      case 'Tarde': return '⚠️';
      case 'Justificado': return '📝';
      case 'Ausente': return '❌';
      default: return '❓';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = 'badge ';
    switch (status) {
      case 'Presente': return baseClass + 'badge-success';
      case 'Tarde': return baseClass + 'badge-warning';
      case 'Justificado': return baseClass + 'badge-info';
      case 'Ausente': return baseClass + 'badge-danger';
      default: return baseClass + 'badge-secondary';
    }
  };

  // Statistics
  const todayAttendance = asistencia.filter(a => a.fecha === new Date().toISOString().split('T')[0]);
  const presentCount = todayAttendance.filter(a => a.estado === 'Presente').length;
  const absentCount = todayAttendance.filter(a => a.estado === 'Ausente').length;
  const justifiedCount = todayAttendance.filter(a => a.estado === 'Justificado').length;

  return (
    <div className="app">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Control de Asistencia</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancelar' : '+ Registrar Asistencia'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Registrados</div>
            <div className="stat-value">{todayAttendance.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Presentes</div>
            <div className="stat-value" style={{ color: 'green' }}>{presentCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ausentes</div>
            <div className="stat-value" style={{ color: 'red' }}>{absentCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Justificados</div>
            <div className="stat-value" style={{ color: 'blue' }}>{justifiedCount}</div>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>Registrar Asistencia</h4>
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
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Tipo de Entrenamiento</label>
                  <select 
                    value={form.tipoEntrenamiento}
                    onChange={(e) => setForm({...form, tipoEntrenamiento: e.target.value})}
                    className="input"
                  >
                    <option value="Fútbol">Fútbol</option>
                    <option value="Entrenamiento General">Entrenamiento General</option>
                    <option value="Partido">Partido</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Estado</label>
                  <select 
                    value={form.estado}
                    onChange={(e) => setForm({...form, estado: e.target.value as any})}
                    className="input"
                  >
                    <option value="Presente">Presente</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Ausente">Ausente</option>
                    <option value="Justificado">Justificado</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Observación</label>
                <textarea 
                  value={form.observacion}
                  onChange={(e) => setForm({...form, observacion: e.target.value})}
                  className="input"
                  placeholder="Observación opcional..."
                  rows={2}
                />
              </div>
              <button type="submit" className="btn btn-primary">Guardar Asistencia</button>
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
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input"
            style={{ width: '200px' }}
          />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input"
            style={{ width: '150px' }}
          >
            <option value="all">Todos</option>
            <option value="Presente">Presente</option>
            <option value="Tarde">Tarde</option>
            <option value="Ausente">Ausente</option>
            <option value="Justificado">Justificado</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Socio</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Observación</th>
                <th>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay registros de asistencia
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDateShort(record.fecha)}</td>
                    <td>{getMemberName(record.idSocio)}</td>
                    <td>{record.tipoEntrenamiento}</td>
                    <td>
                      <span className={getStatusBadge(record.estado)}>
                        {getStatusIcon(record.estado)} {record.estado}
                      </span>
                    </td>
                    <td>{record.observacion || '-'}</td>
                    <td>{record.registradoBy}</td>
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
