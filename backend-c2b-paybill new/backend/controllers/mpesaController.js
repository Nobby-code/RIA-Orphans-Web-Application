const axios = require("axios");
const getMpesaToken = require("../utils/mpesaToken");
require("dotenv").config();

const Transaction = require("../models/Transactions");
const donors = require("../models/donors");
const sms = require("../config/africasTalking");
const sendSMS = require("../config/smsService");

exports.stkPush = async (req, res) => {
  try {
    // const { amount, phone } = req.body;
    const {
      amount,
      phone,
      fullName,
      email,
      beneficiaryId,
      beneficiaryType,
      sponsorshipType,
    } = req.body;

    if (!amount || !phone || !beneficiaryId || !beneficiaryType) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required donation fields" });
    }

    // SECURITY: amount was previously forwarded to M-Pesa with no validation,
    // so a client could send a negative, zero, non-numeric, or absurdly large
    // amount. M-Pesa sandbox/production accepts whole KES 1 - 150,000 per STK push.
    const numericAmount = Number(amount);
    if (
      !Number.isFinite(numericAmount) ||
      !Number.isInteger(numericAmount) ||
      numericAmount < 1 ||
      numericAmount > 150000
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a whole number between 1 and 150,000 KES",
      });
    }

    // Basic phone format check before we send it to Safaricom
    if (!/^\d{9,12}$/.test(phone.replace(/^\+/, ""))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number" });
    }

    // Ensure phone number is in 2547XXXXXXXX format
    const formattedPhone = phone.startsWith("254")
      ? phone
      : `254${phone.slice(-9)}`;

    const token = await getMpesaToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const password = Buffer.from(
      process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
    ).toString("base64");

    const stkURL = process.env.MPESA_BASE_URL_SANDBOX;
      // "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: numericAmount,
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "Donation",
      TransactionDesc: "Donation Payment",
    };

    console.log("STK Push Payload:", payload);
    
    console.log("STK URL being used:", stkURL);

    const response = await axios.post(stkURL, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Save initial transaction to database
    await Transaction.create({
      phone: formattedPhone,
      amount: numericAmount,
      checkoutRequestID: response.data.CheckoutRequestID,
      merchantRequestID: response.data.MerchantRequestID,
      fullName,
      email,
      beneficiaryId,
      beneficiaryType,
      sponsorshipType,
      status: "pending",
    });

    res.json({
      success: true,
      message: "STK Push initiated",
      data: response.data,
    });
  } catch (error) {
    if (error.response) {
      console.error(
        "STK ERROR RESPONSE DATA:",
        JSON.stringify(error.response.data, null, 2)
      );
      console.error("STK ERROR RESPONSE STATUS:", error.response.status);
      console.error(
        "STK ERROR RESPONSE HEADERS:",
        JSON.stringify(error.response.headers, null, 2)
      );
    } else if (error.request) {
      console.error("STK ERROR NO RESPONSE RECEIVED:", error.request);
    } else {
      console.error("STK ERROR SETUP:", error.message);
    }

    res.status(500).json({
      success: false,
      message: "STK Push Failed",
      error: error.response ? error.response.data : error.message,
    });
  }
};

