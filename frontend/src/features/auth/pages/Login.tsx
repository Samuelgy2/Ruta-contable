import React from 'react';
import { Navbar } from '../../landing/components/Navbar';
import { Footer } from '../../landing/components/Footer';
import { LoginForm } from '../components/LoginForm';

interface LoginProps {
  onNavigate: (page: 'home' | 'login' | 'register') => void;
}

export function Login({ onNavigate }: LoginProps) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} />
      <div className="login-page">
        <LoginForm onNavigate={onNavigate} />
      </div>
      <Footer />
    </div>
  );
}
