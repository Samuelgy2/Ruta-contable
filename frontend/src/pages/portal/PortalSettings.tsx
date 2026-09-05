import React, { useEffect, useState } from 'react';
import { portalService } from '../../services/portalService';
import { useAuth } from '../../features/auth/contexts/AuthContext';

interface PortalSettingsProps {
  onNavigate?: (page: string) => void;
}

const datosVacios = { full_name: '', email: '', telefono: '' };
const passwordVacia = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function PortalSettings({ onNavigate }: PortalSettingsProps) {
  const { currentUser } = useAuth();
  const [datos, setDatos] = useState(datosVacios);
  const [password, setPassword] = useState(passwordVacia);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mensajeDatos, setMensajeDatos] = useState('');
  const [errorDatos, setErrorDatos] = useState('');
  const [mensajePassword, setMensajePassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  // El resumen trae la ficha del club; los datos de la cuenta salen de la sesión.
  useEffect(() => {
    if (!currentUser) return;

    setDatos({
      full_name: currentUser.name ?? '',
      email: currentUser.email ?? '',
      telefono: (currentUser as { telefono?: string }).telefono ?? '',
    });
  }, [currentUser]);

  const cambiarDato = (campo: keyof typeof datosVacios, valor: string) => {
    setDatos(prev => ({ ...prev, [campo]: valor }));
    setMensajeDatos('');
    setErrorDatos('');
  };

  const cambiarPassword = (campo: keyof typeof passwordVacia, valor: string) => {
    setPassword(prev => ({ ...prev, [campo]: valor }));
    setMensajePassword('');
    setErrorPassword('');
  };

  const guardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeDatos('');
    setErrorDatos('');

    if (!datos.full_name.trim()) {
      setErrorDatos('El nombre completo es obligatorio');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) {
      setErrorDatos('El correo electrónico no es válido');
      return;
    }

    setGuardandoDatos(true);
    try {
      const respuesta = await portalService.updatePerfil({
        full_name: datos.full_name.trim(),
        email: datos.email.trim(),
        telefono: datos.telefono.trim(),
      });

      if (respuesta?.success) {
        setMensajeDatos('Tus datos se guardaron correctamente');
      } else {
        setErrorDatos(respuesta?.message || 'No se pudieron guardar tus datos');
      }
    } catch (error) {
      const mensaje = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorDatos(mensaje || 'Error de conexión al guardar tus datos');
    } finally {
      setGuardandoDatos(false);
    }
  };

  const guardarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajePassword('');
    setErrorPassword('');

    if (!password.currentPassword) {
      setErrorPassword('Debes indicar tu contraseña actual');
      return;
    }
    if (password.newPassword.length < 8) {
      setErrorPassword('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      setErrorPassword('Las contraseñas no coinciden');
      return;
    }

    setGuardandoPassword(true);
    try {
      const respuesta = await portalService.updatePerfil({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });

      if (respuesta?.success) {
        setMensajePassword('Tu contraseña se actualizó correctamente');
        setPassword(passwordVacia);
      } else {
        setErrorPassword(respuesta?.message || 'No se pudo cambiar tu contraseña');
      }
    } catch (error) {
      const mensaje = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorPassword(mensaje || 'Error de conexión al cambiar tu contraseña');
    } finally {
      setGuardandoPassword(false);
    }
  };

  return (
    <div>
      <div className="header-content" style={{ padding: 0, marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Configuración</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Actualiza tus datos personales y tu contraseña.
          </p>
        </div>
      </div>

      {/* Datos personales */}
      <div className="card">
        <h3>Datos personales</h3>
        <form onSubmit={guardarDatos}>
          <div className="form-group">
            <label htmlFor="perfil-usuario">Usuario</label>
            <input
              id="perfil-usuario"
              className="form-input"
              type="text"
              value={currentUser?.username ?? ''}
              disabled
            />
            <p className="stat-description" style={{ marginTop: '6px' }}>
              El nombre de usuario no se puede cambiar.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="perfil-nombre">Nombre completo</label>
            <input
              id="perfil-nombre"
              className="form-input"
              type="text"
              value={datos.full_name}
              onChange={e => cambiarDato('full_name', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="perfil-email">Correo electrónico</label>
              <input
                id="perfil-email"
                className="form-input"
                type="email"
                value={datos.email}
                onChange={e => cambiarDato('email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="perfil-telefono">Teléfono</label>
              <input
                id="perfil-telefono"
                className="form-input"
                type="tel"
                value={datos.telefono}
                onChange={e => cambiarDato('telefono', e.target.value)}
              />
            </div>
          </div>

          {errorDatos && <div className="form-error-box">{errorDatos}</div>}
          {mensajeDatos && (
            <p className="stat-description positive" style={{ marginBottom: '12px' }}>{mensajeDatos}</p>
          )}

          <button type="submit" className="btn" disabled={guardandoDatos}>
            {guardandoDatos ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Contraseña */}
      <div className="card">
        <h3>Cambiar contraseña</h3>
        <form onSubmit={guardarPassword}>
          <div className="form-group">
            <label htmlFor="perfil-password-actual">Contraseña actual</label>
            <input
              id="perfil-password-actual"
              className="form-input"
              type="password"
              autoComplete="current-password"
              value={password.currentPassword}
              onChange={e => cambiarPassword('currentPassword', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="perfil-password-nueva">Nueva contraseña</label>
              <input
                id="perfil-password-nueva"
                className="form-input"
                type="password"
                autoComplete="new-password"
                value={password.newPassword}
                onChange={e => cambiarPassword('newPassword', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="perfil-password-confirmar">Confirmar nueva contraseña</label>
              <input
                id="perfil-password-confirmar"
                className="form-input"
                type="password"
                autoComplete="new-password"
                value={password.confirmPassword}
                onChange={e => cambiarPassword('confirmPassword', e.target.value)}
              />
            </div>
          </div>

          {errorPassword && <div className="form-error-box">{errorPassword}</div>}
          {mensajePassword && (
            <p className="stat-description positive" style={{ marginBottom: '12px' }}>{mensajePassword}</p>
          )}

          <button type="submit" className="btn" disabled={guardandoPassword}>
            {guardandoPassword ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PortalSettings;
