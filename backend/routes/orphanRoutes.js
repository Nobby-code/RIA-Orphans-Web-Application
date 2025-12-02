const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect, admin } = require("../middleware/auth");
const orphanController = require("../controllers/orphanController");

// Create orphan → admin only
// router.post("/", protect, admin, orphanController.createOrphan);

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure 'uploads/' folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// Get all orphans → public
router.get("/", orphanController.getOrphans);

// Update route to handle file
router.post("/", protect, admin, upload.single("image"), orphanController.createOrphan);

module.exports = router;
