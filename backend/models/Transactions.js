const mongoose = require('mongoose');

const transactionsSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  checkoutRequestID: { type: String }, // from STK push response
  merchantRequestID: { type: String }, // from STK push response
  status: { type: String, default: 'pending' }, // pending, success, failed
  resultCode: { type: Number },
  resultDesc: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('transactions', transactionsSchema);
