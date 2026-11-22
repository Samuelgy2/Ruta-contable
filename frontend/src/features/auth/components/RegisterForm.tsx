import React, { useEffect, useRef, useState } from 'react';
import { PasswordInput } from '../../../components/ui/password-input';
import { CamposSocio, DatosSocio, SOCIO_VACIO, socioParaEnviar, validarSocio } from '../../../components/socio/CamposSocio';
import { authService } from '../../../services/authService';
import { AppPage } from '../../../types/index';

interface RegisterFormProps {
  onNavigate: (page: AppPage) => void;
  backgroundColor?: string;
  backgroundImage?: string;
}

// Registro en tres pasos (RF-028, RF-107):
//   1. correo → el backend envía un código de 6 dígitos;
//   2. código → el backend entrega un token de registro de un solo uso;
//   3. datos del socio + datos de la cuenta → se crean la ficha (pendiente de
//      aprobación), la cuenta y el vínculo en una sola operación.
type Paso = 'correo' | 'codigo' | 'datos';

// El backend exige ocho caracteres como mínimo; el formulario valida lo mismo.
const LONGITUD_MINIMA_PASSWORD = 8;
const FORMATO_USUARIO = /^[a-z0-9._-]{3,30}$/;
const ESPERA_REENVIO = 60;

const PASOS: { id: Paso; etiqueta: string }[] = [
  { id: 'correo', etiqueta: 'Correo' },
  { id: 'codigo', etiqueta: 'Código' },
  { id: 'datos',  etiqueta: 'Tus datos' },
];

const exito: React.CSSProperties = { color: '#047857', background: '#ecfdf5', borderColor: '#a7f3d0' };

// Usuario sugerido a partir del correo: la parte antes de la arroba, en el formato que acepta el backend.
const usuarioDesdeCorreo = (correo: string) => correo.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);

