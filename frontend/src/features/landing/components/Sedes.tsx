import React from 'react';
import { MapPin, Plane } from 'lucide-react';
import { SEDES } from '../data';

export function Sedes() {
  return (
    <section className="landing-section" id="sedes">
      <div className="landing-container">
        <h2>Sedes y frentes</h2>
        <p className="landing-section-subtitle">
          Entrenamos en Medellín y competimos donde esté el calendario.
        </p>

        <div className="sedes-grid">
          {SEDES.map(sede => {
            const Icono = sede.badge === 'Internacional' ? Plane : MapPin;
            return (
              <div className="sede-card" key={sede.nombre}>
                <Icono size={28} />
                <div>
                  <span className="sede-card-badge">{sede.badge}</span>
                </div>
                <h3>{sede.nombre}</h3>
                <p>{sede.descripcion}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Sedes;
