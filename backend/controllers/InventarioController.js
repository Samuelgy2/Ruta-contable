const pool = require('../db');

const TIPOS_MOVIMIENTO_VALIDOS = ['entrada', 'salida', 'ajuste'];

// ─── Productos (RF-071 a RF-075) ───────────────────────────────────────────

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

// POST /api/inventario/productos (RF-071)
async function createProduct(req, res) {
  try {
    const { name, price, description, categoriaId, stock = 0, codigo } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio' });
    }
    const priceNum = parseFloat(price);
    if (price === undefined || price === null || price === '' || isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: 'El precio debe ser numérico y no negativo' });
    }
    const stockNum = Number(stock ?? 0);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      return res.status(400).json({ success: false, message: 'El stock debe ser un entero mayor o igual a 0' });
    }

    const dup = await pool.query('SELECT 1 FROM products WHERE LOWER(name) = LOWER($1)', [String(name).trim()]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Ya existe un producto con ese nombre' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO products (name, price, description, categoria_id, stock, codigo)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [String(name).trim(), priceNum, description || null, categoriaId || null, stockNum, codigo ? String(codigo).trim() : null]
      );
      const producto = result.rows[0];

      if (stockNum > 0) {
        const userId = req.user?.id ?? null;
        await client.query(
          `INSERT INTO movimiento_inventario
             (id_producto, tipo, cantidad, stock_anterior, stock_nuevo, motivo, referencia_origen, created_by, registrado_by)
           VALUES ($1, 'entrada', $2, 0, $2, 'Inventario inicial al crear producto', 'creacion_producto', $3, $3)`,
          [producto.id, stockNum, userId]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, data: producto, message: 'Producto creado correctamente' });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'El código o nombre del producto ya existe' });
    }
    console.error('Error createProduct:', error);
    res.status(500).json({ success: false, message: 'Error al crear producto' });
  }
}

// PUT /api/inventario/productos/:id (RF-074)
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, price, description, categoriaId, stock } = req.body;

    const exists = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    const actual = exists.rows[0];

    if (name !== undefined) {
      if (String(name).trim() === '') {
        return res.status(400).json({ success: false, message: 'El nombre del producto no puede quedar vacío' });
      }
      const dup = await pool.query(
        'SELECT 1 FROM products WHERE LOWER(name) = LOWER($1) AND id <> $2',
        [String(name).trim(), id]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Ya existe otro producto con ese nombre' });
      }
    }

    if (price !== undefined && price !== null && price !== '') {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ success: false, message: 'El precio debe ser numérico y no negativo' });
      }
    }

    let stockNum = null;
    if (stock !== undefined && stock !== null && stock !== '') {
      stockNum = Number(stock);
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        return res.status(400).json({ success: false, message: 'El stock debe ser un entero mayor o igual a 0' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE products SET
          name         = COALESCE($1, name),
          price        = COALESCE($2, price),
          description  = COALESCE($3, description),
          categoria_id = COALESCE($4, categoria_id),
          stock        = COALESCE($5, stock),
          updated_at   = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [
          name !== undefined ? String(name).trim() : null,
          price !== undefined && price !== null && price !== '' ? parseFloat(price) : null,
          description,
          categoriaId,
          stockNum,
          id,
        ]
      );
      const actualizado = result.rows[0];

      // RF-072 RN-003: registrar ajuste si cambió el stock
      if (stockNum !== null && stockNum !== Number(actual.stock)) {
        const diff = Math.abs(stockNum - Number(actual.stock));
        const userId = req.user?.id ?? null;
        await client.query(
          `INSERT INTO movimiento_inventario
             (id_producto, tipo, cantidad, stock_anterior, stock_nuevo, motivo, referencia_origen, created_by, registrado_by)
           VALUES ($1, 'ajuste', $2, $3, $4, 'Ajuste manual en edición de producto', 'edicion_producto', $5, $5)`,
          [id, diff, Number(actual.stock), stockNum, userId]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, data: actualizado, message: 'Producto actualizado correctamente' });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updateProduct:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
}

// DELETE /api/inventario/productos/:id (RF-075)
async function removeProduct(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar un producto que tiene compras o movimientos registrados',
      });
    }
    console.error('Error removeProduct:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
}

// ─── Movimientos de inventario (RF-072) ────────────────────────────────────

// GET /api/inventario/movimientos
async function getMovimientos(req, res) {
  try {
    const { idProducto } = req.query;
    const params = [];
    let where = '';
    if (idProducto) {
      params.push(parseInt(idProducto, 10));
      where = 'WHERE m.id_producto = $1';
    }
    const result = await pool.query(
      `SELECT m.*, p.name AS producto_nombre, u.username AS usuario_nombre
         FROM movimiento_inventario m
         LEFT JOIN products p ON p.id = m.id_producto
         LEFT JOIN users u ON u.id = COALESCE(m.registrado_by, m.created_by)
         ${where}
        ORDER BY m.created_at DESC, m.id_movimiento DESC
        LIMIT 200`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getMovimientos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos de inventario' });
  }
}

// POST /api/inventario/movimientos
async function createMovimiento(req, res) {
  try {
    const { idProducto, tipo, cantidad, motivo, idCompra } = req.body;
    const prodId = Number(idProducto);
    if (!Number.isInteger(prodId) || prodId <= 0) {
      return res.status(400).json({ success: false, message: 'Debe seleccionar un producto válido' });
    }
    if (!tipo || !TIPOS_MOVIMIENTO_VALIDOS.includes(tipo)) {
      return res.status(400).json({ success: false, message: "El tipo debe ser 'entrada', 'salida' o 'ajuste'" });
    }
    const cantNum = Number(cantidad);
    if (!Number.isInteger(cantNum) || cantNum <= 0) {
      return res.status(400).json({ success: false, message: 'La cantidad debe ser un entero mayor a cero' });
    }
    if (!motivo || String(motivo).trim() === '') {
      return res.status(400).json({ success: false, message: 'El motivo del movimiento es obligatorio' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const prodRes = await client.query('SELECT id, name, stock FROM products WHERE id = $1 FOR UPDATE', [prodId]);
      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      }
      const stockAnterior = Number(prodRes.rows[0].stock) || 0;
      let stockNuevo = stockAnterior;
      if (tipo === 'entrada') {
        stockNuevo = stockAnterior + cantNum;
      } else if (tipo === 'salida') {
        stockNuevo = stockAnterior - cantNum;
      } else {
        stockNuevo = cantNum;
      }

      if (stockNuevo < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente (disponible: ${stockAnterior}, solicitado: ${cantNum})`,
        });
      }

      const cantMovimiento = tipo === 'ajuste' ? Math.max(Math.abs(stockNuevo - stockAnterior), 1) : cantNum;
      const userId = req.user?.id ?? null;

      await client.query(
        'UPDATE products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [stockNuevo, prodId]
      );

      const movRes = await client.query(
        `INSERT INTO movimiento_inventario
           (id_producto, tipo, cantidad, stock_anterior, stock_nuevo, motivo, id_compra, referencia_origen, created_by, registrado_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual', $8, $8)
         RETURNING *`,
        [prodId, tipo, cantMovimiento, stockAnterior, stockNuevo, String(motivo).trim(), idCompra || null, userId]
      );

      await client.query('COMMIT');
      res.status(201).json({
        success: true,
        data: movRes.rows[0],
        message: 'Movimiento de inventario registrado correctamente',
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error createMovimiento:', error);
    res.status(500).json({ success: false, message: 'Error al registrar movimiento de inventario' });
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
  getMovimientos, createMovimiento,
  getAllCategorias, createCategoria,
  getPedidosJersey,
};
