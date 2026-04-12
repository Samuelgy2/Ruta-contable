import { useState, FormEvent, ChangeEvent, CSSProperties } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PasswordInput } from '../../../components/ui/password-input';
import { AppPage } from '../../../types/index';

interface LoginProps {
  onNavigate: (page: AppPage) => void;
}

interface LoginFormProps {
  onNavigate: (page: AppPage) => void;
  backgroundColor?: string;
  backgroundImage?: string;
}

export function LoginForm({ onNavigate, backgroundColor, backgroundImage }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor, ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const success = await login(username, password);
      if (!success) {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: CSSProperties = {
    ...(backgroundImage && { backgroundImage }),
    ...(backgroundColor && !backgroundImage && { backgroundColor }),
  };
  

  return (
    
    

    <div className="login-card" style={containerStyle}>
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            placeholder="admin@rutacontable.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <PasswordInput
            id="password"
            className="form-input"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            disabled={loading}
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <a 
            onClick={() => onNavigate('forgot-password')} 
            style={{ cursor: 'pointer', color: 'var(--color-green)', fontSize: '14px' }}
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {error && (
          <div className="form-error-box">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary btn-large" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}
