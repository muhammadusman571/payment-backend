const axios = require("axios");
const { Payment, Admin, Game } = require("../models");
const path = require("path");
const fs = require("fs");
const { Parser } = require("json2csv");
const QRCode = require("qrcode");
const Web3 = require("web3");
const web3 = new Web3();
const { ethers } = require("ethers");

const { Op } = require("sequelize");

const BitCoinPayment = require("../models/BitCoinPayment");
require("dotenv").config();
exports.getPaymentHistory = async (req, res) => {
  try {
    const {
      agent_id,
      game_id,
      status,
      from,
      to,
      page = 1,
      limit = 10,
      export_csv,
    } = req.body;

    let where = {};

    if (agent_id) where.agent_id = agent_id;
    if (game_id) where.game_id = game_id;

    // Status logic
    const thresholdTime = new Date(Date.now() - 45 * 60 * 1000);
    if (status !== undefined && status !== "") {
      const numStatus = Number(status);
      if (numStatus === 0) {
        where.status = 0;
        where.created_at = { [Op.gte]: thresholdTime };
      } else if (numStatus === 3) {
        where.status = 0;
        where.created_at = { [Op.lte]: thresholdTime };
      } else if ([1, 2].includes(numStatus)) {
        where.status = numStatus;
      }
    }

    if (from && to) {
      where.created_at = {
        [Op.between]: [
          new Date(`${from}T00:00:00`),
          new Date(`${to}T23:59:59`),
        ],
      };
    } else if (from) {
      where.created_at = { [Op.gte]: new Date(`${from}T00:00:00`) };
    } else if (to) {
      where.created_at = { [Op.lte]: new Date(`${to}T23:59:59`) };
    }

    const order = [["created_at", "DESC"]];

    let queryOptions = {
      where,
      order,
      include: [
        { model: Admin, as: "agent", attributes: ["id", "name"] }, // must match 'as' in belongsTo
        { model: Game, as: "game", attributes: ["id", "name"] }, // must match 'as' in belongsTo
      ],
      raw: true,
      nest: true,
    };

    if (!export_csv) {
      queryOptions.offset = (page - 1) * limit;
      queryOptions.limit = limit;
    }

    const payments = await BitCoinPayment.findAll(queryOptions);

    // CSV export
    if (export_csv) {
      const csvData = payments.map((t, i) => {
        let statusLabel = "Pending";
        if (t.status === 1) statusLabel = "Success";
        else if (t.status === 2) statusLabel = "Failed";
        else if (t.status === 0 && new Date(t.created_at) <= thresholdTime)
          statusLabel = "Expired";

        return {
          "S.No": i + 1,
          "Agent Id": t.agent.id,
          "Agent Name": t.agent.name,
          "Game Id": t.game.id,
          "Game Name": t.game.name,
          Username: t.username || "-",
          Amount: t.amount,
          Address: t.address || "-",
          Status: statusLabel,
          "Created At": new Date(t.created_at).toLocaleString(),
        };
      });

      const parser = new Parser();
      const csv = parser.parse(csvData);
      res.header("Content-Type", "text/csv");
      res.attachment("bitcoin-payment-history.csv");
      return res.send(csv);
    }

    const totalRecords = await BitCoinPayment.count({ where });
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      status: true,
      payments,
      totalRecords,
      totalPages,
      currentPage: page,
      perPage: limit,
    });
  } catch (err) {
    console.error("Payment History Error:", err);
    return res.status(500).json({
      status: false,
      error: "Internal server error",
    });
  }
};

exports.bulkUpdatePayments = async (req, res) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0)
    return res
      .status(400)
      .json({ status: false, message: "No payment IDs provided" });

  if (![0, 1, 2].includes(Number(status)))
    return res
      .status(400)
      .json({ status: false, message: "Invalid status value" });

  try {
    const updated = await BitCoinPayment.update(
      { status: Number(status) },
      { where: { id: { [Op.in]: ids } } }
    );

    res.status(200).json({
      status: true,
      message: `Updated ${updated[0]} payments to status ${status}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Bulk update failed" });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const { paymentId, status } = req.body;

  if (!paymentId)
    return res
      .status(400)
      .json({ status: false, message: "Payment ID is required" });

  if (![0, 1, 2].includes(Number(status)))
    return res
      .status(400)
      .json({ status: false, message: "Invalid status value" });

  try {
    const payment = await BitCoinPayment.findByPk(paymentId);
    if (!payment)
      return res
        .status(404)
        .json({ status: false, message: "Payment not found" });

    payment.status = Number(status);
    await payment.save();

    res.status(200).json({
      status: true,
      message: `Payment status updated to ${status}`,
      payment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Failed to update" });
  }
};
exports.generateInvoiceLink = async (req, res) => {
  try {
    const { amount } = req.body;
    const fees = await generateRandomFee();
    console.log(fees);

    const address = "0xA53117eB10135a9258F354d67d945730e7404B63";
    const finalAmount = Number(amount) + Number(fees);
    // Create DB entry
    const data = await BitCoinPayment.create({
      ...req.body,

      address,
      agent_id: req.admin.id,
    });

    const orderId = data.id;

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const filePath = path.join(uploadDir, `${orderId}.png`);
    const recipient = "0xA53117eB10135a9258F354d67d945730e7404B63";
    const usdtContract = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const finalamount = Math.floor(finalAmount * 1e6);
    // data.amount = finalamount;

    const qrData = `ethereum:${recipient}/transfer?address=${usdtContract}&uint256=${finalAmount}`;
    await QRCode.toFile(filePath, qrData, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 300,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const qrUrl = `https://payment.thewebdevonline.com/api/uploads/${orderId}.png`;
    data.qrUrl = qrUrl;
    await data.save();

    res.status(200).json({
      message: "USDT QR generated",
      orderId,
      checkoutLink: `https://payment.thewebdevonline.com/invoice?orderId=${orderId}`,
      address,
      amount, // optional
      qrUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const { orderId } = req.query;

    const data = await BitCoinPayment.findByPk(orderId);

    res.status(200).json({
      message: "USDT QR generated",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

function generateRandomFee() {
  const min = 0.1;
  const max = 0.99;
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
