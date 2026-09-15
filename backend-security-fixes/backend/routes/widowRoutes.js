const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const widowController = require("../controllers/widowController");
const upload = require("../middleware/upload");

// Create widow
router.post("/", protect, admin, upload.single("image"), widowController.createWidow);

// Get all widows
router.get("/", widowController.getWidows);

// Get widow by ID
router.get("/:id", widowController.getWidowById);

// Update widow
router.put("/:id", protect, admin, upload.single("image"), widowController.updateWidow);

// Delete widow
router.delete("/:id", protect, admin, widowController.deleteWidow);

module.exports = router;
