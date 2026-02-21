import React from 'react';
import { Header } from '../../components/common/Header';
import { useData } from '../../contexts/DataContext';
import { useStats } from '../../hooks/useStats';
import { formatCurrency } from '../../utils/format';
import { exportToCSV, exportToJSON, exportTransactionsReport, exportMembersWithFees } from '../../utils/export';

interface AdminReportsProps {
  onNavigate?: (tab: string) => void;
}

export function AdminReports({ onNavigate }: AdminReportsProps) {
  const { transactions, members, fees, systemData } = useData();
  const stats = useStats(transactions, fees, members);

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleExportTransactions = () => {
    const data = transactions.map(t => ({
      fecha: t.date,
      tipo: t.type === 'income' ? 'Ingreso' : 'Gasto',
      categoria: t.category,
      monto: t.amount,
      descripcion: t.description,
      creadoPor: t.createdBy,
    }));
    exportToCSV(data, `transacciones-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportMembers = () => {
    exportMembersWithFees(members, fees);
  };

  const handleExportReport = () => {
    exportTransactionsReport(transactions, systemData);
  };

  const handleExportAllData = () => {
    const data = {
      transactions,
      members,
      fees,
      systemData,
      exportDate: new Date().toISOString(),
    };
    exportToJSON(data, `backup-completo-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="app">
      <Header onNavigate={handleNavigate} showDropdown={true} />
      
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: 0, marginBottom: '8px' }}>Reportes y Estadísticas</h3>
          <p style={{ color: 'var(--color-gray-600)', margin: 0 }}>
            Resumen financiero y herramientas de exportación
          </p>
        </div>

        {/* Resumen financiero */}
        <div className="admin-grid" style={{ marginBottom: '32px' }}>
          <div className="admin-card">
            <h3>Balance General</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Balance Total</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: stats.balance >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                  {formatCurrency(stats.balance, systemData.currency)}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--color-green-light)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Ingresos Totales</p>
                  <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{formatCurrency(stats.totalIncome, systemData.currency)}</p>
                </div>
                <div style={{ padding: '12px', background: 'var(--color-red-light)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Gastos Totales</p>
                  <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{formatCurrency(stats.totalExpense, systemData.currency)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3>Cuotas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--color-green-light)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Cuotas Pagadas</p>
                <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{stats.paidFees}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-yellow-light)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Cuotas Pendientes</p>
                <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{stats.pendingFees}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-red-light)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Cuotas Vencidas</p>
                <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{stats.overdueFees}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exportaciones */}
        <div className="admin-card">
          <h3>Exportar Datos</h3>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: '24px' }}>
            Descarga los datos del sistema en diferentes formatos
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <button onClick={handleExportTransactions} className="btn btn-secondary" style={{ padding: '16px' }}>
              <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>📊</span>
              Exportar Transacciones
              <span style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Formato CSV</span>
            </button>
            <button onClick={handleExportMembers} className="btn btn-secondary" style={{ padding: '16px' }}>
              <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>👥</span>
              Exportar Socios y Cuotas
              <span style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Formato CSV</span>
            </button>
            <button onClick={handleExportReport} className="btn btn-secondary" style={{ padding: '16px' }}>
              <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>📈</span>
              Reporte Financiero
              <span style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Formato PDF</span>
            </button>
            <button onClick={handleExportAllData} className="btn btn-secondary" style={{ padding: '16px' }}>
              <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>💾</span>
              Backup Completo
              <span style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Formato JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
