// Validación y alta de la ficha de socio compartidas por el registro público
// (AuthController.register) y por el alta de usuarios del panel (routes/users.js).
// Los límites siguen las columnas de la tabla socio (0000_baseline.sql).

const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'PAS'];        // socio_tipo_documento_check
const NIVELES = ['Iniciación', 'Rider School', 'Club'];   // socio_nivel_aprendizaje_check
const FORMATO_NOMBRE = /^[\p{L} .'-]+$/u;                 // el formulario filtra números y símbolos
const FORMATO_DOCUMENTO = /^[A-Za-z0-9-]+$/;
const FORMATO_TELEFONO = /^[0-9+ ]+$/;
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

// 'YYYY-MM-DD' válida y no futura (comparada como texto con la fecha local de hoy).
function fechaNacimientoValida(valor) {
  if (!FORMATO_FECHA.test(valor)) return false;
  const [a, m, d] = valor.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  if (fecha.getFullYear() !== a || fecha.getMonth() !== m - 1 || fecha.getDate() !== d) return false;
  const hoy = new Date();
  const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return valor <= hoyTexto && a >= 1900;
}

/**
 * Valida los datos personales del socio que escribe el aspirante (o el admin
 * al crear una cuenta con socio nuevo). No incluye estado, membresía ni fecha
 * de ingreso: esos los fija quien llama.
 * @returns {{ datos: object, errores: string[] }}
 */
function validarDatosSocio(entrada) {
  const e = entrada && typeof entrada === 'object' ? entrada : {};
  const errores = [];

  const nombre = texto(e.nombre).replace(/\s+/g, ' ');
  const tipoDocumento = texto(e.tipo_documento) || 'CC';
  const documento = texto(e.documento);
  const fechaNacimiento = texto(e.fecha_nacimiento);
  const telefono = texto(e.telefono);
  const direccion = texto(e.direccion);
  const nivel = texto(e.nivel_aprendizaje);

  if (!nombre) errores.push('El nombre completo es obligatorio');
  else if (nombre.length > 100 || !FORMATO_NOMBRE.test(nombre)) errores.push('El nombre solo admite letras y espacios (máximo 100 caracteres)');

  if (!TIPOS_DOCUMENTO.includes(tipoDocumento)) errores.push('El tipo de documento debe ser CC, TI, CE o PAS');

  if (!documento) errores.push('El número de documento es obligatorio');
  else if (documento.length > 20 || !FORMATO_DOCUMENTO.test(documento)) errores.push('El documento solo admite letras, números y guiones (máximo 20 caracteres)');
  else if (tipoDocumento !== 'PAS' && !/^\d+$/.test(documento)) errores.push('Para CC, TI o CE el documento solo admite números');

  if (!fechaNacimiento) errores.push('La fecha de nacimiento es obligatoria');
  else if (!fechaNacimientoValida(fechaNacimiento)) errores.push('La fecha de nacimiento debe ser una fecha válida y no futura');

  if (!telefono) errores.push('El teléfono es obligatorio');
  else if (telefono.length > 20 || !FORMATO_TELEFONO.test(telefono)) errores.push('El teléfono solo admite números, espacios y el signo + (máximo 20 caracteres)');

  if (direccion.length > 200) errores.push('La dirección no puede superar 200 caracteres');

  if (nivel && !NIVELES.includes(nivel)) errores.push('El nivel de aprendizaje debe ser Iniciación, Rider School o Club');

  return {
    datos: {
      nombre,
      tipo_documento: tipoDocumento,
      documento: tipoDocumento === 'PAS' ? documento.toUpperCase() : documento,
      fecha_nacimiento: fechaNacimiento,
      telefono,
      direccion: direccion || null,
      nivel_aprendizaje: nivel || null,
    },
    errores,
  };
}

/**
 * Crea la ficha de socio dentro de una transacción ya abierta.
 * @param {import('pg').PoolClient} cliente
 * @param {object} datos  Resultado de validarDatosSocio.
 * @param {object} extra  { email, estado, createdBy }
 * @returns {Promise<number>} id_socio
 */
async function insertarSocio(cliente, datos, { email, estado, createdBy }) {
  const { rows } = await cliente.query(
    `INSERT INTO socio
       (nombre, documento, tipo_documento, email, telefono, direccion,
        fecha_nacimiento, fecha_ingreso, tipo_membresia, nivel_aprendizaje, estado, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'Media', $8, $9, $10)
     RETURNING id_socio`,
    [
      datos.nombre, datos.documento, datos.tipo_documento, email || null,
      datos.telefono, datos.direccion, datos.fecha_nacimiento,
      datos.nivel_aprendizaje, estado, createdBy ?? null,
    ]
  );
  return rows[0].id_socio;
}

/**
 * Vincula la cuenta recién creada con su ficha. El disparador
 * crear_perfil_por_rol ya creó la fila de socio_perfil al insertar el usuario.
 */
async function vincularPerfil(cliente, userId, idSocio, telefono) {
  const { rowCount } = await cliente.query(
    `UPDATE socio_perfil
        SET id_socio = $1, telefono = COALESCE($2, telefono), updated_at = NOW()
      WHERE user_id = $3`,
    [idSocio, telefono || null, userId]
  );
  if (rowCount === 0) throw new Error(`El usuario ${userId} no tiene perfil de socio`);
}

async function documentoRegistrado(cliente, documento) {
  const { rows } = await cliente.query('SELECT 1 FROM socio WHERE documento = $1', [documento]);
  return rows.length > 0;
}

module.exports = {
  validarDatosSocio, insertarSocio, vincularPerfil, documentoRegistrado,
  TIPOS_DOCUMENTO, NIVELES,
};
