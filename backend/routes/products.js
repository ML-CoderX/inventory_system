const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

router.get('/', auth, productController.getAllProducts);
router.get('/:id', auth, productController.getProductById);
router.post('/', auth, checkPermission('can_manage_products'), productController.createProduct);
router.put('/:id', auth, checkPermission('can_manage_products'), productController.updateProduct);
router.delete('/:id', auth, checkPermission('can_delete_items'), productController.deleteProduct);

module.exports = router;
