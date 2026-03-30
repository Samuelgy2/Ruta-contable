import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';

interface AdminClubDataProps {
  onNavigate?: (tab: string) => void;
}

// Color verde del club
const CLUB_GREEN = '#10b981';

export function AdminClubData({ onNavigate }: AdminClubDataProps) {
  const { systemData, updateSystemData } = useData();
  const [formData, setFormData] = useState(systemData);

  // Actualizar el formulario cuando systemData cambie
  useEffect(() => {
    setFormData(systemData);
  }, [systemData]);

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemData(formData);
    alert('Datos del club actualizados correctamente');
  };

  return (
    <div className="app">
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
            Datos del Club
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Configura la información general de tu club
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          padding: '24px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '800px'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Nombre del Club
                </label>
                <input 
                  type="text" 
                  value={formData.clubName}
                  onChange={(e) => setFormData({...formData, clubName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  RUT/ID Fiscal
                </label>
                <input 
                  type="text" 
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Dirección
                </label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Teléfono
                </label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Email
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Moneda
                </label>
                <select 
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  required
                >
                  <option value="COP">Peso Colombiano (COP)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Año Fiscal
                </label>
                <input 
                  type="text" 
                  value={formData.fiscalYear}
                  onChange={(e) => setFormData({...formData, fiscalYear: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="2024"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button 
                type="submit" 
                style={{
                  backgroundColor: CLUB_GREEN,
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
