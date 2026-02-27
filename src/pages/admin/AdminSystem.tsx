import React from 'react';
import { useData } from '../../contexts/DataContext';
import { exportToJSON } from '../../utils/export';

interface AdminSystemProps {
  onNavigate?: (tab: string) => void;
}

export function AdminSystem({ onNavigate }: AdminSystemProps) {
  const { transactions, members, fees, categories, systemData, users, resetAllData } = useData();

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleExportAllData = () => {
    const data = {
      transactions,
      members,
      fees,
      categories,
      systemData,
      users,
      exportDate: new Date().toISOString(),
    };
    exportToJSON(data, `backup-completo-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleResetSystem = () => {
    if (confirm('¿ESTÁS COMPLETAMENTE SEGURO? Esta acción eliminará TODOS los datos y NO se puede deshacer.')) {
      if (confirm('Última confirmación: ¿Eliminar todos los datos del sistema?')) {
        resetAllData();
        alert('Sistema reiniciado correctamente');
      }
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: 0, marginBottom: '8px' }}>Configuración del Sistema</h3>
          <p style={{ color: 'var(--color-gray-600)', margin: 0 }}>
            Herramientas administrativas y mantenimiento del sistema
          </p>
        </div>

        <div className="admin-grid">
          {/* Información del sistema */}
          <div className="admin-card">
            <h3>Información del Sistema</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Transacciones</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{transactions.length}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Miembros</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{members.length}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Categorías</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{categories.length}</p>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-gray-50)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px' }}>Usuarios</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{users.length}</p>
              </div>
            </div>
          </div>

          {/* Herramientas */}
          <div className="admin-card">
            <h3>Herramientas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleExportAllData}
                className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
              >
                <span style={{ marginRight: '12px' }}>💾</span>
                Exportar Backup Completo
              </button>
              <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', margin: 0 }}>
                Descarga todos los datos del sistema en formato JSON
              </p>
            </div>
          </div>

          {/* Peligro */}
          <div className="admin-card" style={{ border: '2px solid var(--color-red)', gridColumn: 'span 2' }}>
            <h3 style={{ color: 'var(--color-red)' }}>⚠️ Zona de Peligro</h3>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: '16px' }}>
              Las siguientes acciones son irreversibles. Procede con precaución.
            </p>
            <button 
              onClick={handleResetSystem}
              className="btn btn-danger"
              style={{ width: '100%' }}
            >
              🔄 Reiniciar Sistema
            </button>
            <p style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginTop: '12px' }}>
              Elimina todos los datos y restaura el sistema a su estado inicial. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
