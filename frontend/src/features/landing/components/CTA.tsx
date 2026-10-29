import React from 'react';
import { Mail, MapPin, Phone, Instagram, Link as LinkIcon } from 'lucide-react';
import { LANDING_POR_DEFECTO, seccionPorDefecto, instagramDe, ContactoLanding, SeccionLanding } from '../data';

interface CTAProps {
  seccion?: SeccionLanding;
  contacto?: ContactoLanding;
}

// Sección "Contacto": la llamada a la acción final y los datos del club.
export function CTA({ seccion = seccionPorDefecto('contacto'), contacto = LANDING_POR_DEFECTO.contacto }: CTAProps) {
  const instagram = instagramDe(contacto);

  return (
    <section className="landing-section landing-section-alt" id="contacto">
      <div className="landing-container">
        <div className="contact-card">
          <h2>{seccion.titulo}</h2>
          {seccion.texto && <p>{seccion.texto}</p>}
          <div className="contact-actions">
            <a className="btn btn-large" href={`mailto:${contacto.correo}`}>
              Escríbenos por correo
            </a>
            {instagram && (
              <a
                className="btn btn-secondary btn-large"
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Escríbenos por Instagram
              </a>
            )}
          </div>
        </div>

        <div className="contact-details">
          <div className="contact-detail">
            <Mail size={20} />
            <div>
              <strong>Correo</strong>
              <a href={`mailto:${contacto.correo}`}>{contacto.correo}</a>
            </div>
          </div>
          {contacto.telefono && (
            <div className="contact-detail">
              <Phone size={20} />
              <div>
                <strong>Teléfono</strong>
                <a href={`tel:${contacto.telefono.replace(/\s/g, '')}`}>{contacto.telefono}</a>
              </div>
            </div>
          )}
          {contacto.direccion && (
            <div className="contact-detail">
              <MapPin size={20} />
              <div>
                <strong>Dirección</strong>
                <span>{contacto.direccion}</span>
              </div>
            </div>
          )}
          {contacto.redes.map(red => {
            const Icono = /instagram/i.test(red.nombre) ? Instagram : LinkIcon;
            return (
              <div className="contact-detail" key={red.url}>
                <Icono size={20} />
                <div>
                  <strong>{red.nombre}</strong>
                  <a href={red.url} target="_blank" rel="noopener noreferrer">
                    {red.etiqueta || red.url}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CTA;
