import React from 'react';
import { Navbar } from '../../landing/components/Navbar';
import { Footer } from '../../landing/components/Footer';
import { RegisterForm } from '../components/RegisterForm';

interface RegisterProps {
  onNavigate: (page: 'home' | 'login' | 'register') => void;
  onRegister: (data: { firstName: string; lastName: string; email: string; password: string }) => boolean;
}

export function Register({ onNavigate, onRegister }: RegisterProps) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} />
      <div className="register-page">
        <RegisterForm onNavigate={onNavigate} onRegister={onRegister} />
      </div>
      <Footer />
    </div>
  );
}
