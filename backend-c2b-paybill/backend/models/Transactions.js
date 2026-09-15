const mongoose = require('mongoose');

const transactionsSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  checkoutRequestID: { type: String }, // from STK push response (STK only)
  merchantRequestID: { type: String }, // from STK push response (STK only)
   // Sponsor info
  fullName: { type: String },
  email: { type: String },
   // Beneficiary info
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
  status: { 
    type: String,
    enum: ["pending", "success", "failed"], 
    default: 'pending' 
  }, // pending, success, failed
  resultCode: { type: Number },
  resultDesc: { type: String },
  // BUG FIX: these two were being set on the document but were never declared
  // on the schema, so Mongoose silently stripped them before saving — every
  // donor record ended up with an undefined receipt number and date.
  mpesaReceiptNumber: { type: String },
  transactionDate: { type: String },
  // How this payment arrived: an app-initiated STK push, or a manual C2B
  // paybill payment the customer typed in from their own phone.
  source: {
    type: String,
    enum: ["stk", "c2b"],
    default: "stk",
  },
  // Raw "account number" text the customer typed on their phone for a C2B
  // payment (e.g. an orphan/widow ID, or garbage if they mistyped it).
  billRefNumber: { type: String },
  // False when a C2B payment's billRefNumber couldn't be matched to a real
  // beneficiary — surfaced to admins for manual reconciliation.
  matched: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevents the same M-Pesa receipt (STK or C2B) from ever being recorded twice,
// e.g. if Safaricom retries a callback/confirmation.
transactionsSchema.index(
  { mpesaReceiptNumber: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Transactions', transactionsSchema);

