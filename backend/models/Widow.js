const mongoose = require("mongoose");

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
    // age: {
    //   type: Number,
    // },
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

module.exports = mongoose.model("Widow", widowSchema);
