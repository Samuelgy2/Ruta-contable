import React from 'react';
import { Instagram } from 'lucide-react';
import { ENTRENADORES, seccionPorDefecto, SeccionLanding } from '../data';

// Iniciales para el avatar: primera letra de las dos primeras palabras.
function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

export function Entrenadores({ seccion = seccionPorDefecto('entrenadores') }: { seccion?: SeccionLanding }) {
  return (
    <section className="landing-section landing-section-alt" id="entrenadores">
      <div className="landing-container">
        <h2 className="centered">{seccion.titulo}</h2>
        {seccion.texto && <p className="landing-section-subtitle centered">{seccion.texto}</p>}

        <div className="coaches-grid">
          {ENTRENADORES.map(entrenador => (
            <div className="coach-card" key={entrenador.nombre}>
              <div className="coach-avatar" aria-hidden="true">{iniciales(entrenador.nombre)}</div>
              <h3>{entrenador.nombre}</h3>
              <p className="coach-role">{entrenador.rol}</p>
              <a
                className="coach-link"
                href={entrenador.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={16} />
                {entrenador.usuario}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Entrenadores;
