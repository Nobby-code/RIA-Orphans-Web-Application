const Transaction = require("../models/Transactions");
const Donor = require("../models/donors");

const PAYPAL_BASE_URL =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

// --------------------------------------------------
// 1. GET PAYPAL ACCESS TOKEN
// --------------------------------------------------
async function getPayPalAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials are missing.");
  }

  const credentials = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("PayPal authentication error:", data);
    throw new Error("PayPal authentication failed.");
  }

  return data.access_token;
}

// --------------------------------------------------
// 2. VALIDATE MONGODB OBJECT ID
// --------------------------------------------------
function mongooseIdIsValid(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

// --------------------------------------------------
// 3. CREATE PAYPAL ORDER
// --------------------------------------------------
exports.createOrder = async (req, res) => {
  let transaction;

  try {
    const {
      amount,
      fullName,
      email,
      phone,
      beneficiaryId,
      beneficiaryType,
      sponsorshipType,
    } = req.body;

    const numericAmount = Number(amount);

    const normalizedName = typeof fullName === "string" ? fullName.trim() : "";

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

    // Validate amount.
    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 1 ||
      numericAmount > 1000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid donation amount.",
      });
    }

    // Validate donor details.
    if (
      !normalizedName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid donor name and email are required.",
      });
    }

    // Validate beneficiary and sponsorship.
    if (
      !mongooseIdIsValid(beneficiaryId) ||
      !["orphan", "widow"].includes(beneficiaryType) ||
      !["monthly", "one-time"].includes(sponsorshipType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid beneficiary and sponsorship details are required.",
      });
    }

    // Save the pending transaction before creating the PayPal order.
    transaction = await Transaction.create({
      amount: numericAmount,
      currency: "USD",
      paymentMethod: "paypal",
      fullName: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      beneficiaryId,
      beneficiaryType,
      sponsorshipType,
      status: "pending",
    });

    const accessToken = await getPayPalAccessToken();

    console.log(
      "Creating PayPal order for transaction:",
      transaction._id.toString(),
    );

    console.log(
      "PayPal purchase unit:",
      JSON.stringify(
        {
          custom_id: transaction._id.toString(),
          description: "Donation to Ria Orphans Foundation",
          amount: {
            currency_code: "USD",
            value: numericAmount.toFixed(2),
          },
        },
        null,
        2,
      ),
    );

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `ria-create-${transaction._id}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: transaction._id.toString(),
            description: "Donation to Ria Orphans Foundation",
            amount: {
              currency_code: "USD",
              value: numericAmount.toFixed(2),
            },
          },
        ],
      }),
    });

    const order = await response.json();

    if (!response.ok || !order.id) {
      console.error("PayPal order creation failed:", order);

      await Transaction.updateOne(
        { _id: transaction._id, status: "pending" },
        {
          $set: {
            status: "failed",
            resultDesc: "Could not create PayPal order.",
          },
        },
      );

      return res.status(502).json({
        success: false,
        message: "Could not create PayPal order.",
      });
    }

    const approveUrl = order.links?.find(
      (link) => link.rel === "approve",
    )?.href;

    if (!approveUrl) {
      console.error("PayPal did not return an approval URL.");

      await Transaction.updateOne(
        { _id: transaction._id, status: "pending" },
        {
          $set: {
            status: "failed",
            resultDesc: "PayPal approval URL was missing.",
          },
        },
      );

      return res.status(502).json({
        success: false,
        message: "Could not get PayPal checkout approval link.",
      });
    }

    await Transaction.updateOne(
      { _id: transaction._id },
      {
        $set: {
          paypalOrderID: order.id,
        },
      },
    );

    return res.status(201).json({
      success: true,
      message: "PayPal order created successfully.",
      orderID: order.id,
      approveUrl,
    });
  } catch (error) {
    console.error("PayPal create-order error:", error);

    if (transaction) {
      await Transaction.updateOne(
        { _id: transaction._id, status: "pending" },
        {
          $set: {
            status: "failed",
            resultDesc: "PayPal order creation failed.",
          },
        },
      ).catch((dbError) => {
        console.error("Transaction update error:", dbError.message);
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to start PayPal checkout.",
    });
  }
};

// --------------------------------------------------
// 4. CAPTURE OR RECONCILE PAYPAL PAYMENT
// --------------------------------------------------
exports.captureOrder = async (req, res) => {
  try {
    const { orderID } = req.body;

    if (typeof orderID !== "string" || !/^[A-Z0-9-]{10,50}$/i.test(orderID)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PayPal order ID.",
      });
    }

    const transaction = await Transaction.findOne({
      paypalOrderID: orderID,
      paymentMethod: "paypal",
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Donation transaction not found.",
      });
    }

    // Failed transactions require investigation.
    if (transaction.status === "failed") {
      return res.status(409).json({
        success: false,
        message:
          "This transaction is marked failed. Verify its status before retrying.",
      });
    }

    if (!["pending", "success"].includes(transaction.status)) {
      return res.status(409).json({
        success: false,
        message: "Transaction cannot be processed in its current state.",
      });
    }

    const wasAlreadySuccessful = transaction.status === "success";

    const accessToken = await getPayPalAccessToken();

    // Always retrieve the order before deciding whether to capture.
    const orderResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const orderData = await orderResponse.json();

    console.log(
      "PayPal GET order response:",
      JSON.stringify(orderData, null, 2),
    );

    if (!orderResponse.ok) {
      console.error("PayPal order lookup failed:", orderData);

      return res.status(502).json({
        success: false,
        message: "Could not verify the PayPal order.",
      });
    }

    if (orderData.id !== orderID) {
      return res.status(409).json({
        success: false,
        message: "PayPal order ID does not match.",
      });
    }

    let result;

    if (orderData.status === "COMPLETED") {
      // Payment is already completed. Never capture it again.
      result = orderData;
    } else if (orderData.status === "APPROVED") {
      // Only capture an approved, not-yet-completed order.
      const captureResponse = await fetch(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "PayPal-Request-Id": `ria-capture-${transaction._id}`,
          },
          body: JSON.stringify({}),
        },
      );

      result = await captureResponse.json();

      if (!captureResponse.ok) {
        console.error("PayPal capture failed:", result);

        return res.status(502).json({
          success: false,
          message:
            "Capture could not be confirmed. Check the PayPal order status before retrying.",
        });
      }
    } else {
      return res.status(409).json({
        success: false,
        message: `PayPal order is not ready for capture. Current status: ${orderData.status}`,
      });
    }

    // Extract payment details only after result is available.
    const purchaseUnit = result.purchase_units?.[0];
    const orderPurchaseUnit = orderData.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    console.log(
      "PayPal custom_id from original order:",
      orderPurchaseUnit?.custom_id ?? null,
    );

    console.log("Expected MongoDB transaction ID:", transaction._id.toString());

    console.log("===== PAYPAL PAYMENT VERIFICATION =====");
    console.log("Order ID:", result.id);
    console.log("Order status:", result.status);
    console.log("Transaction ID:", transaction._id.toString());
    console.log("PayPal custom_id:", purchaseUnit?.custom_id);
    console.log("Capture ID:", capture?.id);
    console.log("Capture status:", capture?.status);
    console.log("Capture amount:", capture?.amount?.value);
    console.log("Capture currency:", capture?.amount?.currency_code);
    console.log("========================================");

    // Verify all critical payment details.
    // const expectedAmount = Number(transaction.amount).toFixed(2);
    // const actualAmount = Number(capture?.amount?.value);

    // if (
    //   result.id !== orderID ||
    //   result.status !== "COMPLETED" ||
    //   purchaseUnit?.custom_id !== transaction._id.toString() ||
    //   capture?.status !== "COMPLETED" ||
    //   !capture?.id ||
    //   capture?.amount?.currency_code !== transaction.currency ||
    //   !Number.isFinite(actualAmount) ||
    //   actualAmount.toFixed(2) !== expectedAmount
    // ) {
    //   return res.status(409).json({
    //     success: false,
    //     message: "Payment details could not be verified.",
    //   });
    // }

    const capturedAt = capture.create_time
      ? new Date(capture.create_time)
      : new Date();

    if (Number.isNaN(capturedAt.getTime())) {
      return res.status(409).json({
        success: false,
        message: "PayPal returned an invalid capture date.",
      });
    }

    const expectedAmount = Number(transaction.amount).toFixed(2);
    const actualAmount = Number(capture?.amount?.value);

    const checks = {
      orderIdMatches: result.id === orderID,
      orderCompleted: result.status === "COMPLETED",
      customIdMatches: orderPurchaseUnit?.custom_id === transaction._id.toString(),
      captureCompleted: capture?.status === "COMPLETED",
      captureIdExists: Boolean(capture?.id),
      currencyMatches: capture?.amount?.currency_code === transaction.currency,
      amountIsValid: Number.isFinite(actualAmount),
      amountMatches:
        Number.isFinite(actualAmount) &&
        actualAmount.toFixed(2) === expectedAmount,
    };

    console.log("PayPal verification checks:", checks);

    if (Object.values(checks).some((passed) => !passed)) {
      console.error("PayPal verification failed:", {
        orderStatus: result.status,
        captureStatus: capture?.status ?? null,
        expectedCurrency: transaction.currency,
        actualCurrency: capture?.amount?.currency_code ?? null,
        expectedAmount,
        actualAmount: capture?.amount?.value ?? null,
        customIdPresent: Boolean(purchaseUnit?.custom_id),
        captureIdPresent: Boolean(capture?.id),
      });

      return res.status(409).json({
        success: false,
        message: "Payment details could not be verified.",
        // Diagnostic only; remove before production.
        checks,
      });
    }

    // Save or repair the transaction record.
    const updatedTransaction = await Transaction.findOneAndUpdate(
      {
        _id: transaction._id,
        status: { $in: ["pending", "success"] },
      },
      {
        $set: {
          status: "success",
          paypalCaptureID: capture.id,
          resultDesc: "PayPal payment completed.",
          transactionDate: capturedAt.toISOString(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedTransaction) {
      return res.status(409).json({
        success: false,
        message:
          "Transaction changed during processing. Verify before retrying.",
      });
    }

    // Save the donor exactly once per PayPal capture.
    // This also repairs a missing donor record on a safe retry.
    await Donor.findOneAndUpdate(
      { paypalCaptureID: capture.id },
      {
        $setOnInsert: {
          fullName: transaction.fullName,
          email: transaction.email,
          phone: transaction.phone || "",
          amount: transaction.amount,
          currency: transaction.currency,
          paymentMethod: "paypal",
          beneficiaryId: transaction.beneficiaryId,
          beneficiaryType: transaction.beneficiaryType,
          sponsorshipType: transaction.sponsorshipType,
          paypalCaptureID: capture.id,
          transactionDate: capturedAt,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    // Avoid repeating the success event on a recovery retry.
    const io = req.app.get("io");

    if (io && !wasAlreadySuccessful) {
      io.emit("paymentSuccess", {
        paymentMethod: "paypal",
        orderID,
        donorName: transaction.fullName,
        amount: transaction.amount,
        currency: transaction.currency,
        message: "Donation payment successful.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Donation payment completed and donor record verified.",
      orderID,
      captureID: capture.id,
      status: "COMPLETED",
    });
  } catch (error) {
    console.error("PayPal capture error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Payment processing needs verification. Check PayPal and MongoDB before retrying.",
    });
  }
};

// --------------------------------------------------
// 5. TEMPORARY PAYPAL ORDER STATUS DEBUG ENDPOINT
// Remove or protect this endpoint before production.
// --------------------------------------------------
exports.getOrderStatus = async (req, res) => {
  try {
    const { orderID } = req.body;

    if (typeof orderID !== "string" || !/^[A-Z0-9-]{10,50}$/i.test(orderID)) {
      return res.status(400).json({
        success: false,
        message: "A valid PayPal order ID is required.",
      });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("PayPal order lookup failed:", data);

      return res.status(502).json({
        success: false,
        message: "Could not retrieve PayPal order status.",
      });
    }

    // These variables must be declared before they are used.
    const purchaseUnit = data.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    return res.status(200).json({
      success: true,
      orderID: data.id,
      status: data.status,
      purchaseUnitReference: purchaseUnit?.custom_id ?? null,
      capture: capture
        ? {
            id: capture.id,
            status: capture.status,
            amount: capture.amount?.value,
            currency: capture.amount?.currency_code,
          }
        : null,
    });
  } catch (error) {
    console.error("PayPal order status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve PayPal order status.",
    });
  }
};
