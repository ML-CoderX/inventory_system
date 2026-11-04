const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

router.post('/update', auth, checkPermission('can_manage_stock'), inventoryController.updateStock);
router.get('/logs', auth, checkPermission('can_view_reports'), inventoryController.getLogs);

module.exports = router;
