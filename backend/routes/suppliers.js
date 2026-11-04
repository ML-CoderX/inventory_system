const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const auth = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

router.get('/', auth, supplierController.getAllSuppliers);
router.get('/:id', auth, supplierController.getSupplierById);
router.post('/', auth, checkPermission('can_manage_suppliers'), supplierController.createSupplier);
router.put('/:id', auth, checkPermission('can_manage_suppliers'), supplierController.updateSupplier);
router.delete('/:id', auth, checkPermission('can_delete_items'), supplierController.deleteSupplier);

module.exports = router;
