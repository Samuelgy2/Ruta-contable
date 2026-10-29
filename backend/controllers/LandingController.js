const pool = require('../db');
// Contenido actual de la landing estática; se sirve mientras no haya versión
// publicada (RF-097). La semilla 20261028_landing.seed.sql trae lo mismo.
const CONTENIDO_POR_DEFECTO = require('./landingPorDefecto.json');

// ─── Reglas de contenido (RF-089, RF-091, RF-092) ─────────────────────────────
// Secciones fijas de la landing; el orden del array es el orden público.
const SECCIONES = ['inicio', 'cifras', 'club', 'escuela', 'sedes', 'entrenadores', 'galeria', 'contacto'];
const NOMBRES = {
  inicio: 'Portada', cifras: 'Cifras', club: 'El club', escuela: 'Escuela',
  sedes: 'Sedes', entrenadores: 'Entrenadores', galeria: 'Galería', contacto: 'Contacto',
};

const TITULO_MAX    = 100;
const TEXTO_MAX     = 2000;
const ALT_MAX       = 150;
const IMAGENES_MAX  = 12;
const REDES_MAX     = 10;
const IMAGEN_MAX_BYTES = 2 * 1024 * 1024;
const TIPOS_IMAGEN  = ['image/jpeg', 'image/png', 'image/webp'];

const CORREO_RE   = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const TELEFONO_RE = /^[0-9+ ]*$/;

