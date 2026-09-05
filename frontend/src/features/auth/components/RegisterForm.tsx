import React, { useState } from 'react';
import { PasswordInput } from '../../../components/ui/password-input';
import { AppPage } from '../../../types/index';

interface RegisterFormProps {
  onNavigate: (page: AppPage) => void;
  onRegister: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  backgroundColor?: string;
  backgroundImage?: string;
}

// El backend exige ocho caracteres como mínimo; el formulario valida lo mismo
// para no mandar una petición que ya se sabe que va a fallar.
const LONGITUD_MINIMA_PASSWORD = 8;

export function RegisterForm({ onNavigate, onRegister, backgroundColor, backgroundImage }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < LONGITUD_MINIMA_PASSWORD) {
      newErrors.password = `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMensajeError('');
    setMensajeExito('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const success = await onRegister({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        setMensajeExito('¡Cuenta creada! Te llevamos al inicio de sesión…');
        // Pausa breve para que el mensaje se alcance a leer antes de redirigir.
        setTimeout(() => onNavigate('login'), 1500);
      } else {
        setMensajeError('No se pudo crear la cuenta. El correo o el usuario ya podrían estar registrados.');
        setSubmitting(false);
      }
    } catch {
      setMensajeError('No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.');
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMensajeError('');
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const containerStyle: React.CSSProperties = {
    ...(backgroundImage && { backgroundImage }),
    ...(backgroundColor && !backgroundImage && { backgroundColor }),
  };

  return (
    <div className="register-container" style={containerStyle}>
      <div className="register-header">
        <h1>Crear Cuenta</h1>
        <p>Completa el formulario para registrarte en ClubFinance</p>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">Nombre *</label>
            <input
              id="firstName"
              type="text"
              className={`form-input ${errors.firstName ? 'error' : ''}`}
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="Ingresa tu nombre"
              disabled={submitting}
            />
            {errors.firstName && (
              <span className="form-error">{errors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Apellido *</label>
            <input
              id="lastName"
              type="text"
              className={`form-input ${errors.lastName ? 'error' : ''}`}
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Ingresa tu apellido"
              disabled={submitting}
            />
            {errors.lastName && (
              <span className="form-error">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo Electrónico *</label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="ejemplo@correo.com"
            disabled={submitting}
          />
          {errors.email && (
            <span className="form-error">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña *</label>
          <PasswordInput
            id="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder={`Mínimo ${LONGITUD_MINIMA_PASSWORD} caracteres`}
            disabled={submitting}
          />
          {errors.password && (
            <span className="form-error">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
          <PasswordInput
            id="confirmPassword"
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="Repite tu contraseña"
            disabled={submitting}
          />
          {errors.confirmPassword && (
            <span className="form-error">{errors.confirmPassword}</span>
          )}
        </div>

        {/* Mensajes en línea, en lugar del alert() que había antes. */}
        {mensajeError && (
          <div className="form-error-box">{mensajeError}</div>
        )}
        {mensajeExito && (
          <div className="form-error-box" style={{ color: '#047857', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            {mensajeExito}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-large"
          style={{ width: '100%' }}
          disabled={submitting}
        >
          {submitting ? 'Creando cuenta…' : 'Registrarse'}
        </button>

        <div className="register-footer">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <a onClick={() => onNavigate('login')} style={{ cursor: 'pointer', color: 'var(--color-green)' }}>
              Iniciar Sesión
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
