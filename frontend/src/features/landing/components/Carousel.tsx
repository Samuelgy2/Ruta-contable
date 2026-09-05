import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clubLogo from '@/images/logo/club-logo.png';
import { ImageWithFallback } from '../../../shared/components/ImageWithFallback';

export interface Slide {
  titulo: string;
  descripcion: string;
  imagen?: string;
}

interface CarouselProps {
  slides: Slide[];
  // Milisegundos entre cambios automáticos. 0 desactiva el autoplay.
  autoplayMs?: number;
  className?: string;
}

export function Carousel({ slides, autoplayMs = 5000, className = '' }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [indice, setIndice] = useState(0);
  const pausado = useRef(false);

  const anterior = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const siguiente = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const irA = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  // Mantiene el punto activo sincronizado con el slide visible.
  useEffect(() => {
    if (!emblaApi) return;
    const actualizar = () => setIndice(emblaApi.selectedScrollSnap());
    actualizar();
    emblaApi.on('select', actualizar);
    emblaApi.on('reInit', actualizar);
    return () => {
      emblaApi.off('select', actualizar);
      emblaApi.off('reInit', actualizar);
    };
  }, [emblaApi]);

  // Autoplay propio: avanza cada autoplayMs salvo que el ratón esté encima.
  useEffect(() => {
    if (!emblaApi || autoplayMs <= 0) return;
    const temporizador = window.setInterval(() => {
      if (!pausado.current) emblaApi.scrollNext();
    }, autoplayMs);
    return () => window.clearInterval(temporizador);
  }, [emblaApi, autoplayMs]);

  return (
    <div
      className={`carousel ${className}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-label="Galería del club"
      onMouseEnter={() => { pausado.current = true; }}
      onMouseLeave={() => { pausado.current = false; }}
    >
      <div className="carousel-viewport" ref={emblaRef}>
        <div className="carousel-track">
          {slides.map((slide, i) => (
            <div
              className="carousel-slide"
              key={slide.titulo}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${slides.length}: ${slide.titulo}`}
            >
              {slide.imagen ? (
                <ImageWithFallback src={slide.imagen} alt={slide.titulo} className="carousel-photo" />
              ) : (
                // Sin foto: el logo del club como marca de agua.
                <div className="carousel-watermark" aria-hidden="true">
                  <img src={clubLogo} alt="" />
                </div>
              )}
              <div className="carousel-caption">
                <h3>{slide.titulo}</h3>
                <p>{slide.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="carousel-arrow carousel-arrow-prev"
        onClick={anterior}
        aria-label="Slide anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        className="carousel-arrow carousel-arrow-next"
        onClick={siguiente}
        aria-label="Slide siguiente"
      >
        <ChevronRight size={20} />
      </button>

      <div className="carousel-dots" role="tablist" aria-label="Elegir slide">
        {slides.map((slide, i) => (
          <button
            key={slide.titulo}
            type="button"
            role="tab"
            className={`carousel-dot ${i === indice ? 'is-active' : ''}`.trim()}
            aria-label={`Ir al slide ${i + 1}: ${slide.titulo}`}
            aria-selected={i === indice}
            onClick={() => irA(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousel;
