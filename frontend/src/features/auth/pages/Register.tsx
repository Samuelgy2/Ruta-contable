import React from 'react';
import { Navbar } from '../../landing/components/Navbar';
import { Footer } from '../../landing/components/Footer';
import { RegisterForm } from '../components/RegisterForm';
import { AppPage } from '../../../types/index';

interface RegisterProps {
  onNavigate: (page: AppPage) => void;
  onRegister: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
}

export function Register({ onNavigate, onRegister }: RegisterProps) {
  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} currentPage="register" />
      <div className="register-page" style={{ position: 'relative' }}>
        <RegisterForm onNavigate={onNavigate} onRegister={onRegister} />
      </div>
      <Footer />
    </div>
  );
}

export default Register;
