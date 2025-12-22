// controllers/dashboardController.js
const Donation = require("../models/transactions");
const User = require("../models/User");

// Total donations
exports.getTotalDonations = async (req, res) => {
  try {
    const result = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const total = result[0] ? result[0].total : 0;
    res.json({ success: true, total });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Total users
exports.getTotalUsers = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, total: count });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
