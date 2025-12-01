const Africastalking = require("africastalking");
require("dotenv").config();

const africasTalking = Africastalking({
  apiKey: process.env.AT_API_KEY,   // Africa's Talking API key
  username: process.env.AT_USERNAME // Africa's Talking username
});

const sms = africasTalking.SMS;

module.exports = sms;
