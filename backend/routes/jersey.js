const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const jerseyController = require('../controllers/JerseyController');

// Módulo Jersey del administrador. Las rutas del socio viven en routes/portal.js.
router.use(requireAdmin);

router.get('/campanas',        jerseyController.getCampanas);   // GET    /api/jersey/campanas
router.post('/campanas',       jerseyController.createCampana); // POST   /api/jersey/campanas
router.put('/campanas/:id',    jerseyController.updateCampana); // PUT    /api/jersey/campanas/:id

router.get('/pedidos',         jerseyController.getPedidos);    // GET    /api/jersey/pedidos?campana=&estado=&search=
router.post('/pedidos',        jerseyController.createPedido);  // POST   /api/jersey/pedidos
router.put('/pedidos/:id',     jerseyController.updatePedido);  // PUT    /api/jersey/pedidos/:id
router.delete('/pedidos/:id',  jerseyController.deletePedido);  // DELETE /api/jersey/pedidos/:id

module.exports = router;
