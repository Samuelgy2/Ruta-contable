import React from 'react';
import { Logo } from '../../../shared/components/Logo';

interface NavbarProps {
  onNavigate: (page: 'home' | 'login' | 'register') => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
          <Logo />
        </div>
        
        <div className="navbar-buttons">
          <button 
            className="btn btn-outline"
            onClick={() => onNavigate('register')}
          >
            Registrarse
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('login')}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
