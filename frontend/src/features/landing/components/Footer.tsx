import React from 'react';
import { Logo } from '../../../shared/components/Logo';
import { AppPage } from '../../../types/index';
import { CLUB, ENLACES_SECCIONES } from '../data';

interface FooterProps {
  // Opcional: las páginas de acceso lo usan sin navegación.
  onNavigate?: (page: AppPage) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-brand">
            <Logo size="small" />
            <span className="footer-brand-name">{CLUB.nombre}</span>
          </div>
          <h3>Sobre el club</h3>
          <p>
            Club de BMX de {CLUB.ciudad}. Semillero, formación competitiva y alto
            rendimiento, de la primera rodada al podio.
          </p>
        </div>

        <div className="footer-section">
          <h3>Contacto</h3>
          <div className="footer-contact">
            <p><strong>Correo:</strong> <a href={`mailto:${CLUB.correo}`} style={{ color: 'inherit' }}>{CLUB.correo}</a></p>
            <p><strong>Dirección:</strong> {CLUB.direccion}</p>
            <p>
              <strong>Instagram:</strong>{' '}
              <a href={CLUB.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                {CLUB.instagramUsuario}
              </a>
            </p>
          </div>
        </div>

        <div className="footer-section">
          <h3>Secciones</h3>
          <ul className="footer-links">
            {ENLACES_SECCIONES.map(enlace => (
              <li key={enlace.id}>
                <a href={`#${enlace.id}`}>{enlace.etiqueta}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-row">
          <span>&copy; {new Date().getFullYear()} {CLUB.nombre}. Todos los derechos reservados.</span>
          {onNavigate && (
            <button type="button" className="footer-bottom-link" onClick={() => onNavigate('login')}>
              Portal administrativo
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
