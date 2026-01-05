const mongoose = require("mongoose");
const Counter = require("./Counter");

const orphanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  // age: {
  //   type: Number
  // },
  gender: {
    type: String,
    enum: ["Male", "Female"],
  },
  orphanType: {
    type: String,
    enum: ["total", "partial"],
  },
   programNumber: {
    type: String,
    unique: true,
  },
  deceasedParent: {
    type: String,
    enum: ["father", "mother"],
    default: null,
  },
  description: {
    type: String,
  },
  image: String,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who created
  createdAt: { type: Date, default: Date.now },
});

// Virtual field to calculate age from dob
orphanSchema.set("toJSON", { virtuals: true });
orphanSchema.set("toObject", { virtuals: true });

orphanSchema.virtual("age").get(function () {
  if (!this.dob) return null;

  const today = new Date();
  let age = today.getFullYear() - this.dob.getFullYear();

  const m = today.getMonth() - this.dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < this.dob.getDate())) {
    age--;
  }

  return age;
});

orphanSchema.pre("save", async function () {
  if (this.programNumber) return; // already set

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "orphanProgram" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = String(counter.seq).padStart(3, "0");

    this.programNumber = `ROEF-${paddedNumber}/${year}`;
  } catch (err) {
    console.error("Error generating program number:", err);
  }
});

module.exports = mongoose.model("Orphan", orphanSchema);
