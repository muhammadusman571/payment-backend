require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { ethers } = require("ethers");
const { BitCoinPayment } = require("./../models/BitCoinPayment"); // apna model ka path check kar lena

const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;

app.use(express.json());

// ✅ Signature verify function
function verifySignature(req) {
  const signature = req.header("X-Alchemy-Signature");
  if (!signature) return false;

  const secret = process.env.ALCHEMY_SIGNING_KEY;
  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");

  return hmac === signature;
}

// ✅ Webhook route
app.post("/webhooks", async (req, res) => {
  console.log("jere");
  if (!verifySignature(req)) {
    console.log("❌ Invalid webhook signature");
    return res.status(401).send("Invalid signature");
  }

  try {
    const event = req.body.event; // payload ka main event
    const activity = event.activity[0];

    const txHash = activity.hash;
    const to = activity.toAddress.toLowerCase();
    const value = ethers.formatEther(activity.value);

    if (to !== process.env.MY_WALLET_ADDRESS.toLowerCase()) {
      console.log("ℹ️ Transaction not for our address:", to);
      return res.status(200).send("Not for us");
    }

    // OrderId decode karo
    const dataHex = activity.rawContract?.data || "0x";
    const orderId = parseInt(dataHex, 16);

    if (!orderId) {
      console.log("⚠️ No orderId found in tx data");
      return res.status(200).send("No orderId");
    }

    const payment = await BitCoinPayment.findByPk(orderId);
    if (!payment) {
      console.log("⚠️ No order found for id:", orderId);
      return res.status(200).send("Order not found");
    }

    if (payment.status === "PAID") {
      console.log(`ℹ️ Order ${orderId} already marked as PAID`);
      return res.status(200).send("Already paid");
    }

    // Amount check
    const expected = parseFloat(payment.amount);
    if (parseFloat(value) < expected) {
      console.log(`⚠️ Amount mismatch for order ${orderId}`);
      return res.status(200).send("Amount mismatch");
    }

    // ✅ Mark order paid
    payment.status = "PAID";
    payment.txHash = txHash;
    await payment.save();

    console.log(`✅ Order ${orderId} marked as PAID (tx: ${txHash})`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("🔥 Webhook error:", err.message);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
