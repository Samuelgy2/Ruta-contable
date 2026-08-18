const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const periodoController = require('../controllers/PeriodoController');

router.use(requireAdmin);

router.get('/',       periodoController.getAll);    // GET    /api/periodos
router.get('/:id',    periodoController.getById);   // GET    /api/periodos/:id
router.post('/',      periodoController.create);    // POST   /api/periodos
router.put('/:id',    periodoController.update);    // PUT    /api/periodos/:id
router.delete('/:id', periodoController.remove);    // DELETE /api/periodos/:id

module.exports = router;
