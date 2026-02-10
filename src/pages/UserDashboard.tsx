import React, { useState } from 'react';
import { Header } from '../components/common/Header';
import { StatCard } from '../components/common/StatCard';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';
import { formatCurrency, formatDateShort } from '../utils/format';

export function UserDashboard() {
  const { 
    transactions, 
    members, 
    fees, 
    categories,
    systemData,
    addTransaction 
  } = useData();
  const { currentUser } = useAuth();
  const stats = useStats(transactions, fees, members);
  
  const [activeTab, setActiveTab] = useState<'transactions' | 'members' | 'reports'>('transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Estado del formulario
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      alert('Por favor completa todos los campos');
      return;
    }

    addTransaction({
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      createdBy: currentUser?.username || '',
    });

    setFormData({
      type: 'income',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowForm(false);
    alert('Transacción registrada correctamente');
  };

  const filteredTransactions = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const availableCategories = categories
    .filter(c => c.active && c.type === formData.type)
    .map(c => c.name);

  return (
    <div className="app">
      <Header />
      
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Panel de Usuario</h1>
          <p style={{ color: 'var(--color-gray-600)' }}>Gestión de transacciones y consulta de información</p>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <StatCard
            title="Balance Total"
            value={formatCurrency(stats.balance, systemData.currency)}
            className={stats.balance >= 0 ? 'positive' : 'negative'}
            description="Saldo actual del club"
          />
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(stats.monthlyIncome, systemData.currency)}
            className="positive"
            description="Total de ingresos"
          />
          <StatCard
            title="Gastos del Mes"
            value={formatCurrency(stats.monthlyExpense, systemData.currency)}
            className="negative"
            description="Total de gastos"
          />
          <StatCard
            title="Socios Activos"
            value={stats.activeMembers}
            className="neutral"
            description="Miembros registrados"
          />
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className="tab-nav">
            <button 
              className={activeTab === 'transactions' ? 'active' : ''}
              onClick={() => setActiveTab('transactions')}
            >
              Transacciones
            </button>
            <button 
              className={activeTab === 'members' ? 'active' : ''}
              onClick={() => setActiveTab('members')}
            >
              Socios
            </button>
            <button 
              className={activeTab === 'reports' ? 'active' : ''}
              onClick={() => setActiveTab('reports')}
            >
              Reportes
            </button>
          </div>

          <div className="tab-content">
            {/* Tab de Transacciones */}
            {activeTab === 'transactions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0 }}>Gestión de Transacciones</h3>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn"
                  >
                    {showForm ? 'Cancelar' : '+ Nueva Transacción'}
                  </button>
                </div>

                {showForm && (
                  <div className="card">
                    <h3>Nueva Transacción</h3>
                    <form onSubmit={handleSubmit}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Tipo</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: '' })}
                          >
                            <option value="income">Ingreso</option>
                            <option value="expense">Gasto</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Monto ({systemData.currency})</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="form-group">
                          <label>Categoría</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          >
                            <option value="">Seleccionar categoría</option>
                            {availableCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Fecha</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Descripción</label>
                        <input
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Detalles de la transacción"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="btn">
                          Guardar
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Filtros */}
                <div className="filters">
                  <div className="search-bar">
                    <input
                      type="text"
                      placeholder="Buscar transacciones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                    <option value="all">Todas</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Gastos</option>
                  </select>
                </div>

                {/* Lista de transacciones */}
                <div className="card">
                  {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                      <h3>No hay transacciones</h3>
                      <p>Comienza agregando una nueva transacción</p>
                    </div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Categoría</th>
                          <th>Descripción</th>
                          <th className="text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map(transaction => (
                          <tr key={transaction.id}>
                            <td>{formatDateShort(transaction.date)}</td>
                            <td>
                              <span className={transaction.type === 'income' ? 'badge-income' : 'badge-expense'}>
                                {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                              </span>
                            </td>
                            <td>{transaction.category}</td>
                            <td>{transaction.description}</td>
                            <td className={`text-right ${transaction.type === 'income' ? 'positive' : 'negative'}`}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount, systemData.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Tab de Socios */}
            {activeTab === 'members' && (
              <div>
                <h3>Lista de Socios</h3>
                <div className="card">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Tipo de Membresía</th>
                        <th>Fecha de Ingreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.filter(m => m.active).map(member => (
                        <tr key={member.id}>
                          <td>{member.name}</td>
                          <td>{member.email}</td>
                          <td>
                            <span className="badge-active">{member.membershipType}</span>
                          </td>
                          <td>{formatDateShort(member.joinDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab de Reportes */}
            {activeTab === 'reports' && (
              <div>
                <h3>Resumen Financiero</h3>
                
                <div className="card">
                  <h4 style={{ marginBottom: '16px' }}>Totales Generales</h4>
                  <div className="data-summary">
                    <div className="data-summary-item">
                      <div className="data-summary-value positive">
                        {formatCurrency(stats.totalIncome, systemData.currency)}
                      </div>
                      <div className="data-summary-label">Total Ingresos</div>
                    </div>
                    <div className="data-summary-item">
                      <div className="data-summary-value negative">
                        {formatCurrency(stats.totalExpense, systemData.currency)}
                      </div>
                      <div className="data-summary-label">Total Gastos</div>
                    </div>
                    <div className="data-summary-item">
                      <div className={`data-summary-value ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(stats.balance, systemData.currency)}
                      </div>
                      <div className="data-summary-label">Balance</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h4 style={{ marginBottom: '16px' }}>Mes Actual</h4>
                  <div className="data-summary">
                    <div className="data-summary-item">
                      <div className="data-summary-value positive">
                        {formatCurrency(stats.monthlyIncome, systemData.currency)}
                      </div>
                      <div className="data-summary-label">Ingresos</div>
                    </div>
                    <div className="data-summary-item">
                      <div className="data-summary-value negative">
                        {formatCurrency(stats.monthlyExpense, systemData.currency)}
                      </div>
                      <div className="data-summary-label">Gastos</div>
                    </div>
                    <div className="data-summary-item">
                      <div className={`data-summary-value ${stats.monthlyBalance >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(stats.monthlyBalance, systemData.currency)}
                      </div>
                      <div className="data-summary-label">Balance</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
