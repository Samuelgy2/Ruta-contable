import React from 'react';
import { MapPin, Plane } from 'lucide-react';
import { SEDES, seccionPorDefecto, SeccionLanding } from '../data';

export function Sedes({ seccion = seccionPorDefecto('sedes') }: { seccion?: SeccionLanding }) {
  return (
    <section className="landing-section" id="sedes">
      <div className="landing-container">
        <h2>{seccion.titulo}</h2>
        {seccion.texto && <p className="landing-section-subtitle">{seccion.texto}</p>}

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
