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
  {
    nombre: 'Panda Madrid',
    rol: 'Entrenador de semillero',
    instagram: 'https://www.instagram.com/panda_madrid440/',
    usuario: '@panda_madrid440',
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
