const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const proveedorController = require('../controllers/ProveedorController');

router.use(requireAdmin);

router.get('/',       proveedorController.getAll);    // GET    /api/proveedores
router.get('/:id',    proveedorController.getById);   // GET    /api/proveedores/:id
router.post('/',      proveedorController.create);    // POST   /api/proveedores
router.put('/:id',    proveedorController.update);    // PUT    /api/proveedores/:id
router.delete('/:id', proveedorController.remove);    // DELETE /api/proveedores/:id

module.exports = router;
