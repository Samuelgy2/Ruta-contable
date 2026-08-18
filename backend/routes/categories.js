const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/CategoryController');

router.use(requireAdmin);

router.get('/',       categoryController.getAll);
router.get('/:id',    categoryController.getById);
router.post('/',      categoryController.create);
router.put('/:id',    categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;
