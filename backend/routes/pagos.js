const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const pagoController = require('../controllers/PagoController');

// El webhook es público: quien llama es PayPal, no un usuario. Su autenticación
// es la verificación remota de la firma dentro del controlador. Aquí sí vale
// express.json(): PayPal verifica el evento ya parseado, no el cuerpo crudo.
router.post('/webhook', express.json(), pagoController.webhook);         // POST /api/pagos/webhook

router.post('/checkout', requireAuth, pagoController.checkout);          // POST /api/pagos/checkout
router.get('/', requireAdmin, pagoController.getAll);                    // GET  /api/pagos
router.get('/:referencia', requireAuth, pagoController.getByReferencia); // GET  /api/pagos/:referencia

module.exports = router;
