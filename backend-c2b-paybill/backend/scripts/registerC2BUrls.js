// scripts/registerC2BUrls.js
//
// Run this ONCE to tell Safaricom where your Validation and Confirmation
// endpoints live. You need to re-run it any time those URLs change
// (e.g. moving from ngrok to a real domain, or switching sandbox -> live).
//
// Usage:
//   node scripts/registerC2BUrls.js
//
// Requires in .env:
//   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE
//   MPESA_BASE_URL_SANDBOX (or MPESA_BASE_URL_LIVE)
//   CALLBACK_BASE_URL   e.g. https://yourdomain.com  (no trailing slash)
//   MPESA_C2B_SECRET    the same shared secret your c2bController checks

require("dotenv").config();
const axios = require("axios");
const getMpesaToken = require("../utils/mpesaToken");

async function main() {
  if (!process.env.CALLBACK_BASE_URL) {
    console.error("CALLBACK_BASE_URL is not set in .env (e.g. https://yourdomain.com)");
    process.exit(1);
  }
  if (!process.env.MPESA_SHORTCODE) {
    console.error("MPESA_SHORTCODE is not set in .env");
    process.exit(1);
  }

  const secretSuffix = process.env.MPESA_C2B_SECRET
    ? `?token=${process.env.MPESA_C2B_SECRET}`
    : "";

  const ValidationURL = `${process.env.CALLBACK_BASE_URL}/api/mpesa/c2b/validation${secretSuffix}`;
  const ConfirmationURL = `${process.env.CALLBACK_BASE_URL}/api/mpesa/c2b/confirmation${secretSuffix}`;

  const token = await getMpesaToken();

  const apiHost =
    process.env.MPESA_ENV === "live"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  console.log("Registering C2B URLs with Safaricom:");
  console.log("  ValidationURL:  ", ValidationURL);
  console.log("  ConfirmationURL:", ConfirmationURL);

  try {
    const response = await axios.post(
      `${apiHost}/mpesa/c2b/v2/registerurl`,
      {
        ShortCode: process.env.MPESA_SHORTCODE,
        ResponseType: "Completed",
        ConfirmationURL,
        ValidationURL,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ Registered:", response.data);
  } catch (err) {
    console.error("❌ Registration failed:", err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

main();
