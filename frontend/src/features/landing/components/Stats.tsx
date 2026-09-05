import React from 'react';
import { CIFRAS } from '../data';

export function Stats() {
  return (
    <section className="stats" aria-label="Cifras del club">
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
