import React from 'react';
import { ExternalLink } from 'lucide-react';
import { ImageWithFallback } from '../../../shared/components/ImageWithFallback';
import { formatDate } from '../../../utils/format';
import { NoticiaLanding, SeccionLanding } from '../data';

interface NoticiasProps {
  seccion: SeccionLanding;
  noticias: NoticiaLanding[];
  // Foto de la biblioteca ya resuelta (URL y texto alternativo); null si no tiene.
  foto: (id: number | null) => { src: string; alt: string } | null;
}

// Sección "Noticias" (RF-109): tarjetas en el orden que define el administrador.
export function Noticias({ seccion, noticias, foto }: NoticiasProps) {
  if (noticias.length === 0) return null;

  return (
    <section className="landing-section landing-section-alt" id="noticias">
      <div className="landing-container">
        <h2>{seccion.titulo}</h2>
        {seccion.texto && <p className="landing-section-subtitle">{seccion.texto}</p>}

        <div className="noticias-grid">
          {noticias.map((n, i) => {
            const imagen = foto(n.imagen);
            return (
              <article className="noticia-card" key={`${n.fecha}-${i}`}>
                {imagen && (
                  <ImageWithFallback className="noticia-card-imagen" src={imagen.src} alt={imagen.alt} loading="lazy" decoding="async" />
                )}
                <div className="noticia-card-cuerpo">
                  <time className="noticia-card-fecha" dateTime={n.fecha}>{formatDate(n.fecha)}</time>
                  <h3>{n.titulo}</h3>
                  <p>{n.resumen}</p>
                  {n.enlace && (
                    <a className="noticia-card-enlace" href={n.enlace} target="_blank" rel="noopener noreferrer">
                      Leer más <ExternalLink size={14} aria-hidden="true" />
                      <span className="sr-only"> sobre {n.titulo} (abre en otra pestaña)</span>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Noticias;
