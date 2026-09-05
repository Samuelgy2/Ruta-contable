import React from 'react';
import clubLogo from '@/images/logo/club-logo.png';
import { ImageWithFallback } from '../../../shared/components/ImageWithFallback';
import { CLUB, GALERIA } from '../data';

// Las fotos reales van en frontend/src/images/gallery/ y se asignan en el campo
// `imagen` de cada entrada de GALERIA (data.ts). Mientras no haya, cada tarjeta
// muestra el logo como marca de agua y enlaza al Instagram del club.
export function Galeria() {
  return (
    <section className="landing-section" id="galeria">
      <div className="landing-container">
        <h2 className="centered">Galería</h2>
        <p className="landing-section-subtitle centered">
          Podios, partidas y semillero. Todo el día a día del club está en {CLUB.instagramUsuario}.
        </p>

        <div className="gallery-grid">
          {GALERIA.map(foto => (
            <a
              className="gallery-item"
              key={foto.titulo}
              href={CLUB.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${foto.titulo} — ver en Instagram`}
            >
              {foto.imagen ? (
                <ImageWithFallback src={foto.imagen} alt={foto.titulo} />
              ) : (
                <div className="gallery-placeholder" aria-hidden="true">
                  <ImageWithFallback src={clubLogo} alt="" />
                </div>
              )}
              <span className="gallery-caption">{foto.titulo}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Galeria;
