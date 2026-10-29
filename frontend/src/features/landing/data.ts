// Datos del club para la landing. Fuente: perfil de Instagram @ridersclubdebmx.
// Todo lo que cambie con el tiempo (entrenadores, sedes, contacto) se edita aquí.

export const CLUB = {
  nombre: 'Riders - Club de BMX',
  ciudad: 'Medellín',
  departamento: 'Antioquia',
  pais: 'Colombia',
  direccion: 'Cl. 30A #66b-223, Medellín, Antioquia',
  correo: 'Clubbmxriders@hotmail.com',
  instagram: 'https://www.instagram.com/ridersclubdebmx/',
  instagramUsuario: '@ridersclubdebmx',
  // ridersclubdebmx.com está caído: no se enlaza.
};

export const ENLACES_SECCIONES = [
  { id: 'club',         etiqueta: 'El club' },
  { id: 'escuela',      etiqueta: 'Escuela' },
  { id: 'sedes',        etiqueta: 'Sedes' },
  { id: 'entrenadores', etiqueta: 'Entrenadores' },
  { id: 'galeria',      etiqueta: 'Galería' },
  { id: 'contacto',     etiqueta: 'Contacto' },
];

export const CIFRAS = [
  { valor: '4+', etiqueta: 'años, edad de ingreso' },
  { valor: '3',  etiqueta: 'entrenadores' },
  { valor: '5',  etiqueta: 'sedes y frentes' },
  { valor: '1',  etiqueta: 'objetivo: el podio' },
];

export const ENTRENADORES = [
  {
    nombre: 'César Acevedo',
    rol: 'Entrenador principal',
    instagram: 'https://www.instagram.com/cesaracevedobmx/',
    usuario: '@cesaracevedobmx',
  },
  {
    nombre: 'Alejandro Uribe Mejía',
    rol: 'Entrenador de formación',
    instagram: 'https://www.instagram.com/uribemejiaalejandro/',
    usuario: '@uribemejiaalejandro',
  },
];

export const SEDES = [
  { nombre: 'Medellín',      badge: 'Sede principal', descripcion: 'Pista y escuela en la ciudad. Aquí entrenan semillero, formación y alto rendimiento.' },
  { nombre: 'Antioquia',     badge: 'Regional',       descripcion: 'Válidas departamentales y entrenamientos en pistas del departamento.' },
  { nombre: 'Ubaté',         badge: 'Frente',         descripcion: 'Concentraciones y competencias con el equipo Riders en Cundinamarca.' },
  { nombre: 'Villavicencio', badge: 'Frente',         descripcion: 'Válidas nacionales del calendario de la Federación Colombiana de Ciclismo.' },
  { nombre: 'USA',           badge: 'Internacional',  descripcion: 'Giras y competencias internacionales para los riders de alto rendimiento.' },
];

// Cada tarjeta enlaza al Instagram del club. Cuando haya fotos locales, van en
// frontend/src/images/gallery/ y se asignan en el campo imagen.
export const GALERIA: { titulo: string; imagen?: string }[] = [
  { titulo: 'Podio en válida nacional' },
  { titulo: 'Partida en pista de Medellín' },
  { titulo: 'Semillero en acción' },
  { titulo: 'Gira USA' },
  { titulo: 'Equipo Riders en Ubaté' },
  { titulo: 'Entrenamiento de alto rendimiento' },
];

export const SLIDES: { titulo: string; descripcion: string; imagen?: string }[] = [
  { titulo: 'Podio en válida nacional',    descripcion: 'Riders del club en el podio del calendario nacional de BMX.' },
  { titulo: 'Partida en pista de Medellín', descripcion: 'La partida, donde se decide media carrera, en nuestra pista de casa.' },
  { titulo: 'Semillero en acción',         descripcion: 'Los más pequeños, desde los 4 años, con el uniforme verde y negro del club.' },
  { titulo: 'Gira USA',                    descripcion: 'Competencias internacionales para los riders de alto rendimiento.' },
  { titulo: 'Equipo Riders en Ubaté',      descripcion: 'Concentración del equipo en uno de nuestros frentes.' },
];

