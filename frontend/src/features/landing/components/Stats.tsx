import React from 'react';
import { CIFRAS } from '../data';

interface StatsProps {
  titulo?: string;
}

export function Stats({ titulo = 'Cifras del club' }: StatsProps) {
  return (
    <section className="stats" aria-label={titulo}>
      <div className="stats-row">
        {CIFRAS.map(cifra => (
          <div className="stat-item" key={cifra.etiqueta}>
            <strong>{cifra.valor}</strong>
            <span>{cifra.etiqueta}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stats;
