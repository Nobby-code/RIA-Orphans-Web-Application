const express = require("express");
const router = express.Router();
const mpesaController = require("../controllers/mpesaController");
const { protect, admin } = require("../middleware/auth");

// Initiate STK Push
router.post("/stkpush", mpesaController.stkPush);

// Callback route for M-Pesa notifications
router.post("/callback", mpesaController.mpesaCallback);
// router.post("/callback", (req, res) => {
//   console.log("🔔 M-Pesa Callback Received");
//   console.log(JSON.stringify(req.body, null, 2));
//   res.status(200).json({ message: "Callback received successfully" });
// });

router.get("/", protect, admin, mpesaController.getTransactions);

module.exports = router;
