const pool = require('../db');

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Formato de NIT: 6 a 10 dígitos, con puntos de miles opcionales, y dígito de verificación opcional (-d).
const FORMATO_NIT = /^(\d{6,10}|\d{1,3}(\.\d{3}){2})(-\d)?$/;

function validarDatosClub(body = {}) {
  const { clubNombre, nit, email, diaVencimientoDefault, porcentajeMora } = body;

  if (clubNombre !== undefined && String(clubNombre).trim() === '') {
    return { error: 'El nombre del club no puede estar vacío', campo: 'clubNombre' };
  }

  if (email !== undefined && email !== null && String(email).trim() !== '') {
    if (!FORMATO_EMAIL.test(String(email).trim())) {
      return { error: 'El correo electrónico no tiene un formato válido', campo: 'email' };
    }
  }

  if (nit !== undefined && nit !== null && String(nit).trim() !== '') {
    if (!FORMATO_NIT.test(String(nit).trim())) {
      return { error: 'El NIT no tiene un formato válido (ej: 900.000.000-1 o 900000000-1)', campo: 'nit' };
    }
  }

  if (porcentajeMora !== undefined && porcentajeMora !== null && porcentajeMora !== '') {
    const mora = Number(porcentajeMora);
    if (Number.isNaN(mora) || mora < 0 || mora > 100) {
      return { error: 'El porcentaje de mora debe ser un número entre 0 y 100', campo: 'porcentajeMora' };
    }
  }

  if (diaVencimientoDefault !== undefined && diaVencimientoDefault !== null && diaVencimientoDefault !== '') {
    const dia = Number(diaVencimientoDefault);
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      return { error: 'El día de vencimiento por defecto debe ser un entero entre 1 y 31', campo: 'diaVencimientoDefault' };
    }
  }

  return { ok: true };
}

// GET /api/club-data — registro único (id=1)
async function get(req, res) {
  try {
    const result = await pool.query('SELECT * FROM system_data WHERE id = 1');

    if (result.rows.length === 0) {
      const created = await pool.query(
        `INSERT INTO system_data (id) VALUES (1) RETURNING *`
      );
      return res.json({ success: true, data: created.rows[0] });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error get club-data:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos del club' });
  }
}

// PUT /api/club-data
async function update(req, res) {
  try {
    const validacion = validarDatosClub(req.body);
    if (validacion.error) {
      return res.status(400).json({ success: false, message: validacion.error, campo: validacion.campo });
    }

    const {
      clubNombre, nit, direccion, telefono, email, logoUrl,
      moneda, diaVencimientoDefault, porcentajeMora,
    } = req.body;

    await pool.query(
      `INSERT INTO system_data (id) VALUES (1) ON CONFLICT (id) DO NOTHING`
    );

    const result = await pool.query(
      `UPDATE system_data SET
        club_nombre             = COALESCE($1, club_nombre),
        nit                     = COALESCE($2, nit),
        direccion               = COALESCE($3, direccion),
        telefono                = COALESCE($4, telefono),
        email                   = COALESCE($5, email),
        logo_url                = COALESCE($6, logo_url),
        moneda                  = COALESCE($7, moneda),
        dia_vencimiento_default = COALESCE($8, dia_vencimiento_default),
        porcentaje_mora         = COALESCE($9, porcentaje_mora),
        updated_at              = CURRENT_TIMESTAMP
       WHERE id = 1
       RETURNING *`,
      [clubNombre, nit, direccion, telefono, email, logoUrl, moneda, diaVencimientoDefault, porcentajeMora]
    );

    res.json({ success: true, data: result.rows[0], message: 'Datos del club actualizados correctamente' });
  } catch (error) {
    console.error('Error update club-data:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar datos del club' });
  }
}

module.exports = { get, update, validarDatosClub };
