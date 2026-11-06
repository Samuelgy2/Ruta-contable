const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const facturaController = require('../controllers/FacturaController');

// Facturación (RF-055 / RF-058)
router.use(requireAdmin);

router.get('/',             facturaController.getAll);        // GET  /api/facturas?estado=&search=
router.get('/:id',          facturaController.getById);       // GET  /api/facturas/:id (con detalles y pagos)
router.post('/',            facturaController.create);        // POST /api/facturas
router.put('/:id',          facturaController.update);        // PUT  /api/facturas/:id (emitida y sin pagos)
router.post('/:id/anular',  facturaController.anular);        // POST /api/facturas/:id/anular
router.post('/:id/pagos',   facturaController.registrarPago); // POST /api/facturas/:id/pagos

module.exports = router;
