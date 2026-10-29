import React from 'react';
import clubLogo from '@/images/logo/club-logo.png';
import { ImageWithFallback } from '../../../shared/components/ImageWithFallback';
import { CLUB, GALERIA, seccionPorDefecto, SeccionLanding } from '../data';

interface GaleriaProps {
  seccion?: SeccionLanding;
  // Fotos subidas desde el panel. Sin fotos, cada tarjeta muestra el logo como
  // marca de agua con los títulos por defecto de GALERIA (data.ts).
  imagenes?: { src: string; alt: string }[];
  instagram?: string | null;
}

export function Galeria({ seccion = seccionPorDefecto('galeria'), imagenes = [], instagram = CLUB.instagram }: GaleriaProps) {
  const fotos = imagenes.length
    ? imagenes.map(i => ({ titulo: i.alt, imagen: i.src as string | undefined }))
    : GALERIA;

  return (
    <section className="landing-section" id="galeria">
      <div className="landing-container">
        <h2 className="centered">{seccion.titulo}</h2>
        {seccion.texto && <p className="landing-section-subtitle centered">{seccion.texto}</p>}

        <div className="gallery-grid">
          {fotos.map((foto, i) => {
            const contenido = (
              <>
                {foto.imagen ? (
                  <ImageWithFallback src={foto.imagen} alt={foto.titulo} loading="lazy" decoding="async" />
                ) : (
                  <div className="gallery-placeholder" aria-hidden="true">
                    <ImageWithFallback src={clubLogo} alt="" />
                  </div>
                )}
                <span className="gallery-caption">{foto.titulo}</span>
              </>
            );
            return instagram ? (
              <a
                className="gallery-item"
                key={i}
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${foto.titulo} — ver en Instagram`}
              >
                {contenido}
              </a>
            ) : (
              <div className="gallery-item" key={i}>{contenido}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Galeria;
