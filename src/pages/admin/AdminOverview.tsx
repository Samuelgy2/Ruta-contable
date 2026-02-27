import React from 'react';
import { useData } from '../../contexts/DataContext';

interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
}

// Color verde del club
const CLUB_GREEN = '#10b981';

export function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const { systemData } = useData();

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
            Panel Admin
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
              $0.00
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
              $0.00
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
              $0.00
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
              $0.00
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
                <strong style={{ color: '#1f2937' }}>0</strong>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <span style={{ color: '#6b7280' }}>Total Socios</span>
                <strong style={{ color: '#1f2937' }}>0</strong>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <span style={{ color: '#6b7280' }}>Cuotas Pagadas</span>
                <strong style={{ color: CLUB_GREEN }}>0</strong>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px' 
              }}>
                <span style={{ color: '#6b7280' }}>Cuotas Pendientes</span>
                <strong style={{ color: '#ef4444' }}>0</strong>
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
                <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>Corporación bmx riders</p>
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
                <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>0 de 0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
