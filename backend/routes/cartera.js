const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const carteraController = require('../controllers/CarteraController');

router.use(requireAdmin);

router.get('/',       carteraController.getAll);    // GET    /api/cartera
router.get('/:id',    carteraController.getById);   // GET    /api/cartera/:id
router.post('/',      carteraController.create);    // POST   /api/cartera
router.put('/:id',    carteraController.update);    // PUT    /api/cartera/:id
router.delete('/:id', carteraController.remove);    // DELETE /api/cartera/:id

module.exports = router;
