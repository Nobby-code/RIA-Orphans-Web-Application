// const mongoose = require('mongoose');

// const transactionsSchema = new mongoose.Schema({
//   phone: { type: String, required: true },
//   amount: { type: Number, required: true },
//   checkoutRequestID: { type: String },
//   merchantRequestID: { type: String }, 
//   fullName: { type: String },
//   email: { type: String },
//   beneficiaryId: {
//     type: mongoose.Schema.Types.ObjectId,
//     refPath: "beneficiaryType",
//   },
//   beneficiaryType: {
//     type: String,
//     enum: ["orphan", "widow"],
//   },
//   sponsorshipType: {
//     type: String,
//     enum: ["monthly", "one-time"],
//     default: "one-time",
//   },
//   status: { 
//     type: String,
//     enum: ["pending", "success", "failed"], 
//     default: 'pending' 
//   },
//   resultCode: { type: Number },
//   resultDesc: { type: String },
//   mpesaReceiptNumber: { type: String },
//   transactionDate: { type: String },
//   source: {
//     type: String,
//     enum: ["stk", "c2b"],
//     default: "stk",
//   },
//   billRefNumber: { type: String },
//   matched: { type: Boolean, default: true },
//   createdAt: { type: Date, default: Date.now },
// });

// transactionsSchema.index(
//   { mpesaReceiptNumber: 1 },
//   { unique: true, sparse: true }
// );

// module.exports = mongoose.model('Transactions', transactionsSchema);



const mongoose = require("mongoose");

const transactionsSchema = new mongoose.Schema({
  // Donor contact information
  phone: { type: String, required: false },
  fullName: { type: String },
  email: { type: String },

  // Payment details
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

  // M-Pesa STK Push fields
  checkoutRequestID: { type: String },
  merchantRequestID: { type: String },
  mpesaReceiptNumber: { type: String },
  transactionDate: { type: String },

  // PayPal fields
  paypalOrderID: { type: String },
  paypalCaptureID: { type: String },

  // Beneficiary information
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "beneficiaryType",
  },
  beneficiaryType: {
    type: String,
    enum: ["orphan", "widow"],
  },
  sponsorshipType: {
    type: String,
    enum: ["monthly", "one-time"],
    default: "one-time",
  },

  // Payment status
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },

  resultCode: { type: Number },
  resultDesc: { type: String },

  // M-Pesa C2B fields
  source: {
    type: String,
    enum: ["stk", "c2b"],
    default: "stk",
  },
  billRefNumber: { type: String },
  matched: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate M-Pesa receipts
transactionsSchema.index(
  { mpesaReceiptNumber: 1 },
  { unique: true, sparse: true }
);

// Prevent duplicate PayPal order IDs
transactionsSchema.index(
  { paypalOrderID: 1 },
  { unique: true, sparse: true }
);

// Prevent duplicate PayPal capture IDs
transactionsSchema.index(
  { paypalCaptureID: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Transactions", transactionsSchema);
