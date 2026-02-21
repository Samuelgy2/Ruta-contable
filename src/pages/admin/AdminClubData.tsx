import React, { useState } from 'react';
import { Header } from '../../components/common/Header';
import { useData } from '../../contexts/DataContext';

interface AdminClubDataProps {
  onNavigate?: (tab: string) => void;
}

export function AdminClubData({ onNavigate }: AdminClubDataProps) {
  const { systemData, updateSystemData } = useData();
  const [formData, setFormData] = useState(systemData);
  const [saved, setSaved] = useState(false);

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemData(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    alert('Datos del club actualizados correctamente');
  };

  return (
    <div className="app">
      <Header onNavigate={handleNavigate} showDropdown={true} />
      
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: 0, marginBottom: '8px' }}>Datos del Club</h3>
          <p style={{ color: 'var(--color-gray-600)', margin: 0 }}>
            Configura la información general de tu club
          </p>
        </div>

        <div className="admin-card" style={{ maxWidth: '800px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Nombre del Club
                </label>
                <input 
                  type="text" 
                  value={formData.clubName}
                  onChange={(e) => setFormData({...formData, clubName: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  NIT / Identificación Fiscal
                </label>
                <input 
                  type="text" 
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Dirección
                </label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Teléfono
                </label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Moneda
                </label>
                <select 
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="input"
                  required
                >
                  <option value="COP">Peso Colombiano (COP)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Año Fiscal
                </label>
                <input 
                  type="text" 
                  value={formData.fiscalYear}
                  onChange={(e) => setFormData({...formData, fiscalYear: e.target.value})}
                  className="input"
                  placeholder="2024"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary">
                Guardar Cambios
              </button>
              {saved && (
                <span style={{ color: 'var(--color-green)', fontWeight: '500' }}>
                  ✓ Cambios guardados
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
