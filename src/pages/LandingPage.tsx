import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { About } from '../components/landing/About';
import { CTA } from '../components/landing/CTA';

interface LandingPageProps {
  onNavigate: (page: 'home' | 'login' | 'register') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} />
      <Hero onNavigate={onNavigate} />
      <Features />
      <About />
      <CTA onNavigate={onNavigate} />
      <Footer />
    </div>
  );
}
