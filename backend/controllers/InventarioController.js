const pool = require('../db');

// ─── Productos (RF-056 a RF-061) ───────────────────────────────────────────

// GET /api/inventario/productos
async function getAllProducts(req, res) {
  try {
    const { search = '', categoriaId } = req.query;

    let conditions = [];
    let params = [];
    let i = 1;

    if (search) {
      conditions.push(`p.name ILIKE $${i++}`);
      params.push(`%${search}%`);
    }
    if (categoriaId) {
      conditions.push(`p.categoria_id = $${i++}`);
      params.push(parseInt(categoriaId));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT p.*, cp.nombre AS categoria_nombre
       FROM products p
       LEFT JOIN categoria_producto cp ON cp.id = p.categoria_id
       ${where}
       ORDER BY p.name ASC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAllProducts:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
}

// GET /api/inventario/productos/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, cp.nombre AS categoria_nombre
       FROM products p
       LEFT JOIN categoria_producto cp ON cp.id = p.categoria_id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getProductById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener producto' });
  }
}

// POST /api/inventario/productos
async function createProduct(req, res) {
  try {
    const { name, price, description, categoriaId, stock = 0 } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio' });
    }
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: 'El precio debe ser numérico y no negativo' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, price, description, categoria_id, stock)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [name.trim(), priceNum, description || null, categoriaId || null, parseInt(stock) || 0]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Producto creado correctamente' });
  } catch (error) {
    console.error('Error createProduct:', error);
    res.status(500).json({ success: false, message: 'Error al crear producto' });
  }
}

// PUT /api/inventario/productos/:id
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, price, description, categoriaId, stock } = req.body;

    const exists = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const result = await pool.query(
      `UPDATE products SET
        name         = COALESCE($1, name),
        price        = COALESCE($2, price),
        description  = COALESCE($3, description),
        categoria_id = COALESCE($4, categoria_id),
        stock        = COALESCE($5, stock),
        updated_at   = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, price ? parseFloat(price) : null, description, categoriaId, stock !== undefined ? parseInt(stock) : null, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Producto actualizado correctamente' });
  } catch (error) {
    console.error('Error updateProduct:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
}

// DELETE /api/inventario/productos/:id
async function removeProduct(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error removeProduct:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
}

// ─── Categorías de producto ─────────────────────────────────────────────────

// GET /api/inventario/categorias
async function getAllCategorias(req, res) {
  try {
    const result = await pool.query('SELECT * FROM categoria_producto ORDER BY nombre ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getAllCategorias:', error);
    res.status(500).json({ success: false, message: 'Error al obtener categorías de producto' });
  }
}

// POST /api/inventario/categorias
async function createCategoria(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio' });
    }

    const result = await pool.query(
      'INSERT INTO categoria_producto (nombre) VALUES ($1) RETURNING *',
      [nombre.trim()]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Categoría creada correctamente' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
    }
    console.error('Error createCategoria:', error);
    res.status(500).json({ success: false, message: 'Error al crear categoría' });
  }
}

// ─── Indumentaria (pedido_jersey / inventario_jersey) — solo consulta ──────

// GET /api/inventario/jerseys
async function getPedidosJersey(req, res) {
  try {
    const result = await pool.query(
      `SELECT pj.*, s.nombre AS socio_nombre,
              ij.id_inventario, ij.estado_entrega, ij.fecha_entrega
       FROM pedido_jersey pj
       LEFT JOIN socio s ON s.id_socio = pj.id_socio
       LEFT JOIN inventario_jersey ij ON ij.id_pedido = pj.id_pedido
       ORDER BY pj.fecha DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getPedidosJersey:', error);
    res.status(500).json({ success: false, message: 'Error al obtener pedidos de indumentaria' });
  }
}

module.exports = {
  getAllProducts, getProductById, createProduct, updateProduct, removeProduct,
  getAllCategorias, createCategoria,
  getPedidosJersey,
};
