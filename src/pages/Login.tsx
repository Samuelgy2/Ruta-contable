import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { LoginForm } from '../components/auth/LoginForm';

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
