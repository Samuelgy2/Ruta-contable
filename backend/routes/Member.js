const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const socioController = require('../controllers/Membercontroller');

router.use(requireAdmin);

router.get('/',       socioController.getAll);    // GET    /api/socios
router.get('/:id',    socioController.getById);   // GET    /api/socios/:id
router.post('/',      socioController.create);    // POST   /api/socios
router.put('/:id',    socioController.update);    // PUT    /api/socios/:id
router.delete('/:id', socioController.remove);    // DELETE /api/socios/:id

module.exports = router;