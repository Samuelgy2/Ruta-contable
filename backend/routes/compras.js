const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const compraController = require('../controllers/CompraController');

router.use(requireAdmin);

router.get('/',                       compraController.getAll);        // GET    /api/compras
router.get('/:id',                    compraController.getById);       // GET    /api/compras/:id
router.post('/',                      compraController.create);        // POST   /api/compras
router.put('/:id',                    compraController.update);        // PUT    /api/compras/:id
router.post('/:id/aprobar',           compraController.aprobar);       // POST   /api/compras/:id/aprobar
router.delete('/:id',                 compraController.remove);        // DELETE /api/compras/:id
router.post('/:id/detalle',           compraController.addDetalle);    // POST   /api/compras/:id/detalle
router.delete('/:id/detalle/:nroLinea', compraController.removeDetalle); // DELETE /api/compras/:id/detalle/:nroLinea

module.exports = router;
