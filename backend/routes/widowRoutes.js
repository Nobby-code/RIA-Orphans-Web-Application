const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const widowController = require("../controllers/widowController");

// Create widow
router.post("/", protect, admin, widowController.createWidow);

// Get all widows
router.get("/", widowController.getWidows);

// Get widow by ID
router.get("/:id", widowController.getWidowById);

// Update widow
router.put("/:id", protect, admin, widowController.updateWidow);

// Delete widow
router.delete("/:id", protect, admin, widowController.deleteWidow);

module.exports = router;
