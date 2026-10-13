
const express = require("express");
const router = express.Router();

const { protect, admin } = require("../middleware/auth");

const paypalController = require("../controllers/paypalController");

router.post("/create-order", paypalController.createOrder);
router.post("/capture-order", paypalController.captureOrder);

// Temporary testing endpoint. Protect or remove before production.
router.post("/order-status", protect, paypalController.getOrderStatus);

module.exports = router;
