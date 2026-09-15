const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/auth');
const donorController = require('../controllers/donorController');

//get all donors
router.get('/', protect, admin, donorController.getDonors);


module.exports = router;