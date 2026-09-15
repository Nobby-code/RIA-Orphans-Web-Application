const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const c2bController = require("../controllers/c2bController");
const { protect, admin } = require("../middleware/auth");

// Light rate limiting — Safaricom is the only expected caller, but this
// stops the public endpoint from being hammered.
const c2bLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// These two are called directly by Safaricom, never by your frontend —
// they can't carry a JWT, so they're protected by the MPESA_C2B_SECRET
// query-token check inside the controller instead. Register them with
// Safaricom as e.g. https://yourdomain.com/api/mpesa/c2b/validation?token=...
router.post("/validation", c2bLimiter, c2bController.validation);
router.post("/confirmation", c2bLimiter, c2bController.confirmation);

// Admin-only reconciliation for C2B payments that couldn't be auto-matched
// to a beneficiary (e.g. the payer mistyped the account number).
router.get("/unmatched", protect, admin, c2bController.getUnmatched);
router.patch("/unmatched/:id/match", protect, admin, c2bController.matchTransaction);

module.exports = router;
