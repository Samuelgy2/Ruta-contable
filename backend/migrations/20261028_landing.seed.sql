-- Semilla: carga como borrador el contenido que hoy trae la landing estática
-- (frontend/src/features/landing/data.ts y componentes). No publica nada: sin
-- versión publicada, la landing pública sigue mostrando el contenido por defecto.

INSERT INTO landing_borrador (id, contenido)
VALUES (1, $json${
  "secciones": [
    { "id": "inicio", "visible": true, "imagenes": [],
      "titulo": "Formamos riders, construimos campeones",
      "texto": "Semillero desde los 4 años, formación competitiva y alto rendimiento. Acompañamos a cada rider desde su primer contacto con la bici hasta el podio." },
    { "id": "cifras", "visible": true, "imagenes": [],
      "titulo": "Cifras del club", "texto": "" },
    { "id": "club", "visible": true, "imagenes": [],
      "titulo": "El club",
      "texto": "Riders es un club de BMX de Medellín. Formamos deportistas desde el semillero, con un proceso que acompaña a cada rider desde su primer contacto con la bici hasta la competencia.\n\nCompetimos en las válidas departamentales y nacionales, y proyectamos a nuestros riders de alto rendimiento hacia el calendario internacional." },
    { "id": "escuela", "visible": true, "imagenes": [],
      "titulo": "Escuela",
      "texto": "Tres niveles, un mismo camino: de la primera rodada al podio." },
    { "id": "sedes", "visible": true, "imagenes": [],
      "titulo": "Sedes y frentes",
      "texto": "Entrenamos en Medellín y competimos donde esté el calendario." },
    { "id": "entrenadores", "visible": true, "imagenes": [],
      "titulo": "Entrenadores",
      "texto": "El equipo que acompaña a cada rider en la pista." },
    { "id": "galeria", "visible": true, "imagenes": [],
      "titulo": "Galería",
      "texto": "Podios, partidas y semillero. Todo el día a día del club está en @ridersclubdebmx." },
    { "id": "contacto", "visible": true, "imagenes": [],
      "titulo": "¿Listo para rodar con nosotros?",
      "texto": "Escríbenos y te contamos cómo inscribir a tu rider en el semillero o en el grupo competitivo." }
  ],
  "contacto": {
    "correo": "Clubbmxriders@hotmail.com",
    "telefono": "",
    "direccion": "Cl. 30A #66b-223, Medellín, Antioquia",
    "redes": [
      { "nombre": "Instagram", "url": "https://www.instagram.com/ridersclubdebmx/", "etiqueta": "@ridersclubdebmx" }
    ]
  }
}$json$::jsonb)
ON CONFLICT (id) DO NOTHING;
