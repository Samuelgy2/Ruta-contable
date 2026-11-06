const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const carteraController = require('../controllers/CarteraController');

router.use(requireAdmin);

// Tipos de cartera (RF-081); van antes de '/:id' para que 'tipos' no se lea como id.
router.get('/tipos',        carteraController.getTipos);   // GET    /api/cartera/tipos
router.post('/tipos',       carteraController.createTipo); // POST   /api/cartera/tipos
router.delete('/tipos/:id', carteraController.removeTipo); // DELETE /api/cartera/tipos/:id

router.get('/',       carteraController.getAll);    // GET    /api/cartera
router.get('/:id',    carteraController.getById);   // GET    /api/cartera/:id
router.post('/',      carteraController.create);    // POST   /api/cartera
router.put('/:id',    carteraController.update);    // PUT    /api/cartera/:id
router.delete('/:id', carteraController.remove);    // DELETE /api/cartera/:id

module.exports = router;
