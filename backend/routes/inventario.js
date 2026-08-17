const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const inventarioController = require('../controllers/InventarioController');

router.use(requireAdmin);

router.get('/productos',       inventarioController.getAllProducts);   // GET    /api/inventario/productos
router.get('/productos/:id',   inventarioController.getProductById);   // GET    /api/inventario/productos/:id
router.post('/productos',      inventarioController.createProduct);    // POST   /api/inventario/productos
router.put('/productos/:id',   inventarioController.updateProduct);    // PUT    /api/inventario/productos/:id
router.delete('/productos/:id',inventarioController.removeProduct);    // DELETE /api/inventario/productos/:id

router.get('/categorias',      inventarioController.getAllCategorias); // GET    /api/inventario/categorias
router.post('/categorias',     inventarioController.createCategoria);  // POST   /api/inventario/categorias

router.get('/jerseys',         inventarioController.getPedidosJersey); // GET    /api/inventario/jerseys

module.exports = router;
