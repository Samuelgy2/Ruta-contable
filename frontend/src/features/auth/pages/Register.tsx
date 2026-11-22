import React from 'react';
import { Navbar } from '../../landing/components/Navbar';
import { Footer } from '../../landing/components/Footer';
import { RegisterForm } from '../components/RegisterForm';
import { AppPage } from '../../../types/index';

interface RegisterProps {
  onNavigate: (page: AppPage) => void;
}

export function Register({ onNavigate }: RegisterProps) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} currentPage="register" />
      <div className="register-page" style={{ position: 'relative' }}>
        <RegisterForm onNavigate={onNavigate} />
      </div>
      <Footer />
    </div>
  );
}

export default Register;
