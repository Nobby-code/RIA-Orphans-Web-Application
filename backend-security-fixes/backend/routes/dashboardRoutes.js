
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/donations/total", dashboardController.getTotalDonations);
router.get("/users/total", dashboardController.getTotalUsers);

module.exports = router;
