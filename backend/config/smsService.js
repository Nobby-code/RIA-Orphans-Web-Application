require("dotenv").config();

let smsProvider;

if (process.env.SMS_PROVIDER === "AT") {
  // Africa's Talking
  const Africastalking = require("africastalking");
  const africasTalking = Africastalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  });
  const sms = africasTalking.SMS;

  smsProvider = async ({ to, message }) => {
    try {
      const response = await sms.send({
        to: [to.toString()],
        message,
      });
      console.log("💬 SMS SENT via Africa's Talking:", response);
      return response;
    } catch (err) {
      console.error("❌ SMS ERROR:", err);
      throw err;
    }
  };
} else {
  // Mock SMS for testing
  smsProvider = async ({ to, message }) => {
    console.log("💬 SMS MOCK SENT");
    console.log("To:", to);
    console.log("Message:", message);
    return { status: "success", to, message };
  };
}

module.exports = smsProvider;