exports.mpesaCallback = async (req, res) => {
  try {
    // SECURITY: Safaricom does not sign STK callbacks by default, so this
    // endpoint is otherwise fully spoofable — anyone who finds the URL could
    // POST a fake "success" payload and mark a donation as paid. We require
    // a shared secret in the callback URL (set MPESA_CALLBACK_SECRET in .env
    // and register the callback as
    // https://yourdomain.com/api/mpesa/callback?token=<that secret> with Safaricom).
    if (
      process.env.MPESA_CALLBACK_SECRET &&
      req.query.token !== process.env.MPESA_CALLBACK_SECRET
    ) {
      console.warn("Rejected M-Pesa callback with invalid/missing token");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      return res.status(400).json({ message: "Malformed callback payload" });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } =
      callback;

    // Idempotency: M-Pesa (or a replayed/duplicate request) can call this
    // more than once for the same transaction. Don't reprocess a transaction
    // that's already been settled, to avoid duplicate donor records and SMS.
    const existing = await Transaction.findOne({
      checkoutRequestID: CheckoutRequestID,
    });
    if (!existing) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (existing.status !== "pending") {
      return res
        .status(200)
        .json({ message: `Callback ignored, transaction already ${existing.status}` });
    }

    // If failed, update status and exit
    if (ResultCode !== 0) {
      await Transaction.findOneAndUpdate(
        { checkoutRequestID: CheckoutRequestID },
        {
          status: "failed",
          resultCode: ResultCode,
          resultDesc: ResultDesc,
        },
        { new: true }
      );

      const io = req.app.get("io");
      io.to(CheckoutRequestID).emit("paymentFailed", {
        checkoutRequestID: CheckoutRequestID,
        message: "Payment failed",
      });

      return res.status(200).json({ message: "Callback saved (FAILED)" });
    }

    // Extract metadata
    let Amount, MpesaReceiptNumber, Phone, TransactionDate;

    callback.CallbackMetadata.Item.forEach((item) => {
      if (item.Name === "Amount") Amount = item.Value;
      if (item.Name === "MpesaReceiptNumber") MpesaReceiptNumber = item.Value;
      if (item.Name === "PhoneNumber") Phone = item.Value;
      if (item.Name === "TransactionDate") TransactionDate = item.Value;
    });

    // SUCCESS → Update transaction
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { checkoutRequestID: CheckoutRequestID },
      {
        status: "success",
        amount: Amount,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        phone: Phone,
        mpesaReceiptNumber: MpesaReceiptNumber,
        transactionDate: TransactionDate,
      },
      { new: true }
    );

    if (!updatedTransaction) {
      return res
        .status(404)
        .json({ error: "Transaction not found" });
    }

    // Save donor information
    await donors.create({
      fullName: updatedTransaction.fullName,
      email: updatedTransaction.email,
      phone: updatedTransaction.phone,
      amount: updatedTransaction.amount,
      beneficiaryId: updatedTransaction.beneficiaryId,
      beneficiaryType: updatedTransaction.beneficiaryType,
      sponsorshipType: updatedTransaction.sponsorshipType,
      mpesaReceiptNumber: updatedTransaction.mpesaReceiptNumber,
      transactionDate: updatedTransaction.transactionDate,
    });

    // Emit real-time update via Socket.io
    // 🔔 notify frontend
    const io = req.app.get("io");
    io.to(updatedTransaction.checkoutRequestID).emit("paymentSuccess", {
      checkoutRequestID: updatedTransaction.checkoutRequestID,
      donorName: updatedTransaction.fullName,
      amount: updatedTransaction.amount,
      message: "Payment successful",
    });

    // Send SMS confirmation to donor
    const message = `Dear ${updatedTransaction.fullName}, your donation of KES ${Amount} was successful. Mpesa Receipt: ${MpesaReceiptNumber}. Thank you for supporting orphans.`;
    await sendSMS({ to: Phone, message });

    res.status(200).json({ message: "Callback saved (SUCCESS), SMS sent" });
    // sms
    //   .send({
    //     to: [Phone.toString()], // Make sure phone is in 2547XXXXXXXX format
    //     message,
    //   })
    //   .then((response) => console.log("SMS Sent:", response))
    //   .catch((err) => console.error("SMS Error:", err));

    // res.status(200).json({ message: "Callback saved (SUCCESS) and SMS sent" });

    // res.status(200).json({ message: "Callback saved (SUCCESS)" });
  } catch (err) {
    console.error("Callback Error:", err);
    res.status(500).json({ error: "Callback processing error" });
  }
};

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }); // Newest first
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};