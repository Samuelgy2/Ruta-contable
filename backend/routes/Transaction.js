const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const transactionController = require('../controllers/TransactionController');

router.use(requireAdmin);

router.get('/',       transactionController.getAll);    // GET    /api/transactions
router.get('/:id',    transactionController.getById);   // GET    /api/transactions/:id
router.post('/',      transactionController.create);    // POST   /api/transactions
router.put('/:id',    transactionController.update);    // PUT    /api/transactions/:id
router.delete('/:id', transactionController.remove);    // DELETE /api/transactions/:id

module.exports = router;