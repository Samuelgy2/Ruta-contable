const pool = require('../db');

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
    const {
      clubNombre, nit, direccion, telefono, email, logoUrl,
      moneda, diaVencimientoDefault, porcentajeMora,
    } = req.body;

    if (clubNombre !== undefined && clubNombre.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre del club no puede estar vacío' });
    }

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

module.exports = { get, update };
