const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const mpesaController = require("../controllers/mpesaController");
const { protect, admin } = require("../middleware/auth");

// Limit how often a single IP can trigger a real M-Pesa STK push
const stkPushLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many payment attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initiate STK Push
router.post("/stkpush", stkPushLimiter, mpesaController.stkPush);

// Callback route for M-Pesa notifications
router.post("/callback", mpesaController.mpesaCallback);

// SECURITY: this used to be public and leaked every donor's name, phone,
// email and M-Pesa receipt number to anyone who hit the URL.
router.get("/", protect, admin, mpesaController.getTransactions);

module.exports = router;
