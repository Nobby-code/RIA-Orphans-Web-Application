// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const { protect, admin } = require("../middleware/auth");
// const orphanController = require("../controllers/orphanController");

// // Create orphan → admin only
// // router.post("/", protect, admin, orphanController.createOrphan);

// // Get all orphans → public
// // router.get("/", orphanController.getOrphans);


// // Multer setup for image uploads
// // Storage settings
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/"); // make sure 'uploads/' folder exists
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + "-" + file.originalname);
//   }
// });

// const upload = multer({ storage });

// // Update route to handle file
// //router.post("/", protect, admin, upload.single("image"), orphanController.createOrphan);

// // FINAL ROUTES
// router.post("/", protect, admin, upload.single("image"), orphanController.createOrphan);
// router.get("/", orphanController.getOrphans);

// module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect, admin } = require("../middleware/auth");
const orphanController = require("../controllers/orphanController");

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ✔️ Only ONE POST route
router.post("/", protect, admin, upload.single("image"), orphanController.createOrphan);

// Get all orphans
router.get("/", orphanController.getOrphans);

// Get orphan by ID
router.get("/:id", orphanController.getOrphanById);

// UPDATE orphan → admin only
router.put("/:id", protect, admin, orphanController.updateOrphan);


module.exports = router;