export function RegisterForm({ onNavigate, backgroundColor, backgroundImage }: RegisterFormProps) {
  const [paso, setPaso] = useState<Paso>('correo');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [registroToken, setRegistroToken] = useState('');
  const [socio, setSocio] = useState<DatosSocio>(SOCIO_VACIO);
  const [cuenta, setCuenta] = useState({ username: '', password: '', confirmPassword: '' });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeInfo, setMensajeInfo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);
  const inputCodigo = useRef<HTMLInputElement>(null);

  // Cuenta regresiva para reenviar el código.
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const limpiarMensajes = () => { setMensajeError(''); setMensajeInfo(''); };

  // ── Paso 1: pedir el código ────────────────────────────────────────────────
  const pedirCodigo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    limpiarMensajes();
    const correo = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setErrores({ email: 'Escribe un correo electrónico válido' });
      return;
    }
    setErrores({});
    setEnviando(true);
    const r = await authService.solicitarCodigoRegistro(correo);
    setEnviando(false);
    if (!r.success) {
      setMensajeError(r.message || 'No se pudo enviar el código.');
      return;
    }
    setEmail(correo);
    setCodigo('');
    setEspera(ESPERA_REENVIO);
    setMensajeInfo(r.message ?? '');
    setPaso('codigo');
    setTimeout(() => inputCodigo.current?.focus(), 50);
  };

  // ── Paso 2: verificar el código ────────────────────────────────────────────
  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    limpiarMensajes();
    if (!/^\d{6}$/.test(codigo)) {
      setErrores({ codigo: 'El código tiene 6 dígitos' });
      return;
    }
    setErrores({});
    setEnviando(true);
    const r = await authService.verificarCodigoRegistro(email, codigo);
    setEnviando(false);
    if (!r.success) {
      setMensajeError(r.message || 'No se pudo verificar el código.');
      if (r.invalidated) { setCodigo(''); setEspera(0); }
      return;
    }
    setRegistroToken(r.data?.registroToken ?? '');
    setCuenta(c => ({ ...c, username: c.username || usuarioDesdeCorreo(email) }));
    setPaso('datos');
  };

  // ── Paso 3: datos del socio y de la cuenta ─────────────────────────────────
  const validarDatos = () => {
    const nuevos: Record<string, string> = { ...validarSocio(socio) } as Record<string, string>;
    if (!FORMATO_USUARIO.test(cuenta.username)) nuevos.username = 'Entre 3 y 30 caracteres: minúsculas, números, punto, guion o guion bajo';
    if (cuenta.password.length < LONGITUD_MINIMA_PASSWORD) nuevos.password = `Mínimo ${LONGITUD_MINIMA_PASSWORD} caracteres`;
    if (!cuenta.confirmPassword) nuevos.confirmPassword = 'Confirma tu contraseña';
    else if (cuenta.password !== cuenta.confirmPassword) nuevos.confirmPassword = 'Las contraseñas no coinciden';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    limpiarMensajes();
    if (!validarDatos()) return;
    setEnviando(true);
    const r = await authService.register({
      registroToken,
      username: cuenta.username,
      password: cuenta.password,
      socio: socioParaEnviar(socio),
    });
    if (r.success) {
      setMensajeInfo(r.message ?? '');
      // Pausa para que el mensaje se alcance a leer antes de ir al inicio de sesión.
      setTimeout(() => onNavigate('login'), 3500);
      return;
    }
    setEnviando(false);
    if (r.codigo === 'TOKEN_INVALIDO') {
      // La verificación venció: se vuelve al inicio sin perder lo escrito.
      setPaso('correo');
      setRegistroToken('');
    }
    setMensajeError(Array.isArray(r.errors) && r.errors.length ? r.errors.join('. ') : (r.message || 'No se pudo completar el registro.'));
  };

  const cambiarCuenta = (campo: keyof typeof cuenta, valor: string) => {
    setCuenta(c => ({ ...c, [campo]: valor }));
    setMensajeError('');
    if (errores[campo]) setErrores(({ [campo]: _, ...resto }) => resto);
  };

  const containerStyle: React.CSSProperties = {
    ...(backgroundImage && { backgroundImage }),
    ...(backgroundColor && !backgroundImage && { backgroundColor }),
  };

  const indice = PASOS.findIndex(p => p.id === paso);
  const terminado = Boolean(mensajeInfo) && paso === 'datos';

  return (
    <div className="register-container" style={containerStyle}>
      <div className="register-header">
        <h1>Inscríbete en el club</h1>
        <p>Primero verificamos tu correo; después completas tus datos de socio y de tu cuenta.</p>
      </div>

      <ol aria-label="Pasos del registro" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, margin: '0 0 20px', flexWrap: 'wrap' }}>
        {PASOS.map((p, i) => (
          <li
            key={p.id}
            aria-current={p.id === paso ? 'step' : undefined}
            style={{
              flex: '1 1 90px', textAlign: 'center', padding: '6px 8px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
              background: i < indice ? '#d1fae5' : i === indice ? '#10b981' : '#f3f4f6',
              color: i < indice ? '#065f46' : i === indice ? 'white' : '#6b7280',
            }}
          >
            {i + 1}. {p.etiqueta}
          </li>
        ))}
      </ol>

      {paso === 'correo' && (
        <form className="register-form" onSubmit={e => void pedirCodigo(e)} noValidate>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico *</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`form-input ${errores.email ? 'error' : ''}`}
              value={email}
              onChange={e => { setEmail(e.target.value); setErrores({}); setMensajeError(''); }}
              placeholder="ejemplo@correo.com"
              disabled={enviando}
              aria-invalid={Boolean(errores.email)}
              aria-describedby={errores.email ? 'email-error' : undefined}
            />
            {errores.email && <span id="email-error" className="form-error">{errores.email}</span>}
          </div>
          {mensajeError && <div className="form-error-box" role="alert">{mensajeError}</div>}
          <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }} disabled={enviando}>
            {enviando ? 'Enviando código…' : 'Enviar código'}
          </button>
        </form>
      )}

      {paso === 'codigo' && (
        <form className="register-form" onSubmit={e => void verificarCodigo(e)} noValidate>
          {mensajeInfo && <div className="form-error-box" role="status" style={exito}>{mensajeInfo}</div>}
          <p style={{ margin: '0 0 12px', color: '#4b5563', fontSize: '14px' }}>
            Escribe el código de 6 dígitos que enviamos a <strong>{email}</strong>. Vence en 10 minutos.
          </p>
          <div className="form-group">
            <label htmlFor="codigo">Código de verificación *</label>
            <input
              id="codigo"
              ref={inputCodigo}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className={`form-input ${errores.codigo ? 'error' : ''}`}
              style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center' }}
              value={codigo}
              onChange={e => { setCodigo(e.target.value.replace(/\D/g, '')); setErrores({}); setMensajeError(''); }}
              disabled={enviando}
              aria-invalid={Boolean(errores.codigo)}
              aria-describedby={errores.codigo ? 'codigo-error' : undefined}
            />
            {errores.codigo && <span id="codigo-error" className="form-error">{errores.codigo}</span>}
          </div>
          {mensajeError && <div className="form-error-box" role="alert">{mensajeError}</div>}
          <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }} disabled={enviando || codigo.length < 6}>
            {enviando ? 'Verificando…' : 'Verificar código'}
          </button>
          <div className="register-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { limpiarMensajes(); setPaso('correo'); }} disabled={enviando}>
              Cambiar correo
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void pedirCodigo()} disabled={enviando || espera > 0}>
              {espera > 0 ? `Reenviar en ${espera} s` : 'Reenviar código'}
            </button>
          </div>
        </form>
      )}

      {paso === 'datos' && (
        <form className="register-form" onSubmit={e => void registrar(e)} noValidate>
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 8px' }} disabled={enviando || terminado}>
            <legend style={{ fontWeight: 700, fontSize: '16px', color: '#111827', marginBottom: '12px' }}>Datos del socio</legend>
            <CamposSocio variante="registro" valor={socio} errores={errores} onChange={v => { setSocio(v); setMensajeError(''); }} />
          </fieldset>

          <fieldset style={{ border: 'none', padding: 0, margin: '8px 0' }} disabled={enviando || terminado}>
            <legend style={{ fontWeight: 700, fontSize: '16px', color: '#111827', marginBottom: '12px' }}>Datos de la cuenta</legend>
            <div className="form-group">
              <label htmlFor="cuenta-email">Correo electrónico (verificado)</label>
              <input id="cuenta-email" type="email" className="form-input" value={email} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="username">Usuario *</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                maxLength={30}
                className={`form-input ${errores.username ? 'error' : ''}`}
                value={cuenta.username}
                onChange={e => cambiarCuenta('username', e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                aria-invalid={Boolean(errores.username)}
                aria-describedby={errores.username ? 'username-error' : undefined}
              />
              {errores.username && <span id="username-error" className="form-error">{errores.username}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  className={`form-input ${errores.password ? 'error' : ''}`}
                  value={cuenta.password}
                  onChange={e => cambiarCuenta('password', e.target.value)}
                  placeholder={`Mínimo ${LONGITUD_MINIMA_PASSWORD} caracteres`}
                />
                {errores.password && <span className="form-error">{errores.password}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar contraseña *</label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  className={`form-input ${errores.confirmPassword ? 'error' : ''}`}
                  value={cuenta.confirmPassword}
                  onChange={e => cambiarCuenta('confirmPassword', e.target.value)}
                  placeholder="Repite tu contraseña"
                />
                {errores.confirmPassword && <span className="form-error">{errores.confirmPassword}</span>}
              </div>
            </div>
          </fieldset>

          {mensajeError && <div className="form-error-box" role="alert">{mensajeError}</div>}
          {terminado && <div className="form-error-box" role="status" style={exito}>{mensajeInfo}</div>}

          <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }} disabled={enviando || terminado}>
            {terminado ? 'Registro enviado ✓' : enviando ? 'Enviando registro…' : 'Completar registro'}
          </button>
        </form>
      )}

      {paso === 'correo' && (
        <div className="register-footer">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <a onClick={() => onNavigate('login')} style={{ cursor: 'pointer', color: 'var(--color-green)' }}>
              Iniciar Sesión
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
