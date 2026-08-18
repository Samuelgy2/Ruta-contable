const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const clubDataController = require('../controllers/ClubDataController');

router.use(requireAdmin);

router.get('/',  clubDataController.get);
router.put('/',  clubDataController.update);

module.exports = router;
