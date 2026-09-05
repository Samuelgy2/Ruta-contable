import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '../../../shared/components/Logo';
import { AppPage } from '../../../types/index';
import { CLUB, ENLACES_SECCIONES } from '../data';

interface NavbarProps {
  onNavigate: (page: AppPage) => void;
  // Página actual: en 'home' se muestran los anclas a las secciones y se oculta
  // el botón que lleva a la página en la que ya estás.
  currentPage?: AppPage;
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [abierto, setAbierto] = useState(false);
  const enHome = !currentPage || currentPage === 'home';

  const cerrar = () => setAbierto(false);

  const irA = (page: AppPage) => {
    cerrar();
    onNavigate(page);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container" style={{ position: 'relative' }}>
        <div className="navbar-brand" onClick={() => irA('home')}>
          <Logo size="small" />
          <span className="navbar-brand-name">{CLUB.nombre}</span>
        </div>

        <ul className={`navbar-links ${abierto ? 'is-open' : ''}`.trim()}>
          {enHome && ENLACES_SECCIONES.map(enlace => (
            <li key={enlace.id}>
              <a href={`#${enlace.id}`} onClick={cerrar}>{enlace.etiqueta}</a>
            </li>
          ))}
          {/* En móvil los botones viajan dentro del menú desplegable. */}
          <li className="navbar-links-actions navbar-buttons">
            {currentPage !== 'register' && (
              <button className="btn btn-secondary" onClick={() => irA('register')}>
                Registrarse
              </button>
            )}
            {currentPage !== 'login' && (
              <button className="btn" onClick={() => irA('login')}>
                Iniciar sesión
              </button>
            )}
          </li>
        </ul>

        <button
          type="button"
          className="navbar-toggle"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
          onClick={() => setAbierto(a => !a)}
        >
          {abierto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
