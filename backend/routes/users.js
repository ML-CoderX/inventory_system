const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

// Middleware to verify the user is an administrator
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Administrative privileges required' });
  }
  next();
};

router.use(auth);
router.use(isAdmin);

router.get('/', userController.getAllStaff);
router.post('/', userController.createStaff);
router.put('/:id', userController.updateStaff);
router.put('/:id/password', userController.changeStaffPassword);
router.delete('/:id', userController.deleteStaff);

module.exports = router;
