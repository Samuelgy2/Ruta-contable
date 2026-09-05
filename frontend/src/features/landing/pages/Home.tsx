import React from 'react';
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

interface HomeProps {
  onNavigate: (page: AppPage) => void;
}

// Landing pública de Riders - Club de BMX, en este orden:
// Navbar, Hero (con carrusel), Cifras, El club, Escuela, Sedes, Entrenadores,
// Galería, Contacto y Footer.
export function Home({ onNavigate }: HomeProps) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} currentPage="home" />
      <Hero onNavigate={onNavigate} />
      <Stats />
      <Club />
      <Features />
      <Sedes />
      <Entrenadores />
      <Galeria />
      <CTA />
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export default Home;
