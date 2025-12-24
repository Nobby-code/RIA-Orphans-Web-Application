const mongoose = require("mongoose");

const widowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
    },
    location: {
      type: String,
    },
    gender: {
      type: String,
      default: "Female",
    },
    numberOfChildren: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Widow", widowSchema);
