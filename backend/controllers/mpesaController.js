const axios = require("axios");
const getMpesaToken = require("../utils/mpesaToken");
require("dotenv").config();

const Transaction = require("../models/transactions");

exports.stkPush = async (req, res) => {
  try {
    const { amount, phone } = req.body;

    if (!amount || !phone) {
      return res.status(400).json({ success: false, message: "Amount and phone are required" });
    }

    // Ensure phone number is in 2547XXXXXXXX format
    const formattedPhone = phone.startsWith("254") ? phone : `254${phone.slice(-9)}`;

    const token = await getMpesaToken();

    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = Buffer.from(process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp).toString("base64");

    const stkURL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "Donation",
      TransactionDesc: "Donation Payment",
    };

    console.log("STK Push Payload:", payload);

    const response = await axios.post(stkURL, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json({
      success: true,
      message: "STK Push initiated",
      data: response.data,
    });

  } catch (error) {
    if (error.response) {
      console.error("STK ERROR RESPONSE DATA:", JSON.stringify(error.response.data, null, 2));
      console.error("STK ERROR RESPONSE STATUS:", error.response.status);
      console.error("STK ERROR RESPONSE HEADERS:", JSON.stringify(error.response.headers, null, 2));
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