// Texto plano: quita scripts/estilos con su contenido, cualquier etiqueta HTML y
// caracteres de control. Se repite hasta que no cambie para que una etiqueta
// partida ("<scr<b>ipt>") no se recomponga tras la primera pasada.
function limpiarTexto(valor) {
  let texto = String(valor ?? '').replace(/\r\n?/g, '\n');
  let anterior;
  do {
    anterior = texto;
    texto = texto
      .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?(<\/\1\s*>|$)/gi, '')
      .replace(/<\/?[a-z!][^>]*>/gi, '');
  } while (texto !== anterior);
  return texto.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function esHttps(url) {
  try {
    return url.startsWith('https://') && new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

// Devuelve { contenido, errores }. `contenido` sólo trae campos conocidos y ya
// sanitizados; si hay errores no debe guardarse.
function validarContenido(entrada) {
  const errores = [];
  const error = (campo, mensaje) => errores.push({ campo, mensaje });

  if (!entrada || typeof entrada !== 'object' || !Array.isArray(entrada.secciones)) {
    return { contenido: null, errores: [{ campo: 'contenido', mensaje: 'El contenido no tiene el formato esperado.' }] };
  }

  const ids = entrada.secciones.map(s => s && s.id);
  if (ids.length !== SECCIONES.length || SECCIONES.some(id => ids.filter(x => x === id).length !== 1)) {
    error('secciones', 'Deben venir todas las secciones de la landing, cada una una sola vez.');
  }

  const secciones = entrada.secciones
    .filter(s => s && SECCIONES.includes(s.id))
    .map(s => {
      const campo  = `secciones.${s.id}`;
      const nombre = NOMBRES[s.id];
      const titulo = limpiarTexto(s.titulo);
      const texto  = limpiarTexto(s.texto);
      const imagenes = Array.isArray(s.imagenes) ? s.imagenes : [];

      if (!titulo) error(`${campo}.titulo`, `El título de "${nombre}" es obligatorio.`);
      if (titulo.length > TITULO_MAX) error(`${campo}.titulo`, `El título de "${nombre}" no puede superar ${TITULO_MAX} caracteres (tiene ${titulo.length}).`);
      if (texto.length > TEXTO_MAX)   error(`${campo}.texto`,  `El texto de "${nombre}" no puede superar ${TEXTO_MAX} caracteres (tiene ${texto.length}).`);
      if (imagenes.length > IMAGENES_MAX || imagenes.some(id => !Number.isInteger(id) || id <= 0)) {
        error(`${campo}.imagenes`, `"${nombre}" admite hasta ${IMAGENES_MAX} imágenes válidas.`);
      }
      if (s.id === 'contacto' && s.visible === false) {
        error(`${campo}.visible`, 'La sección de contacto no se puede ocultar.');
      }

      return { id: s.id, titulo, texto, visible: s.visible !== false, imagenes: [...new Set(imagenes)] };
    });

  if (!secciones.some(s => s.visible)) error('secciones', 'Debe quedar al menos una sección visible.');

  const c = entrada.contacto && typeof entrada.contacto === 'object' ? entrada.contacto : {};
  const correo    = String(c.correo ?? '').trim();
  const telefono  = String(c.telefono ?? '').trim();
  const direccion = limpiarTexto(c.direccion);
  const redesIn   = Array.isArray(c.redes) ? c.redes : [];

  if (!CORREO_RE.test(correo) || correo.length > 100) error('contacto.correo', 'Escribe un correo válido, por ejemplo club@dominio.com.');
  if (!TELEFONO_RE.test(telefono) || telefono.length > 30) error('contacto.telefono', 'El teléfono sólo admite números, espacios y el signo +.');
  if (direccion.length > 200) error('contacto.direccion', 'La dirección no puede superar 200 caracteres.');
  if (redesIn.length > REDES_MAX) error('contacto.redes', `Se admiten hasta ${REDES_MAX} redes sociales.`);

  const redes = redesIn.slice(0, REDES_MAX).map((r, i) => {
    const nombre   = limpiarTexto(r && r.nombre);
    const url      = String((r && r.url) ?? '').trim();
    const etiqueta = limpiarTexto(r && r.etiqueta);
    if (!nombre || nombre.length > 50) error(`contacto.redes.${i}.nombre`, `La red ${i + 1} necesita un nombre de hasta 50 caracteres.`);
    if (!esHttps(url) || url.length > 300) error(`contacto.redes.${i}.url`, `El enlace de la red ${i + 1} debe iniciar con https://.`);
    if (etiqueta.length > TITULO_MAX) error(`contacto.redes.${i}.etiqueta`, `La etiqueta de la red ${i + 1} no puede superar ${TITULO_MAX} caracteres.`);
    return { nombre, url, etiqueta };
  });

  return { contenido: { secciones, contacto: { correo, telefono, direccion, redes } }, errores };
}

function imagenesDe(contenido) {
  return new Set((contenido?.secciones ?? []).flatMap(s => s.imagenes ?? []));
}

// Reconoce el formato por sus primeros bytes, no por lo que diga el cliente.
function detectarTipoImagen(buf) {
  if (buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'image/png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

// ─── Acceso a datos ───────────────────────────────────────────────────────────
const SELECT_PUBLICADA = `
  SELECT v.numero, v.contenido, v.publicado_at, u.full_name AS publicado_por
    FROM landing_version v
    LEFT JOIN users u ON u.id = v.publicado_by
   ORDER BY v.numero DESC
   LIMIT 1
`;

async function enTransaccion(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

function auditar(cliente, req, accion, detalle) {
  return cliente.query(
    `INSERT INTO auditoria (usuario_id, accion, entidad, detalle, ip) VALUES ($1, $2, 'landing', $3, $4)`,
    [req.user.id, accion, detalle ? JSON.stringify(detalle) : null, req.ip]
  );
}

async function imagenesInexistentes(cliente, contenido) {
  const ids = [...imagenesDe(contenido)];
  if (ids.length === 0) return [];
  const { rows } = await cliente.query('SELECT id FROM landing_imagen WHERE id = ANY($1::int[])', [ids]);
  const existentes = new Set(rows.map(r => r.id));
  return ids.filter(id => !existentes.has(id));
}

async function metadatosImagenes(contenido) {
  const ids = [...imagenesDe(contenido)];
  if (ids.length === 0) return [];
  const { rows } = await pool.query('SELECT id, alt FROM landing_imagen WHERE id = ANY($1::int[])', [ids]);
  return rows;
}

// jsonb reordena las claves al guardar: se comparan con las claves ordenadas.
const canonico = (valor) => JSON.stringify(valor, (_k, v) => (
  v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v
));
const mismoContenido = (a, b) => canonico(a) === canonico(b);

function errorValidacion(res, errores) {
  return res.status(400).json({ success: false, message: 'Revisa los campos marcados.', errores });
}

// ─── Administración (/api/admin/landing) ──────────────────────────────────────

// GET / — borrador, versión publicada y si hay cambios sin publicar (RF-088).
async function getEstado(req, res) {
  try {
    const [borrador, publicada] = await Promise.all([
      pool.query(`
        SELECT b.contenido, b.updated_at, u.full_name AS actualizado_por
          FROM landing_borrador b
          LEFT JOIN users u ON u.id = b.updated_by
         WHERE b.id = 1`),
      pool.query(SELECT_PUBLICADA),
    ]);
    const b = borrador.rows[0];
    const p = publicada.rows[0];

    res.json({
      success: true,
      data: {
        borrador: b ? { contenido: b.contenido, actualizadoEn: b.updated_at, actualizadoPor: b.actualizado_por } : null,
        publicado: p ? { numero: p.numero, contenido: p.contenido, publicadoEn: p.publicado_at, publicadoPor: p.publicado_por } : null,
        cambiosSinPublicar: Boolean(b) && (!p || !mismoContenido(b.contenido, p.contenido)),
      },
    });
  } catch (error) {
    console.error('Error get landing:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el contenido de la landing' });
  }
}

// PUT /borrador — guarda el borrador sanitizado (RF-089, RF-091, RF-092).
async function guardarBorrador(req, res) {
  const { contenido, errores } = validarContenido(req.body?.contenido);
  if (errores.length) return errorValidacion(res, errores);

  try {
    const resultado = await enTransaccion(async (cliente) => {
      const faltantes = await imagenesInexistentes(cliente, contenido);
      if (faltantes.length) return { faltantes };

      const previo = (await cliente.query('SELECT contenido FROM landing_borrador WHERE id = 1 FOR UPDATE')).rows[0]?.contenido;
      const { rows } = await cliente.query(
        `INSERT INTO landing_borrador (id, contenido, updated_by, updated_at)
         VALUES (1, $1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET contenido = EXCLUDED.contenido,
                                        updated_by = EXCLUDED.updated_by,
                                        updated_at = EXCLUDED.updated_at
         RETURNING updated_at`,
        [JSON.stringify(contenido), req.user.id]
      );

      // Para la bitácora: qué secciones cambiaron respecto al borrador anterior.
      const antes = new Map((previo?.secciones ?? []).map(s => [s.id, s]));
      const cambios = contenido.secciones.filter(s => !mismoContenido(antes.get(s.id), s)).map(s => s.id);
      if (!previo || !mismoContenido(previo.contacto, contenido.contacto)) cambios.push('datos-contacto');
      if (previo && !mismoContenido(previo.secciones.map(s => s.id), contenido.secciones.map(s => s.id))) cambios.push('orden');
      await auditar(cliente, req, 'guardar_borrador', { cambios });

      return { actualizadoEn: rows[0].updated_at };
    });

    if (resultado.faltantes) {
      return errorValidacion(res, resultado.faltantes.map(id => ({
        campo: 'imagenes', mensaje: `La imagen #${id} ya no existe. Quítala o reemplázala.`,
      })));
    }

    res.json({ success: true, data: { contenido, actualizadoEn: resultado.actualizadoEn }, message: 'Borrador guardado. Aún no es público: publícalo para aplicarlo.' });
  } catch (error) {
    console.error('Error guardar borrador landing:', error);
    res.status(500).json({ success: false, message: 'Error al guardar el borrador' });
  }
}

// GET /imagenes — biblioteca con indicador de uso (RF-090).
async function listarImagenes(req, res) {
  try {
    const [imagenes, borrador, publicada] = await Promise.all([
      pool.query('SELECT id, alt, mime, bytes, created_at FROM landing_imagen ORDER BY id DESC'),
      pool.query('SELECT contenido FROM landing_borrador WHERE id = 1'),
      pool.query(SELECT_PUBLICADA),
    ]);
    const enBorrador  = imagenesDe(borrador.rows[0]?.contenido);
    const enPublicada = imagenesDe(publicada.rows[0]?.contenido);

    res.json({
      success: true,
      data: imagenes.rows.map(i => ({
        id: i.id, alt: i.alt, mime: i.mime, bytes: i.bytes, creadoEn: i.created_at,
        enBorrador: enBorrador.has(i.id), enPublicada: enPublicada.has(i.id),
      })),
    });
  } catch (error) {
    console.error('Error listar imágenes landing:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las imágenes' });
  }
}

// POST /imagenes?alt=... — cuerpo binario JPG/PNG/WEBP de hasta 2 MB (RF-090, RNF-012).
async function subirImagen(req, res) {
  const datos = req.body;
  const alt   = limpiarTexto(req.query.alt);

  if (!Buffer.isBuffer(datos) || datos.length === 0) {
    return res.status(415).json({ success: false, message: 'Formato no permitido. Sube una imagen JPG, PNG o WEBP.' });
  }
  const tipo = detectarTipoImagen(datos);
  if (!tipo || tipo !== req.get('content-type')) {
    return res.status(415).json({ success: false, message: 'El archivo no es una imagen JPG, PNG o WEBP válida.' });
  }
  if (datos.length > IMAGEN_MAX_BYTES) {
    return res.status(413).json({ success: false, message: 'La imagen supera el máximo de 2 MB.' });
  }
  if (!alt || alt.length > ALT_MAX) {
    return errorValidacion(res, [{ campo: 'alt', mensaje: `El texto alternativo es obligatorio (máximo ${ALT_MAX} caracteres).` }]);
  }

  try {
    const imagen = await enTransaccion(async (cliente) => {
      const { rows } = await cliente.query(
        `INSERT INTO landing_imagen (mime, datos, bytes, alt, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, alt, mime, bytes, created_at`,
        [tipo, datos, datos.length, alt, req.user.id]
      );
      await auditar(cliente, req, 'subir_imagen', { id: rows[0].id, mime: tipo, bytes: datos.length, alt });
      return rows[0];
    });

    res.status(201).json({
      success: true,
      data: { id: imagen.id, alt: imagen.alt, mime: imagen.mime, bytes: imagen.bytes, creadoEn: imagen.created_at, enBorrador: false, enPublicada: false },
      message: 'Imagen subida. Asígnala a una sección y guarda el borrador.',
    });
  } catch (error) {
    console.error('Error subir imagen landing:', error);
    res.status(500).json({ success: false, message: 'Error al subir la imagen' });
  }
}

// GET /imagenes/:id/archivo — para la vista previa del borrador.
async function archivoImagenAdmin(req, res) {
  try {
    const { rows } = await pool.query('SELECT mime, datos FROM landing_imagen WHERE id = $1', [Number(req.params.id) || 0]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    res.set({ 'Content-Type': rows[0].mime, 'Cache-Control': 'private, max-age=3600' }).send(rows[0].datos);
  } catch (error) {
    console.error('Error archivo imagen landing:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la imagen' });
  }
}

// DELETE /imagenes/:id — no se borra una imagen en uso (RF-090).
async function eliminarImagen(req, res) {
  const id = Number(req.params.id) || 0;
  try {
    const resultado = await enTransaccion(async (cliente) => {
      const existe = await cliente.query('SELECT id, alt FROM landing_imagen WHERE id = $1 FOR UPDATE', [id]);
      if (!existe.rows[0]) return { status: 404, message: 'Imagen no encontrada' };

      const publicada = (await cliente.query(SELECT_PUBLICADA)).rows[0];
      if (imagenesDe(publicada?.contenido).has(id)) {
        return { status: 409, message: 'La imagen se usa en la versión publicada. Reemplázala en el borrador y publica antes de eliminarla.' };
      }
      const borrador = (await cliente.query('SELECT contenido FROM landing_borrador WHERE id = 1')).rows[0];
      if (imagenesDe(borrador?.contenido).has(id)) {
        return { status: 409, message: 'La imagen está asignada en el borrador. Quítala de la sección y guarda antes de eliminarla.' };
      }

      await cliente.query('DELETE FROM landing_imagen WHERE id = $1', [id]);
      await auditar(cliente, req, 'eliminar_imagen', { id, alt: existe.rows[0].alt });
      return { status: 200, message: 'Imagen eliminada' };
    });

    res.status(resultado.status).json({ success: resultado.status === 200, message: resultado.message });
  } catch (error) {
    console.error('Error eliminar imagen landing:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la imagen' });
  }
}

// POST /publicar — crea una versión nueva a partir del borrador (RF-094).
async function publicar(req, res) {
  try {
    const resultado = await enTransaccion(async (cliente) => {
      // Serializa publicaciones simultáneas para que el número no choque.
      await cliente.query('LOCK TABLE landing_version IN EXCLUSIVE MODE');

      const borrador = (await cliente.query('SELECT contenido FROM landing_borrador WHERE id = 1')).rows[0];
      if (!borrador) return { status: 400, message: 'No hay borrador para publicar.' };

      const { contenido, errores } = validarContenido(borrador.contenido);
      if (errores.length) return { status: 400, message: 'El borrador no es válido; corrígelo antes de publicar.', errores };

      const faltantes = await imagenesInexistentes(cliente, contenido);
      if (faltantes.length) {
        return { status: 400, message: 'El borrador usa imágenes que ya no existen.', errores: faltantes.map(id => ({ campo: 'imagenes', mensaje: `La imagen #${id} ya no existe.` })) };
      }

      const actual = (await cliente.query(SELECT_PUBLICADA)).rows[0];
      if (actual && mismoContenido(actual.contenido, contenido)) {
        return { status: 409, message: 'No hay cambios por publicar: el borrador es igual a la versión publicada.' };
      }

      const numero = (actual?.numero ?? 0) + 1;
      const { rows } = await cliente.query(
        'INSERT INTO landing_version (numero, contenido, publicado_by) VALUES ($1, $2, $3) RETURNING publicado_at',
        [numero, JSON.stringify(contenido), req.user.id]
      );
      await auditar(cliente, req, 'publicar', { numero });
      return { status: 201, data: { numero, publicadoEn: rows[0].publicado_at }, message: `Versión ${numero} publicada.` };
    });

    const { status, ...cuerpo } = resultado;
    res.status(status).json({ success: status === 201, ...cuerpo });
  } catch (error) {
    console.error('Error publicar landing:', error);
    res.status(500).json({ success: false, message: 'Error al publicar la landing' });
  }
}

// GET /versiones — historial (RF-095).
async function listarVersiones(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT v.numero, v.publicado_at, u.full_name AS publicado_por
        FROM landing_version v
        LEFT JOIN users u ON u.id = v.publicado_by
       ORDER BY v.numero DESC`);
    res.json({
      success: true,
      data: rows.map((v, i) => ({ numero: v.numero, publicadoEn: v.publicado_at, publicadoPor: v.publicado_por, actual: i === 0 })),
    });
  } catch (error) {
    console.error('Error listar versiones landing:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el historial' });
  }
}

// POST /versiones/:numero/restaurar — carga la versión como borrador (RF-095).
async function restaurarVersion(req, res) {
  const numero = Number(req.params.numero) || 0;
  try {
    const encontrada = await enTransaccion(async (cliente) => {
      const { rows } = await cliente.query('SELECT contenido FROM landing_version WHERE numero = $1', [numero]);
      if (!rows[0]) return false;
      await cliente.query(
        `INSERT INTO landing_borrador (id, contenido, updated_by, updated_at)
         VALUES (1, $1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET contenido = EXCLUDED.contenido,
                                        updated_by = EXCLUDED.updated_by,
                                        updated_at = EXCLUDED.updated_at`,
        [JSON.stringify(rows[0].contenido), req.user.id]
      );
      await auditar(cliente, req, 'restaurar_version', { numero });
      return true;
    });

    if (!encontrada) return res.status(404).json({ success: false, message: 'Versión no encontrada' });
    res.json({ success: true, message: `Versión ${numero} cargada como borrador. Publícala para que sea visible.` });
  } catch (error) {
    console.error('Error restaurar versión landing:', error);
    res.status(500).json({ success: false, message: 'Error al restaurar la versión' });
  }
}

// ─── Público (/api/landing) ───────────────────────────────────────────────────

// GET / — sólo la versión publicada; sin versión, el contenido por defecto (RF-097).
async function getPublicada(req, res) {
  try {
    const p = (await pool.query(SELECT_PUBLICADA)).rows[0];
    // no-cache: cada visita revalida, así una publicación se ve sin reiniciar.
    res.set('Cache-Control', 'no-cache');
    if (!p) return res.json({ success: true, data: { numero: null, porDefecto: true, contenido: CONTENIDO_POR_DEFECTO, imagenes: [] } });
    res.json({ success: true, data: { numero: p.numero, porDefecto: false, contenido: p.contenido, imagenes: await metadatosImagenes(p.contenido) } });
  } catch (error) {
    console.error('Error get landing pública:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la landing' });
  }
}

// GET /imagenes/:id — sólo imágenes de la versión publicada.
async function archivoImagenPublica(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT i.mime, i.datos
        FROM landing_imagen i
       WHERE i.id = $1
         AND EXISTS (
           SELECT 1
             FROM (SELECT contenido FROM landing_version ORDER BY numero DESC LIMIT 1) v,
                  jsonb_array_elements(v.contenido->'secciones') s
            WHERE s->'imagenes' @> jsonb_build_array($1::int))`,
      [Number(req.params.id) || 0]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Imagen no encontrada' });

    // Una imagen nunca cambia de bytes (reemplazar = subir otra), así que se
    // puede cachear para siempre. El frontend vive en otro origen (Vercel).
    res.set({
      'Content-Type': rows[0].mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    }).send(rows[0].datos);
  } catch (error) {
    console.error('Error imagen landing pública:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la imagen' });
  }
}

module.exports = {
  getEstado, guardarBorrador, listarImagenes, subirImagen, archivoImagenAdmin,
  eliminarImagen, publicar, listarVersiones, restaurarVersion,
  getPublicada, archivoImagenPublica,
  // Expuestos para las pruebas.
  validarContenido, limpiarTexto, detectarTipoImagen,
  TIPOS_IMAGEN, IMAGEN_MAX_BYTES,
};
