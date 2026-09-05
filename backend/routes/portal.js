const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const portalController = require('../controllers/PortalController');

router.use(requireAuth);

router.get('/resumen', portalController.getResumen);   // GET /api/portal/resumen
router.get('/pagos',   portalController.getPagos);     // GET /api/portal/pagos
router.put('/perfil',  portalController.updatePerfil); // PUT /api/portal/perfil

module.exports = router;