// ─── Contenido editable (módulo "Gestión de la landing page") ────────────────
// Lo publicado desde el panel reemplaza esto; sin versión publicada, la landing
// muestra este contenido por defecto (RF-097). La semilla del backend
// (backend/migrations/20261028_landing.seed.sql) copia estos mismos textos.

export type SeccionId = 'inicio' | 'cifras' | 'club' | 'escuela' | 'sedes' | 'entrenadores' | 'galeria' | 'contacto';

export interface SeccionLanding {
  id: SeccionId;
  titulo: string;
  texto: string;
  visible: boolean;
  imagenes: number[];
}

export interface RedSocial { nombre: string; url: string; etiqueta: string; }

export interface ContactoLanding {
  correo: string;
  telefono: string;
  direccion: string;
  redes: RedSocial[];
}

export interface ContenidoLanding {
  secciones: SeccionLanding[];
  contacto: ContactoLanding;
}

export interface ImagenLanding { id: number; alt: string; }

export const NOMBRES_SECCIONES: Record<SeccionId, string> = {
  inicio: 'Portada', cifras: 'Cifras', club: 'El club', escuela: 'Escuela',
  sedes: 'Sedes', entrenadores: 'Entrenadores', galeria: 'Galería', contacto: 'Contacto',
};

// Secciones que admiten imágenes (carrusel de la portada y galería).
export const SECCIONES_CON_IMAGENES: SeccionId[] = ['inicio', 'galeria'];

const seccion = (id: SeccionId, titulo: string, texto: string): SeccionLanding => ({ id, titulo, texto, visible: true, imagenes: [] });

export const LANDING_POR_DEFECTO: ContenidoLanding = {
  secciones: [
    seccion('inicio', 'Formamos riders, construimos campeones', 'Semillero desde los 4 años, formación competitiva y alto rendimiento. Acompañamos a cada rider desde su primer contacto con la bici hasta el podio.'),
    seccion('cifras', 'Cifras del club', ''),
    seccion('club', 'El club', 'Riders es un club de BMX de Medellín. Formamos deportistas desde el semillero, con un proceso que acompaña a cada rider desde su primer contacto con la bici hasta la competencia.\n\nCompetimos en las válidas departamentales y nacionales, y proyectamos a nuestros riders de alto rendimiento hacia el calendario internacional.'),
    seccion('escuela', 'Escuela', 'Tres niveles, un mismo camino: de la primera rodada al podio.'),
    seccion('sedes', 'Sedes y frentes', 'Entrenamos en Medellín y competimos donde esté el calendario.'),
    seccion('entrenadores', 'Entrenadores', 'El equipo que acompaña a cada rider en la pista.'),
    seccion('galeria', 'Galería', `Podios, partidas y semillero. Todo el día a día del club está en ${CLUB.instagramUsuario}.`),
    seccion('contacto', '¿Listo para rodar con nosotros?', 'Escríbenos y te contamos cómo inscribir a tu rider en el semillero o en el grupo competitivo.'),
  ],
  contacto: {
    correo: CLUB.correo,
    telefono: '',
    direccion: CLUB.direccion,
    redes: [{ nombre: 'Instagram', url: CLUB.instagram, etiqueta: CLUB.instagramUsuario }],
  },
};

// Enlaces del menú: secciones visibles con ancla, en el orden publicado.
export const enlacesDe = (contenido: ContenidoLanding) =>
  contenido.secciones.filter(s => s.visible).flatMap(s => ENLACES_SECCIONES.filter(e => e.id === s.id));

export const instagramDe = (contacto: ContactoLanding) =>
  contacto.redes.find(r => /instagram/i.test(r.nombre)) ?? null;

export const seccionPorDefecto = (id: SeccionId): SeccionLanding =>
  LANDING_POR_DEFECTO.secciones.find(s => s.id === id)!;
