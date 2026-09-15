const mongoose = require("mongoose");

const donorsListSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
  },
    beneficiaryType: { type: String, required: true },
    sponsorshipType: { type: String, required: true },
    mpesaTransactionId: { type: String },
    transactionDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("donors", donorsListSchema);