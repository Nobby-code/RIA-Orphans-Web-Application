const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Get all users → admin only
router.get('/', protect, admin, userController.getAllUsers);

// Create a new user → admin only
router.post('/', protect, admin, userController.createUser);

// Update user details → admin only
router.put('/:id', protect, admin, userController.updateUser);

module.exports = router;