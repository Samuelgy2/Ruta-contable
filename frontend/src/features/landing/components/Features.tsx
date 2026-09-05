import React from 'react';
import { Sprout, Flag, Trophy } from 'lucide-react';

// Sección "Escuela": los tres niveles de formación del club.
// Reutiliza .features, .features-grid y .feature-card de index.css.
const NIVELES = [
  {
    icono: Sprout,
    meta: 'Iniciación · 4 a 8 años',
    titulo: 'Semillero',
    descripcion: 'Primer contacto con la bici y la pista. Equilibrio, confianza y juego, con el uniforme verde y negro del club.',
  },
  {
    icono: Flag,
    meta: 'Formación · 8 a 16 años',
    titulo: 'BMX Competitivo',
    descripcion: 'Técnica de partida, salto y curva, con calendario de válidas y puntos en el ranking departamental y nacional.',
  },
  {
    icono: Trophy,
    meta: 'Élite',
    titulo: 'Alto Rendimiento',
    descripcion: 'Preparación física, planificación por temporada, calendario UCI y giras de competencia a Estados Unidos.',
  },
];

export function Features() {
  return (
    <section className="features" id="escuela">
      <div className="features-container">
        <h2>Escuela</h2>
        <p className="features-subtitle">
          Tres niveles, un mismo camino: de la primera rodada al podio.
        </p>

        <div className="features-grid">
          {NIVELES.map(nivel => {
            const Icono = nivel.icono;
            return (
              <div className="feature-card" key={nivel.titulo}>
                <div className="feature-icon">
                  <Icono size={40} color="var(--color-primary)" />
                </div>
                <span className="feature-card-meta">{nivel.meta}</span>
                <h3>{nivel.titulo}</h3>
                <p>{nivel.descripcion}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
