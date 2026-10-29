import React, { useEffect, useState } from 'react';
import '../landing.css';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Stats } from '../components/Stats';
import { Club } from '../components/Club';
import { Features } from '../components/Features';
import { Sedes } from '../components/Sedes';
import { Entrenadores } from '../components/Entrenadores';
import { Galeria } from '../components/Galeria';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';
import { AppPage } from '../../../types/index';
import {
  ContenidoLanding, ImagenLanding, SeccionLanding, LANDING_POR_DEFECTO, enlacesDe, instagramDe,
} from '../data';
import { landingService, LandingPublicada } from '../../../services/landingService';

interface LandingVistaProps {
  contenido: ContenidoLanding;
  imagenes: ImagenLanding[];
  // URL de cada imagen: pública en la landing, object URL en la vista previa.
  srcImagen: (id: number) => string | undefined;
  onNavigate: (page: AppPage) => void;
}

// Renderiza un contenido de landing: secciones visibles en el orden recibido.
// La usan la landing pública y la vista previa del editor.
export function LandingVista({ contenido, imagenes, srcImagen, onNavigate }: LandingVistaProps) {
  const altDe = new Map(imagenes.map(i => [i.id, i.alt]));
  const fotos = (s: SeccionLanding) => s.imagenes
    .map(id => ({ src: srcImagen(id), alt: altDe.get(id) }))
    .filter((f): f is { src: string; alt: string } => Boolean(f.src && f.alt));
  const instagram = instagramDe(contenido.contacto)?.url ?? null;
  const enlaces = enlacesDe(contenido);

  const seccion = (s: SeccionLanding) => {
    switch (s.id) {
      case 'inicio':       return <Hero onNavigate={onNavigate} seccion={s} imagenes={fotos(s)} instagram={instagram} />;
      case 'cifras':       return <Stats titulo={s.titulo} />;
      case 'club':         return <Club seccion={s} />;
      case 'escuela':      return <Features seccion={s} />;
      case 'sedes':        return <Sedes seccion={s} />;
      case 'entrenadores': return <Entrenadores seccion={s} />;
      case 'galeria':      return <Galeria seccion={s} imagenes={fotos(s)} instagram={instagram} />;
      case 'contacto':     return <CTA seccion={s} contacto={contenido.contacto} />;
    }
  };

  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} currentPage="home" enlaces={enlaces} />
      {contenido.secciones.filter(s => s.visible).map(s => (
        <React.Fragment key={s.id}>{seccion(s)}</React.Fragment>
      ))}
      <Footer onNavigate={onNavigate} contacto={contenido.contacto} enlaces={enlaces} />
    </div>
  );
}

interface HomeProps {
  onNavigate: (page: AppPage) => void;
}

// Landing pública: sólo la versión publicada; sin ella, el contenido por defecto (RF-097).
export function Home({ onNavigate }: HomeProps) {
  // undefined = cargando; null = sin versión publicada o backend sin respuesta.
  const [publicada, setPublicada] = useState<LandingPublicada | null | undefined>(undefined);

  useEffect(() => {
    landingService.getPublicada().then(setPublicada, () => setPublicada(null));
  }, []);

  if (publicada === undefined) return <div className="landing-page" aria-busy="true" />;

  return (
    <LandingVista
      contenido={publicada?.contenido ?? LANDING_POR_DEFECTO}
      imagenes={publicada?.imagenes ?? []}
      srcImagen={landingService.urlImagenPublica}
      onNavigate={onNavigate}
    />
  );
}

export default Home;
