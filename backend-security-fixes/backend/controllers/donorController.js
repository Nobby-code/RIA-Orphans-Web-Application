const donor = require("../models/donors");

// @desc    Get total donations amount
// @route   GET /api/dashboard/donations/total
// @access  Private/Admin

// get donors
exports.getDonors = async (req, res) => {
  try {
    const donors = await donor.find();
    res.json({ success: true, data: donors });
    // console.log("Get donors success");
  } catch (error) {
    console.error("Get donors error:", error);
    res.status(500).json({ message: error.message });
  }
};
