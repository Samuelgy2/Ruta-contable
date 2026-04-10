import React from 'react';

export function Footer() {
  return (
    <center>
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
              <strong>Email:</strong> Clubbmxriders@hotmail.com
            </p>
            <p>
              <strong>Dirección:</strong> #66b- a, Cl. 30A #66b223, Medellín, Antioquia
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ClubFinance. Todos los derechos reservados.</p>
      </div>
    </footer>
    </center>
  );
}
