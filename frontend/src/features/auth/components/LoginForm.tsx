import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PasswordInput } from '../../../components/ui/password-input';
import { AppPage } from '../../../types/index';

interface LoginFormProps {
  onNavigate: (page: AppPage) => void;
  backgroundColor?: string;
  backgroundImage?: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'error' | 'warning';

interface Toast { id: number; message: string; type: ToastType; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: ToastType = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    error:   { bg: '#fef2f2', border: '#ef4444', icon: '✕' },
    warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠' },
  };
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => {
        const c = colors[t.type];
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: c.bg, border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${c.border}`, borderRadius: '10px',
            padding: '14px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: '280px', maxWidth: '380px', animation: 'slideIn 0.25s ease',
          }}>
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%',
              backgroundColor: c.border, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', flexShrink: 0,
            }}>{c.icon}</span>
            <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LoginForm({ onNavigate, backgroundColor, backgroundImage }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [fadeOut,  setFadeOut]  = useState(false);
  const { login } = useAuth();
  const { toasts, show: showToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      showToast('Por favor, ingresa usuario y contraseña', 'warning');
      return;
    }

    setLoading(true);
    try {
      const success = await login(username, password);
      if (!success) {
        showToast('Usuario o contraseña incorrectos', 'error');
        setLoading(false);
      } else {
        await new Promise(res => setTimeout(res, 900));
        setFadeOut(true);
        await new Promise(res => setTimeout(res, 500));
      }
    } catch {
      showToast('Error al iniciar sesión. Por favor, intenta de nuevo.', 'error');
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    ...(backgroundImage && { backgroundImage }),
    ...(backgroundColor && !backgroundImage && { backgroundColor }),
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .login-input-field:focus {
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.15) !important;
          outline: none;
        }
        .forgot-link:hover {
          color: var(--color-primary-dark) !important;
          text-decoration: underline;
        }
      `}</style>

      <ToastContainer toasts={toasts} />

      {/* ── Overlay de carga ──────────────────────────────────── */}
      {loading && (
        <div style={{
          position:        'fixed', inset: 0, zIndex: 9998,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display:         'flex', alignItems: 'center', justifyContent: 'center',
          opacity:         fadeOut ? 0 : 1,
          transition:      'opacity 0.5s ease',
        }}>
          <div style={{
            background:  'white',
            padding:     '40px 48px',
            borderRadius:'20px',
            textAlign:   'center',
            minWidth:    '220px',
            boxShadow:   '0 20px 60px rgba(0,0,0,0.2)',
            opacity:     fadeOut ? 0 : 1,
            transform:   fadeOut ? 'scale(0.95) translateY(8px)' : 'scale(1) translateY(0)',
            transition:  'opacity 0.4s ease, transform 0.4s ease',
          }}>
            <div style={{
              width: '44px', height: '44px',
              border: '3px solid #e5e7eb', borderTop: '3px solid #10b981',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              margin: '0 auto 20px',
            }} />
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '15px', color: '#111827' }}>
              {fadeOut ? '¡Bienvenido!' : 'Iniciando sesión...'}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
              {fadeOut ? 'Cargando tu espacio de trabajo' : 'Verificando credenciales'}
            </p>
          </div>
        </div>
      )}

      {/* ── Tarjeta login ─────────────────────────────────────── */}
      <div
        className="login-card"
        style={{
          ...containerStyle,
          animation: 'fadeUp 0.4s ease',
        }}
      >
        {/* Cabecera */}
        <div className="login-title" style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: '#ecfdf5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '26px',
            margin: '0 auto 16px',
          }}>🔐</div>
          <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            Iniciar Sesión
          </h1>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Usuario */}
          <div className="form-group">
            <label htmlFor="username" style={{
              display: 'block', marginBottom: '6px',
              fontWeight: 600, color: '#374151', fontSize: '13px',
            }}>
              Usuario
            </label>
            <input
              id="username"
              type="text"
              className="form-input login-input-field"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              placeholder="admin@rutacontable.com"
              disabled={loading}
              style={{ width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }}
            />
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label htmlFor="password" style={{
              display: 'block', marginBottom: '6px',
              fontWeight: 600, color: '#374151', fontSize: '13px',
            }}>
              Contraseña
            </label>
            <PasswordInput
              id="password"
              className="form-input login-input-field"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />
          </div>

          {/* ¿Olvidaste tu contraseña? */}
          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <a
              className="forgot-link"
              onClick={() => onNavigate('forgot-password')}
              style={{
                cursor: 'pointer', color: 'var(--color-green)',
                fontSize: '13px', fontWeight: 500,
                transition: 'color 0.15s',
              }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:           '100%',
              padding:         '13px',
              borderRadius:    '10px',
              border:          'none',
              backgroundColor: loading ? '#6ee7b7' : 'var(--color-primary)',
              color:           'white',
              fontSize:        '15px',
              fontWeight:      700,
              cursor:          loading ? 'not-allowed' : 'pointer',
              boxShadow:       '0 2px 8px rgba(16,185,129,0.35)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             '8px',
              transition:      'background-color 0.15s, transform 0.15s',
              marginTop:       '4px',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            {loading && (
              <span style={{
                width: '16px', height: '16px',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </>
  );
}