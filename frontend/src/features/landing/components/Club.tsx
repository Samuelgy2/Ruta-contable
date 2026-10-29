import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { seccionPorDefecto, SeccionLanding } from '../data';

const BENEFICIOS = [
  'Acompañamiento desde el primer contacto con la bici hasta la competencia.',
  'Calendario de válidas departamentales y nacionales con la Federación Colombiana de Ciclismo.',
  'Entrenadores con trayectoria en el BMX competitivo de Antioquia.',
  'Proyección internacional: giras y competencias en Estados Unidos.',
];

// El texto se divide en párrafos por líneas en blanco.
export function Club({ seccion = seccionPorDefecto('club') }: { seccion?: SeccionLanding }) {
  return (
    <section className="landing-section" id="club">
      <div className="landing-container club-grid">
        <div className="club-text">
          <h2>{seccion.titulo}</h2>
          {seccion.texto.split(/\n\s*\n/).filter(Boolean).map((parrafo, i) => <p key={i}>{parrafo}</p>)}
          <ul className="club-benefits">
            {BENEFICIOS.map(beneficio => (
              <li key={beneficio}>
                <CheckCircle2 size={20} />
                <span>{beneficio}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="club-promise">
          <span className="club-promise-label">NUESTRA PROMESA</span>
          <h3>Un proceso serio para cada rider, sin importar la edad con la que llega.</h3>
          <p>
            Cada categoría tiene su plan: iniciación para los más pequeños, formación con
            ranking para quienes ya compiten, y preparación de élite para quienes apuntan
            al calendario internacional.
          </p>
          <a className="btn" href="#escuela">Conoce la escuela</a>
        </aside>
      </div>
    </section>
  );
}

export default Club;
