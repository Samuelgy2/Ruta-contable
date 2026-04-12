import React, { useState } from 'react';
import { Navbar } from '../../landing/components/Navbar';
import { Footer } from '../../landing/components/Footer';

interface ForgotPasswordProps {
  onNavigate: (page: 'home' | 'login' | 'register' | 'forgot-password') => void;
}

export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message);
      }

    } catch (error) {
      setError('Error al conectar con el servidor. Intenta de nuevo.');
    }
  };

  if (submitted) {
    return (
      <div className="landing-page">
        <Navbar onNavigate={onNavigate} />
        <div className="forgot-password-page">
          <div className="forgot-password-card">
            <div className="success-icon">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ color: '#10b981' }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1>Correo Enviado</h1>
            <p>
              Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
              Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <p className="note">
              ¿No recibiste el correo? Revisa tu carpeta de spam o{' '}
              <button 
                onClick={() => setSubmitted(false)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#10b981', 
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 'inherit'
                }}
              >
                intenta de nuevo
              </button>
            </p>
            <button 
              onClick={() => onNavigate('login')}
              className="btn btn-primary btn-large"
              style={{ width: '100%', marginTop: '24px' }}
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="landing-page">
      <Navbar onNavigate={onNavigate} />
      <div className="forgot-password-page">
        <div className="forgot-password-card">
          <div className="forgot-password-title">
            <h1>Recuperar Contraseña</h1>
            <p>Ingresa tu correo electrónico y te enviaremos un enlace para recuperar tu contraseña</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo electrónico"
              />
            </div>

            {error && (
              <div className="form-error-box">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }}>
              Enviar Enlace de Recuperación
            </button>

            <div className="forgot-password-footer">
              <p>
                ¿Recordaste tu contraseña?{' '}
                <a 
                  onClick={() => onNavigate('login')} 
                  style={{ cursor: 'pointer', color: 'var(--color-green)' }}
                >
                  Iniciar Sesión
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
