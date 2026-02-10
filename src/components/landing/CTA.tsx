import React from 'react';

interface CTAProps {
  onNavigate: (page: 'home' | 'login' | 'register') => void;
}

export function CTA({ onNavigate }: CTAProps) {
  return (
    <section className="cta">
      <div className="cta-container">
        <h2>¿Listo para comenzar?</h2>
        <p>Únete a los clubes que ya confían en ClubFinance</p>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => onNavigate('register')}
        >
          Crear Cuenta Gratis
        </button>
      </div>
    </section>
  );
}
