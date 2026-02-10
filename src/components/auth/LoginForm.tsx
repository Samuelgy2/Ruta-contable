import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onNavigate: (page: 'home' | 'login' | 'register') => void;
}

export function LoginForm({ onNavigate }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor, ingresa usuario y contraseña');
      return;
    }

    const success = login(username, password);
    if (!success) {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login-card">
      <div className="login-title">
        <h1>Iniciar Sesión</h1>
        <p>Ingresa tus credenciales para acceder al sistema</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingresa tu usuario"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
          />
        </div>

        {error && (
          <div className="form-error-box">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }}>
          Iniciar Sesión
        </button>

        <div className="login-footer">
          <p>
            ¿No tienes una cuenta?{' '}
            <a onClick={() => onNavigate('register')} style={{ cursor: 'pointer', color: 'var(--color-green)' }}>
              Regístrate aquí
            </a>
          </p>
        </div>
      </form>

      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-gray-200)' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-gray-600)', marginBottom: '16px' }}>
          Credenciales de prueba:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <div style={{ background: 'var(--color-gray-50)', padding: '12px', borderRadius: '8px' }}>
            <strong>Administrador:</strong> admin / admin123
          </div>
          <div style={{ background: 'var(--color-gray-50)', padding: '12px', borderRadius: '8px' }}>
            <strong>Usuario:</strong> usuario / usuario123
          </div>
        </div>
      </div>
    </div>
  );
}
