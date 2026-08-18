const pool = require('../db');

// GET /api/categories
async function getAll(req, res) {
  try {
    const { type, active, search = '' } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (type) {
      conditions.push(`type = $${i++}`);
      params.push(type);
    }
    if (active !== undefined) {
      conditions.push(`active = $${i++}`);
      params.push(active === 'true');
    }
    if (search) {
      conditions.push(`name ILIKE $${i++}`);
      params.push(`%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM categories ${where} ORDER BY type ASC, name ASC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAll categories:', error);
    res.status(500).json({ success: false, message: 'Error al obtener categorías' });
  }
}

// GET /api/categories/:id
async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getById category:', error);
    res.status(500).json({ success: false, message: 'Error al obtener categoría' });
  }
}

// POST /api/categories
async function create(req, res) {
  try {
    const { name, type, description, active = true } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio' });
    }
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: "type debe ser 'income' o 'expense'" });
    }

    const exists = await pool.query(
      'SELECT id FROM categories WHERE name = $1 AND type = $2', [name.trim(), type]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Ya existe una categoría con ese nombre y tipo' });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, type, description, active)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [name.trim(), type, description || null, active !== false]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Categoría creada correctamente' });
  } catch (error) {
    console.error('Error create category:', error);
    res.status(500).json({ success: false, message: 'Error al crear categoría' });
  }
}

// PUT /api/categories/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const { name, type, description, active } = req.body;

    const exists = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: "type debe ser 'income' o 'expense'" });
    }

    const result = await pool.query(
      `UPDATE categories SET
        name        = COALESCE($1, name),
        type        = COALESCE($2, type),
        description = COALESCE($3, description),
        active      = COALESCE($4, active),
        updated_at  = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, type, description, active, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Categoría actualizada correctamente' });
  } catch (error) {
    console.error('Error update category:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar categoría' });
  }
}

// DELETE /api/categories/:id
async function remove(req, res) {
  try {
    const { id } = req.params;

    const inUse = await pool.query('SELECT id FROM transactions WHERE categoria_id = $1 LIMIT 1', [id]);
    if (inUse.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar una categoría con transacciones asociadas. Desactívala en su lugar.',
      });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }

    res.json({ success: true, message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error delete category:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar categoría' });
  }
}

module.exports = { getAll, getById, create, update, remove };
