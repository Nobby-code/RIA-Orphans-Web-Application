const mongoose = require('mongoose');

const transactionsSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  checkoutRequestID: { type: String }, // from STK push response
  merchantRequestID: { type: String }, // from STK push response
   // Sponsor info
  fullName: { type: String },
  email: { type: String },
   // Beneficiary info
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "beneficiaryType",
  },
  beneficiaryType: {
    type: String,
    enum: ["orphan", "widow"],
    required: true,
  },
  sponsorshipType: {
    type: String,
    enum: ["monthly", "one-time"],
    default: "one-time",
  },
  status: { 
    type: String,
    enum: ["pending", "success", "failed"], 
    default: 'pending' 
  }, // pending, success, failed
  resultCode: { type: Number },
  resultDesc: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transactions', transactionsSchema);
