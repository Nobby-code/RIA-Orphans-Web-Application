const mongoose = require("mongoose");

const orphanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female"] },
  description: { type: String },
  image: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who created
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Orphan", orphanSchema);
