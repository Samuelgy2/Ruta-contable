import React from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function About() {
  return (
    <section className="about">
      <div className="about-container">
        <div className="about-image">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1563212034-a3c52118cce2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNlJTIwYWNjb3VudGluZ3xlbnwxfHx8fDE3NjEzMzc1NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Finanzas"
          />
        </div>
        <div className="about-content">
          <h2>Simplifica la Contabilidad de tu Club</h2>
          <p>
            ClubFinance nace de la necesidad de ofrecer una solución simple
            y efectiva para la gestión financiera de clubes y organizaciones.
          </p>
          <p>
            Con nuestro sistema, podrás dedicar más tiempo a lo que realmente
            importa: hacer crecer tu comunidad.
          </p>
          <ul className="about-list">
            <li>✓ Fácil de usar, sin necesidad de conocimientos técnicos</li>
            <li>✓ Diseñado específicamente para clubes y asociaciones</li>
            <li>✓ Soporte dedicado para resolver tus dudas</li>
            <li>✓ Actualizaciones constantes con nuevas funcionalidades</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
