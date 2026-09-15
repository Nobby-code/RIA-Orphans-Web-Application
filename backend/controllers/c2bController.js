const axios = require("axios");
const getMpesaToken = require("../utils/mpesaToken");
require("dotenv").config();

const Transaction = require("../models/Transactions");
const donors = require("../models/donors");
const sendSMS = require("../config/smsService");

// Try to resolve a beneficiary from whatever the customer typed as the
// M-Pesa "Account Number" field. We accept either a raw Mongo ObjectId
// (if you print full IDs somewhere) or a short human-friendly reference
// like "ORPHAN-<id>" / "WIDOW-<id>", since that's realistically what you'd
// put on a poster or the website for someone to type on their phone.
async function resolveBeneficiary(billRefNumber) {
  if (!billRefNumber) return { beneficiaryId: null, beneficiaryType: null };

  const ref = billRefNumber.trim().toUpperCase();
  const match = ref.match(/^(ORPHAN|WIDOW)-?([a-f0-9]{24})$/i);

  if (!match) {
    return { beneficiaryId: null, beneficiaryType: null };
  }

  const [, type, id] = match;
  const beneficiaryType = type.toLowerCase();

  try {
    const Model =
      beneficiaryType === "orphan"
        ? require("../models/Orphan")
        : require("../models/Widow");
    const exists = await Model.exists({ _id: id });
    if (!exists) return { beneficiaryId: null, beneficiaryType: null };
    return { beneficiaryId: id, beneficiaryType };
  } catch (err) {
    console.error("Beneficiary lookup failed:", err.message);
    return { beneficiaryId: null, beneficiaryType: null };
  }
}

function checkC2BSecret(req) {
  if (!process.env.MPESA_C2B_SECRET) return true;
  return req.query.token === process.env.MPESA_C2B_SECRET;
}

// Safaricom calls this BEFORE money moves, to ask "should I accept this payment?"
// You have a few seconds to respond. Returning ResultCode 0 accepts it.
exports.validation = async (req, res) => {
  if (!checkC2BSecret(req)) {
    console.warn("Rejected C2B validation with invalid/missing token");
    return res.status(401).json({ ResultCode: "C2B00016", ResultDesc: "Unauthorized" });
  }

  // We accept everything at validation time and reconcile matching later —
  // rejecting here would bounce the customer's payment outright, which is
  // worse for donors than us just flagging it "unmatched" afterwards.
  console.log("C2B validation request:", JSON.stringify(req.body));
  return res.status(200).json({ ResultCode: "0", ResultDesc: "Accepted" });
};

// Safaricom calls this AFTER money has already moved into the paybill.
// This is a notification, not a request for permission — the payment is final.
exports.confirmation = async (req, res) => {
  try {
    if (!checkC2BSecret(req)) {
      console.warn("Rejected C2B confirmation with invalid/missing token");
      return res.status(401).json({ ResultCode: "C2B00016", ResultDesc: "Unauthorized" });
    }

    const body = req.body || {};
    const {
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      MSISDN,
      FirstName,
      MiddleName,
      LastName,
    } = body;

    if (!TransID || !TransAmount || !MSISDN) {
      console.error("Malformed C2B confirmation payload:", body);
      // Always 200 a confirmation even on our own data issues — the money has
      // already moved, so returning an error just makes Safaricom retry a
      // payment we can't process any better the second time. Log it instead.
      return res.status(200).json({ ResultCode: "0", ResultDesc: "Accepted" });
    }

    // Idempotency: Safaricom can and does retry confirmations.
    const existing = await Transaction.findOne({ mpesaReceiptNumber: TransID });
    if (existing) {
      return res.status(200).json({ ResultCode: "0", ResultDesc: "Already recorded" });
    }

    const { beneficiaryId, beneficiaryType } = await resolveBeneficiary(BillRefNumber);
    const fullName = [FirstName, MiddleName, LastName].filter(Boolean).join(" ") || "M-Pesa Donor";

    const transaction = await Transaction.create({
      phone: MSISDN,
      amount: Number(TransAmount),
      fullName,
      beneficiaryId: beneficiaryId || undefined,
      beneficiaryType: beneficiaryType || undefined,
      sponsorshipType: "one-time",
      status: "success",
      mpesaReceiptNumber: TransID,
      transactionDate: TransTime,
      source: "c2b",
      billRefNumber: BillRefNumber,
      matched: Boolean(beneficiaryId),
    });

    // Only create a donor record + tie it to a beneficiary when we could
    // actually match one. Unmatched payments stay visible via the
    // transactions list (source: c2b, matched: false) for an admin to fix up.
    if (beneficiaryId) {
      await donors.create({
        fullName: transaction.fullName,
        email: "",
        phone: transaction.phone,
        amount: transaction.amount,
        beneficiaryId: transaction.beneficiaryId,
        beneficiaryType: transaction.beneficiaryType,
        sponsorshipType: transaction.sponsorshipType,
        mpesaTransactionId: transaction.mpesaReceiptNumber,
        transactionDate: transaction.transactionDate,
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("c2bPaymentReceived", {
        amount: transaction.amount,
        phone: transaction.phone,
        matched: transaction.matched,
        mpesaReceiptNumber: transaction.mpesaReceiptNumber,
      });
    }

    // Thank the payer regardless of whether we matched a beneficiary.
    try {
      await sendSMS({
        to: MSISDN,
        message: `Dear ${fullName}, we received your payment of KES ${TransAmount}. M-Pesa Ref: ${TransID}. Thank you for supporting orphans and widows.`,
      });
    } catch (smsErr) {
      console.error("C2B confirmation SMS failed:", smsErr.message);
    }

    return res.status(200).json({ ResultCode: "0", ResultDesc: "Accepted" });
  } catch (err) {
    console.error("C2B confirmation error:", err);
    // Still 200 — the payment already succeeded on Safaricom's side.
    return res.status(200).json({ ResultCode: "0", ResultDesc: "Accepted" });
  }
};

// Admin: list C2B payments that couldn't be auto-matched to a beneficiary
exports.getUnmatched = async (req, res) => {
  try {
    const unmatched = await Transaction.find({ source: "c2b", matched: false }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: unmatched });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch unmatched payments" });
  }
};

// Admin: manually assign an unmatched C2B payment to a beneficiary
exports.matchTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { beneficiaryId, beneficiaryType } = req.body;

    if (!beneficiaryId || !["orphan", "widow"].includes(beneficiaryType)) {
      return res.status(400).json({ success: false, message: "beneficiaryId and a valid beneficiaryType are required" });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction || transaction.source !== "c2b") {
      return res.status(404).json({ success: false, message: "C2B transaction not found" });
    }

    transaction.beneficiaryId = beneficiaryId;
    transaction.beneficiaryType = beneficiaryType;
    transaction.matched = true;
    await transaction.save();

    await donors.create({
      fullName: transaction.fullName,
      email: "",
      phone: transaction.phone,
      amount: transaction.amount,
      beneficiaryId: transaction.beneficiaryId,
      beneficiaryType: transaction.beneficiaryType,
      sponsorshipType: transaction.sponsorshipType,
      mpesaTransactionId: transaction.mpesaReceiptNumber,
      transactionDate: transaction.transactionDate,
    });

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to match transaction" });
  }
};
