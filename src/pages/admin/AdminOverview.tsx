import React from 'react';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { useData } from '../../contexts/DataContext';
import { useStats } from '../../hooks/useStats';
import { formatCurrency } from '../../utils/format';

interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
}

export function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const { transactions, members, fees, systemData, users } = useData();
  const stats = useStats(transactions, fees, members);

  // Handle navigation from dropdown
  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div className="app">
      <Header onNavigate={handleNavigate} showDropdown={true} />
      
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Resumen del Sistema</h1>
          <p style={{ color: 'var(--color-gray-600)' }}>Estadísticas generales del club - Accede a todas las funciones desde el menú del logo</p>
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

        <div className="admin-grid">
          <div className="admin-card">
            <h3>Estadísticas Generales</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--color-gray-600)' }}>Total Transacciones</span>
                <strong>{stats.totalTransactions}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--color-gray-600)' }}>Total Socios</span>
                <strong>{stats.totalMembers}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--color-gray-600)' }}>Cuotas Pagadas</span>
                <strong className="positive">{stats.paidFees}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--color-gray-600)' }}>Cuotas Pendientes</span>
                <strong className="negative">{stats.pendingFees + stats.overdueFees}</strong>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3>Información del Sistema</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Club</p>
                <p style={{ margin: 0 }}>{systemData.clubName}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Año Fiscal</p>
                <p style={{ margin: 0 }}>{systemData.fiscalYear}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Moneda</p>
                <p style={{ margin: 0 }}>{systemData.currency}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Usuarios Activos</p>
                <p style={{ margin: 0 }}>{users.filter((u: { active: boolean }) => u.active).length} de {users.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
