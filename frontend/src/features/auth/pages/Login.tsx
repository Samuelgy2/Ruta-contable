import React from 'react';
import { Navbar } from '../../landing/components/Navbar';
import { Footer } from '../../landing/components/Footer';
import { LoginForm } from '../components/LoginForm';
import { AppPage } from '../../../types/index';

interface LoginProps {
  onNavigate: (page: AppPage) => void;
}

export function Login({ onNavigate }: LoginProps) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} currentPage="login" />
      <div className="login-page" style={{ position: 'relative' }}>
        <LoginForm onNavigate={onNavigate} />
      </div>
      <Footer />
    </div>
  );
}