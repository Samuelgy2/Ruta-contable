// Panel "Landing page" dentro de Configuración del Sistema (RF-088 a RF-096).
// Se edita un borrador; la landing pública sólo cambia al publicar.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, ArrowDown, Eye, Monitor, Tablet, Smartphone, X, Upload } from 'lucide-react';
import { CLUB_GREEN, ToastType, ConfirmDialog, inputStyle } from './shared';
import { LandingVista } from '../../../features/landing';
import {
  ContenidoLanding, SeccionLanding, RedSocial, LANDING_POR_DEFECTO, NOMBRES_SECCIONES, SECCIONES_CON_IMAGENES,
} from '../../../features/landing/data';
import { landingService, EstadoLanding, ImagenAdmin, VersionLanding } from '../../../services/landingService';
import { formatDateTime } from '../../../utils/format';

interface LandingPanelProps {
  showToast: (message: string, type?: ToastType) => void;
}

interface ErrorCampo { campo: string; mensaje: string; }

type Vista = 'secciones' | 'contacto' | 'imagenes' | 'historial';
type Dispositivo = 'computador' | 'tablet' | 'movil';
type Confirmacion = { tipo: 'publicar' } | { tipo: 'restaurar'; numero: number } | { tipo: 'eliminar'; imagen: ImagenAdmin };

const TITULO_MAX = 100;
const TEXTO_MAX = 2000;
const ALT_MAX = 150;
const IMAGEN_MAX_BYTES = 2 * 1024 * 1024;
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

const ANCHOS: Record<Dispositivo, { ancho: number; etiqueta: string; icono: typeof Monitor }> = {
  computador: { ancho: 1280, etiqueta: 'Computador', icono: Monitor },
  tablet:     { ancho: 768,  etiqueta: 'Tablet',     icono: Tablet },
  movil:      { ancho: 375,  etiqueta: 'Móvil',      icono: Smartphone },
};

const VISTAS: { id: Vista; etiqueta: string }[] = [
  { id: 'secciones', etiqueta: 'Secciones' },
  { id: 'contacto',  etiqueta: 'Contacto y redes' },
  { id: 'imagenes',  etiqueta: 'Imágenes' },
  { id: 'historial', etiqueta: 'Historial' },
];

const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '20px' };
const etiqueta: React.CSSProperties = { display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '13px' };
const botonSecundario: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' };
const botonIcono: React.CSSProperties = { ...botonSecundario, padding: '6px' };
const botonPrimario = (activo: boolean): React.CSSProperties => ({ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: activo ? CLUB_GREEN : '#a7f3d0', color: 'white', fontSize: '14px', fontWeight: 600, cursor: activo ? 'pointer' : 'not-allowed' });

const fecha = (valor?: string | null) => (valor ? formatDateTime(valor) : '—');
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

// Error de axios → mensaje y errores por campo que devuelve el backend.
function leerError(err: any): { mensaje: string; errores: ErrorCampo[] } {
  const data = err?.response?.data;
  return { mensaje: data?.message || err?.message || 'Error inesperado', errores: Array.isArray(data?.errores) ? data.errores : [] };
}

