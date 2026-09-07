const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const portalController = require('../controllers/PortalController');
const jerseyController = require('../controllers/JerseyController');

router.use(requireAuth);

router.get('/resumen', portalController.getResumen);   // GET /api/portal/resumen
router.get('/pagos',   portalController.getPagos);     // GET /api/portal/pagos
router.put('/perfil',  portalController.updatePerfil); // PUT /api/portal/perfil

// Jersey: campañas activas con el pedido del socio, y envío/edición del pedido.
router.get('/jersey',          jerseyController.portalGetJersey);   // GET  /api/portal/jersey
router.post('/jersey/pedidos', jerseyController.portalCrearPedido); // POST /api/portal/jersey/pedidos

module.exports = router;
