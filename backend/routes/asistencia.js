const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const asistenciaController = require('../controllers/AsistenciaController');

router.use(requireAdmin);

router.get('/alertas',         asistenciaController.getAlertas);      // GET    /api/asistencia/alertas
router.get('/exportar-excel',  asistenciaController.exportarExcel);   // GET    /api/asistencia/exportar-excel
router.get('/',                asistenciaController.getAll);          // GET    /api/asistencia
router.get('/:id',             asistenciaController.getById);         // GET    /api/asistencia/:id
router.post('/',               asistenciaController.create);          // POST   /api/asistencia
router.put('/:id',             asistenciaController.update);          // PUT    /api/asistencia/:id
router.delete('/:id',          asistenciaController.remove);          // DELETE /api/asistencia/:id

module.exports = router;
