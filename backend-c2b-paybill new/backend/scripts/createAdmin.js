// scripts/createAdmin.js
//
// Run this from the command line to create (or promote) an admin user.
// This replaces the old public "/api/auth/create-admin" HTTP endpoint,
// which allowed anyone on the internet to create an admin account.
//
// Usage:
//   node scripts/createAdmin.js "Full Name" "email@example.com" "StrongPassword123!"

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function main() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error(
      'Usage: node scripts/createAdmin.js "Full Name" "email@example.com" "StrongPassword123!"'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const mongoURI = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL;
  if (!mongoURI) {
    console.error("MONGO_URI is not defined in your .env file.");
    process.exit(1);
  }

  await mongoose.connect(mongoURI);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "admin";
    existing.password = await bcrypt.hash(password, 12);
    await existing.save();
    console.log(`Existing user ${email} updated and promoted to admin.`);
  } else {
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({ name, email, password: hashedPassword, role: "admin" });
    console.log(`Admin user ${email} created.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
