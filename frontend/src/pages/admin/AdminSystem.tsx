// Configuración del Sistema — unifica "Datos del Club", "Usuarios" y "Landing page"
// en una sola vista con barra de navegación interna.
import React, { useState } from 'react';
import { Building2, Users, Globe } from 'lucide-react';
import { CLUB_GREEN, ToastContainer, useToast } from './system/shared';
import { ClubDataPanel } from './system/ClubDataPanel';
import { UsersPanel } from './system/UsersPanel';
import { LandingPanel } from './system/LandingPanel';

export type SystemTab = 'club-data' | 'users' | 'landing';

interface AdminSystemProps {
  onNavigate?: (tab: string) => void;
  initialTab?: SystemTab;
}

const tabs = [
  { id: 'club-data' as const, label: 'Datos del Club', icon: Building2, hint: 'Información general y parámetros de cobro' },
  { id: 'users'     as const, label: 'Usuarios',       icon: Users,     hint: 'Cuentas con acceso al sistema' },
  { id: 'landing'   as const, label: 'Landing page',   icon: Globe,     hint: 'Contenido de la página pública del club' },
];

export function AdminSystem({ onNavigate, initialTab = 'club-data' }: AdminSystemProps) {
  const [activeTab, setActiveTab] = useState<SystemTab>(initialTab);
  const { toasts, show: showToast } = useToast();

  return (
    <div className="app">
      <ToastContainer toasts={toasts} />

      <div className="container">
        {/* Encabezado del módulo */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>Configuración del Sistema</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Datos del club, usuarios con acceso y página pública, en un solo lugar
          </p>
        </div>

        {/* Barra de navegación interna */}
        <nav
          role="tablist"
          aria-label="Secciones de configuración"
          style={{
            display: 'flex', gap: '6px', padding: '6px',
            backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '14px',
            marginBottom: '20px', overflowX: 'auto',
          }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                title={tab.hint}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '10px', border: 'none',
                  backgroundColor: isActive ? CLUB_GREEN : 'transparent',
                  color: isActive ? 'white' : '#4b5563',
                  fontSize: '13px', fontWeight: isActive ? 600 : 500,
                  whiteSpace: 'nowrap', cursor: 'pointer',
                  transition: 'background-color 150ms, color 150ms',
                }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === 'club-data' && <ClubDataPanel showToast={showToast} />}
        {activeTab === 'users'     && <UsersPanel showToast={showToast} />}
        {activeTab === 'landing'   && <LandingPanel showToast={showToast} />}
      </div>
    </div>
  );
}