// iframe para que las media queries de la landing respondan al ancho elegido.
function MarcoVistaPrevia({ ancho, children }: { ancho: number; children: React.ReactNode }) {
  const [cuerpo, setCuerpo] = useState<HTMLElement | null>(null);

  const alCargar = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = e.currentTarget.contentDocument;
    if (!doc) return;
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(nodo => doc.head.appendChild(nodo.cloneNode(true)));
    setCuerpo(doc.body);
  };

  return (
    <>
      <iframe
        title="Vista previa del borrador"
        srcDoc={'<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body></body></html>'}
        onLoad={alCargar}
        style={{ width: ancho, height: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', flexShrink: 0 }}
      />
      {cuerpo && createPortal(children, cuerpo)}
    </>
  );
}

export function LandingPanel({ showToast }: LandingPanelProps) {
  const [estado, setEstado] = useState<EstadoLanding | null>(null);
  const [contenido, setContenido] = useState<ContenidoLanding>(LANDING_POR_DEFECTO);
  const [guardado, setGuardado] = useState<ContenidoLanding | null>(null);
  const [imagenes, setImagenes] = useState<ImagenAdmin[]>([]);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [versiones, setVersiones] = useState<VersionLanding[]>([]);
  const [errores, setErrores] = useState<ErrorCampo[]>([]);
  const [vista, setVista] = useState<Vista>('secciones');
  const [confirmar, setConfirmar] = useState<Confirmacion | null>(null);
  const [previa, setPrevia] = useState<Dispositivo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [errorSubida, setErrorSubida] = useState('');
  const inputArchivo = useRef<HTMLInputElement>(null);
  const resumenErrores = useRef<HTMLDivElement>(null);

  const sinGuardar = guardado !== null && JSON.stringify(guardado) !== JSON.stringify(contenido);

  const cargar = useCallback(async () => {
    try {
      const [e, imgs, vers] = await Promise.all([landingService.getEstado(), landingService.getImagenes(), landingService.getVersiones()]);
      const base = e.borrador?.contenido ?? LANDING_POR_DEFECTO;
      setEstado(e);
      setContenido(base);
      setGuardado(base);
      setImagenes(imgs);
      setVersiones(vers);
    } catch (err) {
      showToast(leerError(err).mensaje, 'error');
    } finally {
      setCargando(false);
    }
  }, [showToast]);

  useEffect(() => { void cargar(); }, [cargar]);

  // Miniaturas y vista previa: las imágenes se piden con el token como blob.
  useEffect(() => {
    imagenes.filter(i => !urls[i.id]).forEach(i => {
      landingService.urlImagenAdmin(i.id)
        .then(url => setUrls(prev => ({ ...prev, [i.id]: url })))
        .catch(() => { /* la miniatura queda vacía; el resto del panel sigue */ });
    });
  }, [imagenes]); // eslint-disable-line react-hooks/exhaustive-deps

  const urlsRef = useRef(urls);
  urlsRef.current = urls;
  useEffect(() => () => Object.values(urlsRef.current).forEach(URL.revokeObjectURL), []);

  // Avisa antes de salir con cambios sin guardar.
  useEffect(() => {
    if (!sinGuardar) return;
    const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [sinGuardar]);

  const mostrarErrores = (lista: ErrorCampo[]) => {
    setErrores(lista);
    if (lista.length) setTimeout(() => resumenErrores.current?.focus(), 0);
  };

  const errorDe = (campo: string) => errores.find(e => e.campo === campo)?.mensaje;
  const accesible = (campo: string) => {
    const mensaje = errorDe(campo);
    return {
      'aria-invalid': Boolean(mensaje),
      'aria-describedby': mensaje ? `error-${campo}` : undefined,
      style: { ...inputStyle, borderColor: mensaje ? '#ef4444' : '#e5e7eb' },
    };
  };
  const mensajeError = (campo: string) => {
    const mensaje = errorDe(campo);
    return mensaje ? <p id={`error-${campo}`} style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '12px' }}>{mensaje}</p> : null;
  };

  // ── Edición local ──────────────────────────────────────────────────────────
  const editarSeccion = (id: string, cambios: Partial<SeccionLanding>) =>
    setContenido(c => ({ ...c, secciones: c.secciones.map(s => (s.id === id ? { ...s, ...cambios } : s)) }));

  const mover = (indice: number, delta: number) => setContenido(c => {
    const secciones = [...c.secciones];
    const destino = indice + delta;
    if (destino < 0 || destino >= secciones.length) return c;
    [secciones[indice], secciones[destino]] = [secciones[destino], secciones[indice]];
    return { ...c, secciones };
  });

  const editarContacto = (cambios: Partial<ContenidoLanding['contacto']>) =>
    setContenido(c => ({ ...c, contacto: { ...c.contacto, ...cambios } }));

  const editarRed = (indice: number, cambios: Partial<RedSocial>) =>
    editarContacto({ redes: contenido.contacto.redes.map((r, i) => (i === indice ? { ...r, ...cambios } : r)) });

  // ── Acciones contra el backend ─────────────────────────────────────────────
  const guardar = async () => {
    setOcupado(true);
    try {
      const r = await landingService.guardarBorrador(contenido);
      mostrarErrores([]);
      showToast(r.message, 'success');
      await cargar();
    } catch (err) {
      const { mensaje, errores: lista } = leerError(err);
      mostrarErrores(lista);
      showToast(mensaje, 'error');
    } finally {
      setOcupado(false);
    }
  };

  const ejecutarConfirmacion = async () => {
    if (!confirmar) return;
    const accion = confirmar;
    setConfirmar(null);
    setOcupado(true);
    try {
      const r = accion.tipo === 'publicar' ? await landingService.publicar()
        : accion.tipo === 'restaurar' ? await landingService.restaurar(accion.numero)
        : await landingService.eliminarImagen(accion.imagen.id);
      if (accion.tipo === 'eliminar') {
        URL.revokeObjectURL(urls[accion.imagen.id]);
        setUrls(({ [accion.imagen.id]: _, ...resto }) => resto);
      }
      mostrarErrores([]);
      showToast(r.message, 'success');
      await cargar();
    } catch (err) {
      const { mensaje, errores: lista } = leerError(err);
      mostrarErrores(lista);
      showToast(mensaje, 'error');
    } finally {
      setOcupado(false);
    }
  };

  const subir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) return setErrorSubida('Elige una imagen.');
    if (!TIPOS_IMAGEN.includes(archivo.type)) return setErrorSubida('Formato no permitido. Usa JPG, PNG o WEBP.');
    if (archivo.size > IMAGEN_MAX_BYTES) return setErrorSubida(`La imagen pesa ${kb(archivo.size)}; el máximo es 2 MB.`);
    if (!alt.trim()) return setErrorSubida('Escribe el texto alternativo: describe la imagen para quien no puede verla.');

    setOcupado(true);
    try {
      const r = await landingService.subirImagen(archivo, alt.trim());
      setErrorSubida('');
      setArchivo(null);
      setAlt('');
      if (inputArchivo.current) inputArchivo.current.value = '';
      showToast(r.message, 'success');
      setImagenes(await landingService.getImagenes());
    } catch (err) {
      setErrorSubida(leerError(err).mensaje);
    } finally {
      setOcupado(false);
    }
  };

  if (cargando) return <p style={{ color: '#9ca3af', fontSize: '13px' }}>Cargando...</p>;

  const publicado = estado?.publicado;
  const puedePublicar = !ocupado && !sinGuardar && Boolean(estado?.cambiosSinPublicar);
  const imagenPorId = new Map(imagenes.map(i => [i.id, i]));

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>Landing page</h3>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
          Edita textos, imágenes, contacto y secciones. Los cambios se guardan como borrador y sólo se ven en la página pública al publicar.
        </p>
      </div>

      {/* ── Estado: borrador vs. publicado (RF-088) ── */}
      <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#374151' }}>
          <div>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, marginRight: '8px',
              backgroundColor: sinGuardar ? '#fef3c7' : estado?.cambiosSinPublicar ? '#dbeafe' : '#d1fae5',
              color: sinGuardar ? '#92400e' : estado?.cambiosSinPublicar ? '#1e40af' : '#065f46',
            }}>
              {sinGuardar ? 'Cambios sin guardar' : estado?.cambiosSinPublicar ? 'Borrador pendiente de publicar' : 'Publicado y al día'}
            </span>
          </div>
          <div><strong>Borrador:</strong> última modificación {fecha(estado?.borrador?.actualizadoEn)}{estado?.borrador?.actualizadoPor ? ` por ${estado.borrador.actualizadoPor}` : ''}</div>
          <div>
            <strong>Publicado:</strong>{' '}
            {publicado
              ? `versión ${publicado.numero}, ${fecha(publicado.publicadoEn)}${publicado.publicadoPor ? ` por ${publicado.publicadoPor}` : ''}`
              : 'nunca. La página pública muestra el contenido por defecto.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" style={botonSecundario} onClick={() => setPrevia('computador')}>
            <Eye size={16} /> Vista previa
          </button>
          <button type="button" style={botonPrimario(!ocupado && sinGuardar)} disabled={ocupado || !sinGuardar} onClick={() => void guardar()}>
            {ocupado ? 'Procesando...' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            style={{ ...botonPrimario(puedePublicar), backgroundColor: puedePublicar ? '#1f2937' : '#d1d5db' }}
            disabled={!puedePublicar}
            title={sinGuardar ? 'Guarda el borrador antes de publicar' : !estado?.cambiosSinPublicar ? 'No hay cambios por publicar' : undefined}
            onClick={() => setConfirmar({ tipo: 'publicar' })}
          >
            Publicar
          </button>
        </div>
      </div>

      {/* ── Resumen de errores (RNF-008): recibe el foco y lo anuncia el lector ── */}
      {errores.length > 0 && (
        <div ref={resumenErrores} tabIndex={-1} role="alert" style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', marginBottom: '16px', outline: 'none' }}>
          <strong>No se pudo completar: revisa estos campos.</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
            {errores.map((e, i) => <li key={i}>{e.mensaje}</li>)}
          </ul>
        </div>
      )}

      <nav role="tablist" aria-label="Partes de la landing" style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {VISTAS.map(v => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={vista === v.id}
            onClick={() => setVista(v.id)}
            style={{ ...botonSecundario, backgroundColor: vista === v.id ? '#ecfdf5' : 'white', borderColor: vista === v.id ? CLUB_GREEN : '#d1d5db', color: vista === v.id ? '#065f46' : '#374151', fontWeight: vista === v.id ? 600 : 500 }}
          >
            {v.etiqueta}
          </button>
        ))}
      </nav>

      {/* ── Secciones: textos, visibilidad, orden e imágenes (RF-089, RF-092) ── */}
      {vista === 'secciones' && (
        <div style={{ display: 'grid', gap: '12px', maxWidth: '860px' }}>
          {contenido.secciones.map((s, i) => {
            const nombre = NOMBRES_SECCIONES[s.id];
            const libres = imagenes.filter(img => !s.imagenes.includes(img.id));
            return (
              <section key={s.id} aria-label={`Sección ${nombre}`} style={{ ...card, opacity: s.visible ? 1 : 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '22px' }}>{i + 1}.</span>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2937', flex: 1 }}>{nombre}</h4>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={s.visible}
                      disabled={s.id === 'contacto'}
                      onChange={e => editarSeccion(s.id, { visible: e.target.checked })}
                    />
                    {s.id === 'contacto' ? 'Siempre visible' : 'Visible'}
                  </label>
                  <button type="button" style={botonIcono} disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`Subir ${nombre}`}><ArrowUp size={16} /></button>
                  <button type="button" style={botonIcono} disabled={i === contenido.secciones.length - 1} onClick={() => mover(i, 1)} aria-label={`Bajar ${nombre}`}><ArrowDown size={16} /></button>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label htmlFor={`titulo-${s.id}`} style={etiqueta}>Título <span style={{ color: '#ef4444' }}>*</span></label>
                    <input id={`titulo-${s.id}`} value={s.titulo} maxLength={TITULO_MAX} required onChange={e => editarSeccion(s.id, { titulo: e.target.value })} {...accesible(`secciones.${s.id}.titulo`)} />
                    <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>{s.titulo.length}/{TITULO_MAX}</div>
                    {mensajeError(`secciones.${s.id}.titulo`)}
                  </div>
                  {s.id !== 'cifras' && (
                    <div>
                      <label htmlFor={`texto-${s.id}`} style={etiqueta}>Texto</label>
                      <textarea id={`texto-${s.id}`} value={s.texto} maxLength={TEXTO_MAX} rows={s.id === 'club' ? 6 : 3} onChange={e => editarSeccion(s.id, { texto: e.target.value })} {...accesible(`secciones.${s.id}.texto`)} />
                      <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>
                        {s.id === 'club' && <span style={{ float: 'left' }}>Deja una línea en blanco para separar párrafos.</span>}
                        {s.texto.length}/{TEXTO_MAX}
                      </div>
                      {mensajeError(`secciones.${s.id}.texto`)}
                    </div>
                  )}

                  {SECCIONES_CON_IMAGENES.includes(s.id) && (
                    <div>
                      <span style={etiqueta}>{s.id === 'inicio' ? 'Imágenes del carrusel' : 'Fotos de la galería'}</span>
                      {s.imagenes.length === 0 && <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280' }}>Sin imágenes: se muestra el logo del club como marca de agua.</p>}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {s.imagenes.map(id => {
                          const img = imagenPorId.get(id);
                          return (
                            <figure key={id} style={{ margin: 0, width: '110px', fontSize: '11px', color: '#374151' }}>
                              {urls[id]
                                ? <img src={urls[id]} alt={img?.alt ?? ''} style={{ width: '110px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                                : <div style={{ width: '110px', height: '70px', borderRadius: '6px', backgroundColor: '#f3f4f6' }} />}
                              <figcaption style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img?.alt ?? `Imagen #${id} (no existe)`}</figcaption>
                              <button type="button" style={{ ...botonSecundario, padding: '2px 8px', fontSize: '11px' }} onClick={() => editarSeccion(s.id, { imagenes: s.imagenes.filter(x => x !== id) })}>
                                Quitar
                              </button>
                            </figure>
                          );
                        })}
                      </div>
                      {libres.length > 0 ? (
                        <select
                          aria-label={`Añadir imagen a ${nombre}`}
                          value=""
                          onChange={e => e.target.value && editarSeccion(s.id, { imagenes: [...s.imagenes, Number(e.target.value)] })}
                          style={{ ...inputStyle, maxWidth: '320px' }}
                        >
                          <option value="">Añadir imagen…</option>
                          {libres.map(img => <option key={img.id} value={img.id}>#{img.id} · {img.alt}</option>)}
                        </select>
                      ) : (
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Sube imágenes en la pestaña «Imágenes» para asignarlas aquí.</p>
                      )}
                      {mensajeError(`secciones.${s.id}.imagenes`)}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
          {mensajeError('secciones')}
        </div>
      )}

      {/* ── Contacto y redes (RF-091) ── */}
      {vista === 'contacto' && (
        <div style={{ ...card, maxWidth: '760px', display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label htmlFor="contacto-correo" style={etiqueta}>Correo <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="contacto-correo" type="email" required value={contenido.contacto.correo} onChange={e => editarContacto({ correo: e.target.value })} {...accesible('contacto.correo')} />
              {mensajeError('contacto.correo')}
            </div>
            <div>
              <label htmlFor="contacto-telefono" style={etiqueta}>Teléfono</label>
              <input id="contacto-telefono" type="tel" inputMode="tel" placeholder="+57 300 123 4567" value={contenido.contacto.telefono} onChange={e => editarContacto({ telefono: e.target.value })} {...accesible('contacto.telefono')} />
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Sólo números, espacios y +.</div>
              {mensajeError('contacto.telefono')}
            </div>
          </div>
          <div>
            <label htmlFor="contacto-direccion" style={etiqueta}>Dirección</label>
            <input id="contacto-direccion" maxLength={200} value={contenido.contacto.direccion} onChange={e => editarContacto({ direccion: e.target.value })} {...accesible('contacto.direccion')} />
            {mensajeError('contacto.direccion')}
          </div>

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ ...etiqueta, marginBottom: '8px' }}>Redes sociales</legend>
            <div style={{ display: 'grid', gap: '10px' }}>
              {contenido.contacto.redes.map((red, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(180px, 2fr) minmax(120px, 1fr) auto', gap: '8px', alignItems: 'start' }}>
                  <div>
                    <input aria-label={`Nombre de la red ${i + 1}`} placeholder="Instagram" value={red.nombre} maxLength={50} onChange={e => editarRed(i, { nombre: e.target.value })} {...accesible(`contacto.redes.${i}.nombre`)} />
                    {mensajeError(`contacto.redes.${i}.nombre`)}
                  </div>
                  <div>
                    <input aria-label={`Enlace de la red ${i + 1}`} type="url" placeholder="https://..." value={red.url} onChange={e => editarRed(i, { url: e.target.value })} {...accesible(`contacto.redes.${i}.url`)} />
                    {mensajeError(`contacto.redes.${i}.url`)}
                  </div>
                  <div>
                    <input aria-label={`Texto visible de la red ${i + 1}`} placeholder="@usuario" value={red.etiqueta} maxLength={TITULO_MAX} onChange={e => editarRed(i, { etiqueta: e.target.value })} {...accesible(`contacto.redes.${i}.etiqueta`)} />
                    {mensajeError(`contacto.redes.${i}.etiqueta`)}
                  </div>
                  <button type="button" style={botonIcono} aria-label={`Quitar la red ${i + 1}`} onClick={() => editarContacto({ redes: contenido.contacto.redes.filter((_, j) => j !== i) })}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            {contenido.contacto.redes.length < 10 && (
              <button type="button" style={{ ...botonSecundario, marginTop: '10px' }} onClick={() => editarContacto({ redes: [...contenido.contacto.redes, { nombre: '', url: 'https://', etiqueta: '' }] })}>
                + Añadir red
              </button>
            )}
            {mensajeError('contacto.redes')}
          </fieldset>
        </div>
      )}

      {/* ── Biblioteca de imágenes (RF-090) ── */}
      {vista === 'imagenes' && (
        <div style={{ display: 'grid', gap: '16px', maxWidth: '900px' }}>
          <form onSubmit={e => void subir(e)} style={{ ...card, display: 'grid', gap: '12px' }} noValidate>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2937' }}>Subir imagen</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>JPG, PNG o WEBP de máximo 2 MB. Para que la página cargue rápido, usa imágenes de unos 1600 px de ancho como máximo.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div>
                <label htmlFor="imagen-archivo" style={etiqueta}>Archivo <span style={{ color: '#ef4444' }}>*</span></label>
                <input id="imagen-archivo" ref={inputArchivo} type="file" accept={TIPOS_IMAGEN.join(',')} onChange={e => setArchivo(e.target.files?.[0] ?? null)} aria-describedby={errorSubida ? 'error-subida' : undefined} style={{ fontSize: '13px' }} />
              </div>
              <div>
                <label htmlFor="imagen-alt" style={etiqueta}>Texto alternativo <span style={{ color: '#ef4444' }}>*</span></label>
                <input id="imagen-alt" value={alt} maxLength={ALT_MAX} placeholder="Ej.: Riders en el podio de la válida nacional" onChange={e => setAlt(e.target.value)} aria-invalid={Boolean(errorSubida) && !alt.trim()} aria-describedby={errorSubida ? 'error-subida' : undefined} style={inputStyle} />
              </div>
            </div>
            {errorSubida && <p id="error-subida" role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '13px' }}>{errorSubida}</p>}
            <div>
              <button type="submit" disabled={ocupado} style={{ ...botonPrimario(!ocupado), display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} /> Subir imagen
              </button>
            </div>
          </form>

          <div style={card}>
            <h4 style={{ margin: '0 0 12px', fontSize: '15px', color: '#1f2937' }}>Imágenes subidas</h4>
            {imagenes.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Aún no hay imágenes.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {imagenes.map(img => {
                const enUso = img.enPublicada || img.enBorrador;
                return (
                  <figure key={img.id} style={{ margin: 0, border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    {urls[img.id]
                      ? <img src={urls[img.id]} alt={img.alt} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ height: '110px', backgroundColor: '#f3f4f6' }} />}
                    <figcaption style={{ padding: '8px 10px', fontSize: '12px', color: '#374151', display: 'grid', gap: '4px' }}>
                      <span style={{ fontWeight: 600 }}>#{img.id} · {img.alt}</span>
                      <span style={{ color: '#6b7280' }}>{img.mime.replace('image/', '').toUpperCase()} · {kb(img.bytes)}</span>
                      <span style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {img.enPublicada && <span style={{ padding: '1px 6px', borderRadius: '9999px', backgroundColor: '#d1fae5', color: '#065f46' }}>Publicada</span>}
                        {img.enBorrador && <span style={{ padding: '1px 6px', borderRadius: '9999px', backgroundColor: '#dbeafe', color: '#1e40af' }}>En borrador</span>}
                      </span>
                      <button
                        type="button"
                        disabled={enUso || ocupado}
                        title={img.enPublicada ? 'Está en la versión publicada: reemplázala y publica antes de eliminarla' : img.enBorrador ? 'Quítala del borrador y guarda antes de eliminarla' : undefined}
                        onClick={() => setConfirmar({ tipo: 'eliminar', imagen: img })}
                        style={{ ...botonSecundario, padding: '4px 10px', fontSize: '12px', color: enUso ? '#9ca3af' : '#b91c1c', cursor: enUso ? 'not-allowed' : 'pointer', justifySelf: 'start' }}
                      >
                        Eliminar
                      </button>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Historial de versiones (RF-095) ── */}
      {vista === 'historial' && (
        <div style={{ ...card, maxWidth: '760px', overflowX: 'auto' }}>
          {versiones.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Todavía no se ha publicado ninguna versión.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <caption style={{ textAlign: 'left', marginBottom: '8px', color: '#6b7280' }}>Restaurar carga la versión como borrador; después hay que publicarla.</caption>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                  <th scope="col" style={{ padding: '8px' }}>Versión</th>
                  <th scope="col" style={{ padding: '8px' }}>Fecha</th>
                  <th scope="col" style={{ padding: '8px' }}>Publicada por</th>
                  <th scope="col" style={{ padding: '8px' }}><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {versiones.map(v => (
                  <tr key={v.numero} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>
                      {v.numero} {v.actual && <span style={{ marginLeft: '6px', padding: '1px 8px', borderRadius: '9999px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '11px' }}>Publicada</span>}
                    </td>
                    <td style={{ padding: '8px' }}>{fecha(v.publicadoEn)}</td>
                    <td style={{ padding: '8px' }}>{v.publicadoPor ?? '—'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button type="button" style={botonSecundario} disabled={ocupado} onClick={() => setConfirmar({ tipo: 'restaurar', numero: v.numero })}>
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Vista previa del borrador (RF-093) ── */}
      {previa && (
        <div role="dialog" aria-modal="true" aria-label="Vista previa del borrador" style={{ position: 'fixed', inset: 0, zIndex: 1500, backgroundColor: 'rgba(17,24,39,0.75)', display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', backgroundColor: 'white', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
            <strong style={{ fontSize: '14px', color: '#1f2937', marginRight: 'auto' }}>
              Vista previa del borrador{sinGuardar ? ' (incluye cambios sin guardar)' : ''} · no es pública
            </strong>
            {(Object.keys(ANCHOS) as Dispositivo[]).map(d => {
              const Icono = ANCHOS[d].icono;
              return (
                <button key={d} type="button" aria-pressed={previa === d} onClick={() => setPrevia(d)} style={{ ...botonSecundario, backgroundColor: previa === d ? '#ecfdf5' : 'white', borderColor: previa === d ? CLUB_GREEN : '#d1d5db' }}>
                  <Icono size={16} /> {ANCHOS[d].etiqueta}
                </button>
              );
            })}
            <button type="button" style={botonIcono} aria-label="Cerrar vista previa" onClick={() => setPrevia(null)}><X size={18} /></button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
            <MarcoVistaPrevia ancho={ANCHOS[previa].ancho}>
              <LandingVista contenido={contenido} imagenes={imagenes} srcImagen={id => urls[id]} onNavigate={() => { /* sin navegación en la vista previa */ }} />
            </MarcoVistaPrevia>
          </div>
        </div>
      )}

      {confirmar?.tipo === 'publicar' && (
        <ConfirmDialog
          title={`¿Publicar la versión ${(publicado?.numero ?? 0) + 1}?`}
          message="La landing pública mostrará el borrador actual de inmediato. Podrás volver a una versión anterior desde el historial."
          icon="🚀" confirmLabel="Publicar" confirmColor={CLUB_GREEN}
          onConfirm={() => void ejecutarConfirmacion()} onCancel={() => setConfirmar(null)}
        />
      )}
      {confirmar?.tipo === 'restaurar' && (
        <ConfirmDialog
          title={`¿Restaurar la versión ${confirmar.numero}?`}
          message={`Reemplaza el borrador actual${sinGuardar ? ' y tus cambios sin guardar' : ''}. La página pública no cambia hasta que publiques.`}
          icon="↩️" confirmLabel="Restaurar" confirmColor="#2563eb"
          onConfirm={() => void ejecutarConfirmacion()} onCancel={() => setConfirmar(null)}
        />
      )}
      {confirmar?.tipo === 'eliminar' && (
        <ConfirmDialog
          title="¿Eliminar imagen?"
          message={`Se eliminará «${confirmar.imagen.alt}». Esta acción no se puede deshacer.`}
          onConfirm={() => void ejecutarConfirmacion()} onCancel={() => setConfirmar(null)}
        />
      )}
    </>
  );
}
