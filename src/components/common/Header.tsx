import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from './Logo';

interface HeaderProps {
  onNavigate?: (tab: string) => void;
  showDropdown?: boolean;
}

export function Header({ onNavigate, showDropdown }: HeaderProps) {
  const { currentUser, logout } = useAuth();

  return (
    <div className="header">
      <div className="header-content">
        <div className="user-info">
          <span>{currentUser?.fullName}</span>
          <span className={currentUser?.role === 'admin' ? 'badge-active' : 'badge-pending'} style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {currentUser?.role === 'admin' ? 'Administrador' : 'Usuario'}
          </span>
        </div>

        <div className="header-actions">
          <Logo />
          <button onClick={logout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
