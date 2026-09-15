const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SECURITY: the old "/create-admin" route let anyone on the internet create
// an admin account with no authentication. It has been removed.
// To create an admin, run the CLI script instead:
//   node scripts/createAdmin.js "Name" "email@example.com" "password"

// Slow down brute-force login attempts: max 10 tries per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials!" });

  //  block to prevent login for non-admin users
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid credentials!" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = router;
