import React from 'react';

export function Features() {
  const features = [
    {
      icon: '📊',
      title: 'Control Total',
      description: 'Lleva un registro completo de todos los ingresos y gastos de tu club con reportes detallados en tiempo real.'
    },
    {
      icon: '👥',
      title: 'Gestión de Miembros',
      description: 'Administra la información de todos los socios, controla cuotas y mantén actualizada la base de datos.'
    },
    {
      icon: '💰',
      title: 'Seguimiento de Cuotas',
      description: 'Registra y monitorea los pagos de cuotas de manera automática, con alertas de vencimiento.'
    },
    {
      icon: '📈',
      title: 'Reportes Financieros',
      description: 'Genera reportes personalizados y exporta datos para análisis más profundos de tu organización.'
    },
    {
      icon: '🔒',
      title: 'Seguridad',
      description: 'Sistema de roles con acceso diferenciado para usuarios y administradores, protegiendo tu información.'
    },
    {
      icon: '📱',
      title: 'Acceso desde Cualquier Lugar',
      description: 'Interfaz responsive que funciona perfectamente en computadoras, tablets y teléfonos móviles.'
    }
  ];

  return (
    <section className="features" id="servicios">
      <div className="features-container">
        <h2>¿Por qué elegir ClubFinance?</h2>
        <p className="features-subtitle">
          Todas las herramientas que necesitas para gestionar las finanzas de tu club
        </p>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
