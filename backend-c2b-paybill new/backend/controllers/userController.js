// get all users
const user = require("../models/User");

exports.getAllUsers = async (req, res) => {
  try {
    // SECURITY: was returning the full documents, including hashed passwords
    const users = await user.find().select("-password");
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error: error.message
    });
  }
};