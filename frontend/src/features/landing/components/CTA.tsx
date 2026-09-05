import React from 'react';
import { Mail, MapPin, Instagram } from 'lucide-react';
import { CLUB } from '../data';

// Sección "Contacto": la llamada a la acción final y los datos del club.
export function CTA() {
  return (
    <section className="landing-section landing-section-alt" id="contacto">
      <div className="landing-container">
        <div className="contact-card">
          <h2>¿Listo para rodar con nosotros?</h2>
          <p>
            Escríbenos y te contamos cómo inscribir a tu rider en el semillero
            o en el grupo competitivo.
          </p>
          <div className="contact-actions">
            <a className="btn btn-large" href={`mailto:${CLUB.correo}`}>
              Escríbenos por correo
            </a>
            <a
              className="btn btn-secondary btn-large"
              href={CLUB.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escríbenos por Instagram
            </a>
          </div>
        </div>

        <div className="contact-details">
          <div className="contact-detail">
            <Mail size={20} />
            <div>
              <strong>Correo</strong>
              <a href={`mailto:${CLUB.correo}`}>{CLUB.correo}</a>
            </div>
          </div>
          <div className="contact-detail">
            <MapPin size={20} />
            <div>
              <strong>Dirección</strong>
              <span>{CLUB.direccion}</span>
            </div>
          </div>
          <div className="contact-detail">
            <Instagram size={20} />
            <div>
              <strong>Instagram</strong>
              <a href={CLUB.instagram} target="_blank" rel="noopener noreferrer">
                {CLUB.instagramUsuario}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
