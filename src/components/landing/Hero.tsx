import React from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface HeroProps {
  onNavigate: (page: 'home' | 'login' | 'register') => void;
}

export function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Gestión Financiera para tu Club</h1>
        <p>
          Administra transacciones, miembros y cuotas de manera simple y eficiente.
          Todo lo que necesitas en un solo lugar.
        </p>
        <div className="hero-buttons">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => onNavigate('register')}
          >
            Comenzar Ahora
          </button>
          <button 
            className="btn btn-outline btn-large"
            onClick={() => onNavigate('login')}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
      <div className="hero-image">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtd29yayUyMGNvbGxhYm9yYXRpb258ZW58MXx8fHwxNzYxMzM0MTcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Trabajo en equipo"
        />
      </div>
    </section>
  );
}
