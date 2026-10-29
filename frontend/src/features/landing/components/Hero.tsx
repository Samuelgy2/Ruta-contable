import React from 'react';
import { MapPin } from 'lucide-react';
import { AppPage } from '../../../types/index';
import { Carousel } from './Carousel';
import { CLUB, SLIDES, seccionPorDefecto, SeccionLanding } from '../data';

interface HeroProps {
  onNavigate: (page: AppPage) => void;
  seccion?: SeccionLanding;
  // Imágenes del carrusel; sin imágenes se usan los slides por defecto.
  imagenes?: { src: string; alt: string }[];
  instagram?: string | null;
}

export function Hero({ seccion = seccionPorDefecto('inicio'), imagenes = [], instagram = CLUB.instagram }: HeroProps) {
  // Lo que va tras la primera coma se resalta, como el titular original.
  const coma = seccion.titulo.indexOf(',');
  const slides = imagenes.length
    ? imagenes.map(i => ({ titulo: i.alt, descripcion: '', imagen: i.src }))
    : SLIDES;

  return (
    <section className="hero" id="inicio">
      <div className="hero-content">
        <span className="hero-tag">
          <MapPin size={14} />
          {CLUB.ciudad} · {CLUB.departamento} · {CLUB.pais}
        </span>
        <h1>
          {coma > 0
            ? <>{seccion.titulo.slice(0, coma + 1)} <span>{seccion.titulo.slice(coma + 1).trim()}</span></>
            : seccion.titulo}
        </h1>
        {seccion.texto && <p>{seccion.texto}</p>}
        <div className="hero-buttons">
          <a className="btn btn-large" href="#contacto">
            Inscribe a tu rider
          </a>
          {instagram && (
            <a
              className="btn btn-secondary btn-large"
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Síguenos en Instagram
            </a>
          )}
        </div>
      </div>

      {/* En móvil el carrusel sube por encima del texto (.hero-carousel, order:-1). */}
      <div className="hero-carousel">
        <Carousel slides={slides} />
      </div>
    </section>
  );
}

export default Hero;
