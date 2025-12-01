const axios = require("axios");
require("dotenv").config();

const getMpesaToken = async () => {
  const consumer_key = process.env.MPESA_CONSUMER_KEY;
  const consumer_secret = process.env.MPESA_CONSUMER_SECRET;

  const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString("base64");

  const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return response.data.access_token;
};

module.exports = getMpesaToken;
