import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { RegisterForm } from '../components/auth/RegisterForm';

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
