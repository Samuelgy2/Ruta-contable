import { useState, useRef, useCallback, CSSProperties } from 'react';
import { AppPage } from '../../../types/index';

interface ForgotPasswordProps {
  onNavigate: (page: AppPage) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CLUB_GREEN = '#10b981';

type Step = 'email' | 'otp' | 'reset' | 'done';

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; message: string; type: ToastType; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: '#f0fdf4', border: '#10b981', icon: '✓' },
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

// ─── Componente principal ─────────────────────────────────────────────────────
export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [step,         setStep]         = useState<Step>('email');
  const [email,        setEmail]        = useState('');
  const [otp,          setOtp]          = useState(['', '', '', '', '', '']);
  const [resetToken,   setResetToken]   = useState('');
  const [newPassword,  setNewPassword]  = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const { toasts, show: showToast } = useToast();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const inputStyle: CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid #e5e7eb', borderRadius: '10px',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white', color: '#111827',
    transition: 'border-color 0.15s',
  };

  // ── Paso 1: enviar email ───────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { showToast('Ingresa tu correo electrónico', 'error'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Código enviado. Revisa tu correo.', 'success');
        setStep('otp');
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        showToast(json.message ?? 'Error al enviar el código', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handler ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Paso 2: verificar OTP ─────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { showToast('Ingresa el código completo de 6 dígitos', 'error'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const json = await res.json();
      if (json.success) {
        setResetToken(json.resetToken);
        showToast('Código verificado. Crea tu nueva contraseña.', 'success');
        setStep('reset');
      } else {
        if (json.invalidated) {
          setOtp(['', '', '', '', '', '']);
          setStep('email');
          showToast('Código invalidado por muchos intentos. Solicita uno nuevo.', 'warning');
        } else {
          setAttemptsLeft(json.attemptsLeft ?? attemptsLeft - 1);
          setOtp(['', '', '', '', '', '']);
          otpRefs.current[0]?.focus();
          showToast(json.message ?? 'Código incorrecto', 'error');
        }
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 3: nueva contraseña ──────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return; }
    if (newPassword !== confirmPass) { showToast('Las contraseñas no coinciden', 'error'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setStep('done');
      } else {
        showToast(json.message ?? 'Error al actualizar contraseña', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Indicador de pasos ────────────────────────────────────────────────────
  const steps = [
    { key: 'email', label: 'Correo' },
    { key: 'otp',   label: 'Código'  },
    { key: 'reset', label: 'Nueva contraseña' },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f3f4f6', padding: '24px',
    }}>
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
        .otp-input:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
        .rc-input:focus  { border-color: #10b981 !important; }
      `}</style>

      <ToastContainer toasts={toasts} />

      <div style={{
        background: 'white', borderRadius: '24px', padding: '40px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        animation: 'fadeUp 0.4s ease',
      }}>
        {/* Logo / marca */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: '#ecfdf5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '26px', margin: '0 auto 16px',
          }}>🔑</div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            Recuperar contraseña
          </h2>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
            Ruta Contable · Panel de Gestión
          </p>
        </div>

        {/* Indicador de pasos (solo en los 3 primeros) */}
        {step !== 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            {steps.map((s, i) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: i <= stepIndex ? CLUB_GREEN : '#e5e7eb',
                    color: i <= stepIndex ? 'white' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                    transition: 'background 0.3s',
                  }}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '11px', color: i <= stepIndex ? CLUB_GREEN : '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 8px 16px',
                    background: i < stepIndex ? CLUB_GREEN : '#e5e7eb',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Paso 1: email ─────────────────────────────────────── */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '13px' }}>
                Correo electrónico <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@tuclub.com"
                className="rc-input"
                style={inputStyle}
                required
                disabled={loading}
              />
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                Te enviaremos un código de 6 dígitos a este correo.
              </p>
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '13px', borderRadius: '10px', border: 'none',
              background: loading ? '#6ee7b7' : CLUB_GREEN, color: 'white',
              fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {loading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {/* ── Paso 2: OTP ──────────────────────────────────────── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#6b7280' }}>
                Código enviado a <strong style={{ color: '#111827' }}>{email}</strong>
              </p>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#9ca3af' }}>
                Expira en 10 minutos · {attemptsLeft} intento(s) restante(s)
              </p>
              {/* Inputs OTP */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="otp-input"
                    style={{
                      width: '52px', height: '60px', textAlign: 'center',
                      fontSize: '24px', fontWeight: 800, color: '#111827',
                      border: `2px solid ${digit ? CLUB_GREEN : '#e5e7eb'}`,
                      borderRadius: '12px', outline: 'none',
                      background: digit ? '#f0fdf4' : 'white',
                      transition: 'all 0.15s',
                    }}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading || otp.join('').length < 6} style={{
              padding: '13px', borderRadius: '10px', border: 'none',
              background: loading || otp.join('').length < 6 ? '#6ee7b7' : CLUB_GREEN,
              color: 'white', fontSize: '15px', fontWeight: 700,
              cursor: loading || otp.join('').length < 6 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {loading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setOtp(['','','','','','']); }}
              style={{ background: 'none', border: 'none', color: CLUB_GREEN, fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
              ← Cambiar correo
            </button>
          </form>
        )}

        {/* ── Paso 3: nueva contraseña ──────────────────────────── */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '13px' }}>
                Nueva contraseña <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="rc-input"
                style={inputStyle}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '13px' }}>
                Confirmar contraseña <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Repite la contraseña"
                className="rc-input"
                style={{
                  ...inputStyle,
                  borderColor: confirmPass && confirmPass !== newPassword ? '#ef4444' : undefined,
                }}
                required
                disabled={loading}
              />
              {confirmPass && confirmPass !== newPassword && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#ef4444' }}>Las contraseñas no coinciden</p>
              )}
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '13px', borderRadius: '10px', border: 'none',
              background: loading ? '#6ee7b7' : CLUB_GREEN, color: 'white',
              fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)', marginTop: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {loading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}

        {/* ── Paso 4: éxito ────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#ecfdf5', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px',
            }}>✅</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#111827' }}>
              ¡Contraseña actualizada!
            </h3>
            <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: '14px' }}>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={() => onNavigate('login')}
              style={{
                padding: '13px 32px', borderRadius: '10px', border: 'none',
                background: CLUB_GREEN, color: 'white', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
              }}
            >
              Ir al inicio de sesión
            </button>
          </div>
        )}

        {/* Volver al login */}
        {step !== 'done' && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => onNavigate('login')}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}