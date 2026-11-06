const pool = require('../db');

// Documentos del socio (RF-050). Se guardan en socio_documento.datos (bytea);
// la BD limita cada archivo a 5 MB (CHECK socio_documento_bytes_check).
const DOC_MAX_BYTES = 5 * 1024 * 1024;
const TIPOS_ARCHIVO = ['application/pdf', 'image/jpeg', 'image/png'];

// Firma de los primeros bytes: el content-type del cliente no basta.
function detectarTipo(buf) {
  if (buf.length >= 4 && buf.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return null;
}

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// GET /api/socios/:id/documentos — sin los bytes
async function listar(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id_documento, id_socio, tipo_documento, nombre_archivo, mime, bytes, observaciones, created_at
       FROM socio_documento WHERE id_socio = $1 ORDER BY created_at DESC`,
      [Number(req.params.id) || 0]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listar documentos socio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los documentos' });
  }
}

// POST /api/socios/:id/documentos?tipo=&nombre=&observaciones= — cuerpo binario PDF/JPG/PNG
async function subir(req, res) {
  const idSocio = Number(req.params.id) || 0;
  const tipo    = texto(req.query.tipo, 60);
  const nombre  = texto(req.query.nombre, 200) || 'documento';
  const datos   = req.body;

  // RN-003: el tipo de documento es obligatorio.
  if (!tipo) {
    return res.status(400).json({ success: false, message: 'El tipo de documento es obligatorio' });
  }
  if (!Buffer.isBuffer(datos) || datos.length === 0) {
    return res.status(415).json({ success: false, message: 'Sube un archivo PDF, JPG o PNG.' });
  }
  if (datos.length > DOC_MAX_BYTES) {
    return res.status(413).json({ success: false, message: 'El archivo supera el máximo de 5 MB.' });
  }
  const mime = detectarTipo(datos);
  if (!mime) {
    return res.status(415).json({ success: false, message: 'El archivo no es un PDF, JPG o PNG válido.' });
  }

  try {
    // RN-001: el socio debe existir (la FK también lo exige; esto da un 404 claro).
    const socio = await pool.query('SELECT 1 FROM socio WHERE id_socio = $1', [idSocio]);
    if (socio.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Socio no encontrado' });
    }
    const { rows } = await pool.query(
      `INSERT INTO socio_documento (id_socio, tipo_documento, nombre_archivo, mime, bytes, datos, observaciones, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id_documento, id_socio, tipo_documento, nombre_archivo, mime, bytes, observaciones, created_at`,
      [idSocio, tipo, nombre, mime, datos.length, datos, texto(req.query.observaciones, 500) || null, req.user?.id ?? null]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Documento guardado' });
  } catch (error) {
    console.error('Error subir documento socio:', error);
    res.status(500).json({ success: false, message: 'Error al guardar el documento' });
  }
}

// GET /api/socios/:id/documentos/:docId/archivo
async function archivo(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT nombre_archivo, mime, datos FROM socio_documento WHERE id_documento = $1 AND id_socio = $2',
      [Number(req.params.docId) || 0, Number(req.params.id) || 0]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    res.set({
      'Content-Type': rows[0].mime,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(rows[0].nombre_archivo)}"`,
      'Cache-Control': 'private, no-store',
    }).send(rows[0].datos);
  } catch (error) {
    console.error('Error archivo documento socio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el documento' });
  }
}

// DELETE /api/socios/:id/documentos/:docId
async function eliminar(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM socio_documento WHERE id_documento = $1 AND id_socio = $2',
      [Number(req.params.docId) || 0, Number(req.params.id) || 0]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    res.json({ success: true, message: 'Documento eliminado' });
  } catch (error) {
    console.error('Error eliminar documento socio:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el documento' });
  }
}

module.exports = { listar, subir, archivo, eliminar, detectarTipo, DOC_MAX_BYTES };
