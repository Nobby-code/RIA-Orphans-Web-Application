const mongoose = require("mongoose");
const Counter = require("./Counter");

const widowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
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
    image: {
      type: String,
    },
    programNumber: {
      type: String,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Virtual field to calculate age from dateOfBirth (if needed in future)
widowSchema.set("toJSON", { virtuals: true });
widowSchema.set("toObject", { virtuals: true });

widowSchema.virtual("age").get(function () {
  const today = new Date();
  const birthDate = new Date(this.dob);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

widowSchema.pre("save", async function (next) {
  if (this.programNumber) return next(); // already set

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "widowProgram" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const year = new Date().getFullYear().toString().slice(-2);
    const paddedNumber = String(counter.seq).padStart(3, "0");

    this.programNumber = `RW-${paddedNumber}/${year}`;
  } catch (err) {
    console.error("Error generating program number:", err);
    return next(err);
  }
});

module.exports = mongoose.model("Widow", widowSchema);
