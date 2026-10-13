// const mongoose = require("mongoose");

// const donorsListSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   email: { type: String, required: true },
//   phone: { type: String, required: true },
//   amount: { type: Number, required: true },
//   beneficiaryId: {
//     type: mongoose.Schema.Types.ObjectId,
//   },
//     beneficiaryType: { type: String, required: true },
//     sponsorshipType: { type: String, required: true },
//     mpesaTransactionId: { type: String },
//     transactionDate: { type: Date },
//     createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("donors", donorsListSchema);


const mongoose = require("mongoose");

const donorsListSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, default: "" },

  amount: { type: Number, required: true },
  currency: {
    type: String,
    enum: ["KES", "USD"],
    default: "KES",
  },
  paymentMethod: {
    type: String,
    enum: ["mpesa", "paypal"],
    default: "mpesa",
  },

  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  beneficiaryType: {
    type: String,
    required: true,
    enum: ["orphan", "widow"],
  },
  sponsorshipType: {
    type: String,
    required: true,
    enum: ["monthly", "one-time"],
  },

  // Existing M-Pesa field
  mpesaTransactionId: { type: String },

  // PayPal payment reference
  paypalCaptureID: { type: String },

  transactionDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

donorsListSchema.index(
  { paypalCaptureID: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("donors", donorsListSchema);
