// get all users
const user = require("../models/User");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await user.find();
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