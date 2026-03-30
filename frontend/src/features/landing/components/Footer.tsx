import React from 'react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Sobre Nosotros</h3>
          <p>Sistema de gestión financiera diseñado específicamente para clubes y organizaciones.</p>
        </div>

        <div className="footer-section">
          <h3>Contacto</h3>
          <div className="footer-contact">
            <p>
              <strong>Email:</strong> info@clubfinance.com
            </p>
            <p>
              <strong>Teléfono:</strong> +1 (555) 123-4567
            </p>
            <p>
              <strong>Dirección:</strong> Calle Principal 123, Ciudad
            </p>
          </div>
        </div>

        <div className="footer-section">
          <h3>Enlaces Rápidos</h3>
          <ul className="footer-links">
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#contacto">Contacto</a></li>
            <li><a href="#privacidad">Política de Privacidad</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ClubFinance. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
