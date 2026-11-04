const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

router.post('/login', tenantMiddleware, authController.login);
router.get('/me', auth, authController.getMe);
router.post('/change-password', auth, authController.changePassword);
router.post('/register-shop', authController.registerShop);

module.exports = router;
