import React from 'react';
import { useData } from '../../contexts/DataContext';

interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
}

// Color verde del club
const CLUB_GREEN = '#10b981';

export function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const { systemData, transactions, members, fees } = useData();

  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate total balance from transactions
  const totalBalance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  // Current club balance (same as total balance)
  const clubBalance = totalBalance;

  // Calculate income and expenses for current month
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    if (isNaN(transactionDate.getTime())) return false;
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  // Calculate paid and pending fees
  const paidFees = fees.filter(f => f.status === 'paid').length;
  const pendingFees = fees.filter(f => f.status === 'pending').length;

  // Format currency
  const formatCurrency = (amount: number) => {
    // Map common currency symbols to valid ISO codes
    const currencyMap: Record<string, string> = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      'COP': 'COP',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
    };
    const currencyCode = currencyMap[systemData.currency || ''] || 'USD';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle navigation from dropdown
  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div className="app">
      <div className="container">
        {/* Cabecera */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            Panel Gestor 
          </h1>
          <p style={{ color: '#6b7280' }}>
            Bienvenido, <strong>Samuel gutierrez</strong>
          </p>
        </div>

        {/* Tarjetas de resumen */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Saldo actual del club */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${CLUB_GREEN}`
          }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
              Saldo actual del club
            </p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
              {formatCurrency(clubBalance)}
            </p>
          </div>

          {/* Balance total */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${CLUB_GREEN}`
          }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
              Balance total
            </p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
              {formatCurrency(totalBalance)}
            </p>
          </div>

          {/* Ingresos del mes */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${CLUB_GREEN}`
          }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
              Ingresos del mes
            </p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
              {formatCurrency(monthlyIncome)}
            </p>
          </div>

          {/* Gastos del mes */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${CLUB_GREEN}`
          }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
              Gastos del mes
            </p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
              {formatCurrency(monthlyExpenses)}
            </p>
          </div>
        </div>

        {/* Sección de estadísticas */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          {/* Estadísticas Generales */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
              Estadísticas Generales
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <span style={{ color: '#6b7280' }}>Total Transacciones</span>
                <strong style={{ color: '#1f2937' }}>{transactions.length}</strong>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <span style={{ color: '#6b7280' }}>Total Socios</span>
                <strong style={{ color: '#1f2937' }}>{members.length}</strong>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <span style={{ color: '#6b7280' }}>Cuotas Pagadas</span>
                <strong style={{ color: CLUB_GREEN }}>{paidFees}</strong>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <span style={{ color: '#6b7280' }}>Cuotas Pendientes</span>
                <strong style={{ color: '#ef4444' }}>{pendingFees}</strong>
              </div>
            </div>
          </div>

          {/* Información del Club */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
              Información del Club
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Club</p>
                <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>{systemData.clubName || 'Sin nombre'}</p>
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Año Fiscal</p>
                <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>{systemData.fiscalYear}</p>
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Moneda</p>
                <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>{systemData.currency}</p>
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Usuarios Activos</p>
                <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>{members.filter(m => m.active).length} de {members.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
