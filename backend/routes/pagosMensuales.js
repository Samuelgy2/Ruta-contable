const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const pagoMensualController = require('../controllers/PagoMensualController');

router.use(requireAdmin);

router.get('/',       pagoMensualController.getAll);    // GET    /api/pagos-mensuales
router.get('/:id',    pagoMensualController.getById);   // GET    /api/pagos-mensuales/:id
router.post('/',      pagoMensualController.create);    // POST   /api/pagos-mensuales
router.put('/:id',    pagoMensualController.update);    // PUT    /api/pagos-mensuales/:id
router.delete('/:id', pagoMensualController.remove);    // DELETE /api/pagos-mensuales/:id

module.exports = router;
