const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Get all users → admin only
router.get('/', protect, admin, userController.getAllUsers);

module.exports = router;