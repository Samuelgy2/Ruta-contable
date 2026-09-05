import React from 'react';
import { MapPin } from 'lucide-react';
import { AppPage } from '../../../types/index';
import { Carousel } from './Carousel';
import { CLUB, SLIDES } from '../data';

interface HeroProps {
  onNavigate: (page: AppPage) => void;
}

export function Hero(_props: HeroProps) {
  return (
    <section className="hero" id="inicio">
      <div className="hero-content">
        <span className="hero-tag">
          <MapPin size={14} />
          {CLUB.ciudad} · {CLUB.departamento} · {CLUB.pais}
        </span>
        <h1>Formamos riders, <span>construimos campeones</span></h1>
        <p>
          Semillero desde los 4 años, formación competitiva y alto rendimiento.
          Acompañamos a cada rider desde su primer contacto con la bici hasta el podio.
        </p>
        <div className="hero-buttons">
          <a className="btn btn-large" href="#contacto">
            Inscribe a tu rider
          </a>
          <a
            className="btn btn-secondary btn-large"
            href={CLUB.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Síguenos en Instagram
          </a>
        </div>
      </div>

      {/* En móvil el carrusel sube por encima del texto (.hero-carousel, order:-1). */}
      <div className="hero-carousel">
        <Carousel slides={SLIDES} />
      </div>
    </section>
  );
}

export default Hero;
