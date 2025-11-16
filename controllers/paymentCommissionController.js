const db = require("../models");
const AgentsPaymentCommission = db.AgentsPaymentCommission;
const AgentReceivedCommission = db.AgentReceivedCommission;
const Payment = db.Payment;
const Payouts = db.Payouts;
const Admin = db.Admin;
const Provider = db.Provider;
const { Op } = require("sequelize");
const { Parser } = require("json2csv");
const {
  generateEmailContent,
  sendPayoutEmailToAgent,
  sendDepositEmail,
} = require("../utils/mailer");

exports.addCommission = async (req, res) => {
  try {
    const data = await AgentsPaymentCommission.create(req.body);
    res.status(201).json({
      status: true,
      message: "Commission record created",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error creating commission",
      error: error.message,
    });
  }
};

// exports.getAllCommissions = async (req, res) => {
//     const { id, role } = req.body;

//   try {
//     let whereClause = {};

//     if (role === 'agent') {
//       whereClause.agent_id = id;
//     }
//     const data = await AgentsPaymentCommission.findAll({
//         where: whereClause,
//       order: [['created_at', 'DESC']]
//     });
//     res.status(200).json({
//       status: true,
//       message: "All commission records",
//       data
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: false,
//       message: "Error fetching records",
//       error: error.message
//     });
//   }
// };

exports.getAllCommissions_old = async (req, res) => {
  const { id, role, from, to, agent_name } = req.body;

  try {
    let whereClause = {};

    // Filter by agent ID if role is agent
    if (role === "agent") {
      whereClause.agent_id = id;
    }

    // if (agent_name) {
    //   whereClause.agent_name = { [Op.like]: `%${agent_name}%` };
    // }

    if (agent_name) {
      whereClause[Op.or] = [
        { agent_ref_id: agent_name },
        { agent_name: { [Op.like]: `%${agent_name}%` } },
      ];
    }
    console.log("whereClause", whereClause);

    // Filter by date range
    if (from && to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      whereClause.created_at = {
        [Op.between]: [new Date(from), toDate],
      };
    } else if (from) {
      whereClause.created_at = {
        [Op.gte]: new Date(from),
      };
    } else if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      whereClause.created_at = {
        [Op.lte]: toDate,
      };
    }

    // Query with agent relation
    const data = await AgentsPaymentCommission.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      status: true,
      message: "All commission records",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error fetching records",
      error: error.message,
    });
  }
};

exports.getAllPayoutHistory = async (req, res) => {
  const { id, role, from, to, agent_name, export_csv } = req.body;

  try {
    let whereClause = {};
    let include = [
      {
        model: Admin,
        as: "admin",
        attributes: ["id", "name", "email", "mobile", "agent_id"],
        required: true,
      },
    ];

    // Role-based filtering
    if (role === "agent") {
      whereClause.agent_id = id;
    }

    // Agent name search
    if (agent_name) {
      include[0].where = {
        [Op.or]: [{ name: { [Op.like]: `%${agent_name}%` } }],
      };
    }

    // Date range filtering
    if (from && to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      whereClause.payout_date = {
        [Op.between]: [new Date(from), toDate],
      };
    } else if (from) {
      whereClause.payout_date = {
        [Op.gte]: new Date(from),
      };
    } else if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      whereClause.payout_date = {
        [Op.lte]: toDate,
      };
    }

    const data = await Payouts.findAll({
      where: whereClause,
      include: include,
      order: [["id", "DESC"]],
      raw: false, // Need false to properly handle included models
    });

    // JSON Response
    res.status(200).json({
      status: true,
      message: "All payout records",
      data: data,
    });
  } catch (error) {
    console.error("Payout history error:", error);
    res.status(500).json({
      status: false,
      message: "Error fetching payout records",
      error: error.message,
    });
  }
};
exports.addPayoutHistory = async (req, res) => {
  const { agent_id, amount, method, date } = req.body;
  const agent = await Admin.findByPk(parseInt(agent_id));

  try {
    // Convert amount to decimal and validate
    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount)) {
      return res.status(400).json({
        status: false,
        message: "Invalid amount provided",
      });
    }
    const payoutDate = new Date(date);
    // Create payout record
    const payout = await Payouts.create({
      agent_id: parseInt(agent_id),
      amount: payoutAmount,
      method: method.toString(),
      payout_date: payoutDate.toISOString(),
    });
    const payment = {
      amount: payoutAmount,
      agent_name: agent.name,
      link: "https://milkyswipe.com/payout-history",
    };
    sendPayoutEmailToAgent(agent.email, "Payout Initiated", payment);
    res.status(201).json({
      status: true,
      message: "Payout record created successfully",
      data: payout,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Error creating payout record",
      error: error.message,
    });
  }
};

// Update Payout Function
exports.updatePayoutHistory = async (req, res) => {
  const { payout_id, agent_id, amount, method, date } = req.body;

  try {
    // Check if payout exists
    const existingPayout = await Payouts.findByPk(payout_id);
    if (!existingPayout) {
      return res.status(404).json({
        status: false,
        message: "Payout record not found",
      });
    }

    // Validate amount
    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount)) {
      return res.status(400).json({
        status: false,
        message: "Invalid amount provided",
      });
    }

    // Update payout record
    const updatedPayout = await existingPayout.update({
      agent_id: parseInt(agent_id),
      amount: payoutAmount,
      method: method.toString(),
      payout_date: new Date(date).toISOString(),
    });

    res.status(200).json({
      status: true,
      message: "Payout record updated successfully",
      data: updatedPayout,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Error updating payout record",
      error: error.message,
    });
  }
};

// Delete Payout Function
exports.deletePayoutHistory = async (req, res) => {
  const { payout_id } = req.body;

  try {
    // Check if payout exists
    const existingPayout = await Payouts.findByPk(payout_id);
    if (!existingPayout) {
      return res.status(404).json({
        status: false,
        message: "Payout record not found",
      });
    }

    // Delete payout record
    await existingPayout.destroy();

    res.status(200).json({
      status: true,
      message: "Payout record deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Error deleting payout record",
      error: error.message,
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const { paymentId, status } = req.body;

  try {
    const payment = await Payment.findOne({ where: { id: paymentId } });

    if (!payment) {
      return res
        .status(404)
        .json({ status: false, message: "Payment not found" });
    }

    const provider = await Provider.findOne({
      where: { name: payment.provider },
    });

    // Update payment status
    payment.status = status; // 1 for success, 2 for failed
    payment.is_manual = true;
    await payment.save();

    // If success (status == 1), insert commission record
    if (status == 1) {
      const admin = await Admin.findOne({ where: { id: payment.agent_p_id } });
      const commissionPercentage = admin?.percentage || 0;

      const commissionAmount = (payment.amount * commissionPercentage) / 100;
      if (payment.agent_p_id && payment.agent_id)
        await AgentsPaymentCommission.create({
          agent_id: payment.agent_p_id,
          agent_ref_no: payment.ref_no,
          agent_ref_id: payment.agent_id,
          payment_id: payment.id,
          gamename: payment.game,
          provider: payment.provider,
          username: payment.username,
          agent_name: payment.agent_name,
          amount: payment.amount,
          commission_amount: commissionAmount,
          commission_percentage: commissionPercentage,
          status: 1,
        });

      const formattedEmail = `${admin?.email}\n`;

      console.log(formattedEmail);

      const emailContent = generateEmailContent(payment, provider);
      if (formattedEmail)
        await sendDepositEmail(
          formattedEmail,
          "Payment Confirmation – MilkySwipe",
          emailContent,
          true
        );
    }
    if (req.app && req.app.get("io")) {
      const io = req.app.get("io");
      console.log(io.emit("refresh-transactions"));
    }

    res.status(200).json({
      status: true,
      message: `Payment marked as ${status == 1 ? "successful" : "failed"}`,
    });
  } catch (error) {
    console.error("Update Payment Error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAgentCommissionSummary = async (req, res) => {
  const { agent_id } = req.body;

  try {
    // Total earned commission
    const totalCommission =
      (await AgentsPaymentCommission.sum("commission_amount", {
        where: { agent_id, status: 1 },
      })) || 0;

    // Total received commission
    const totalReceived =
      (await AgentReceivedCommission.sum("total_recived_commission", {
        where: { agent_id },
      })) || 0;

    // Pending = total - received
    const pendingCommission = totalCommission - totalReceived;

    // Get all received commission records for agent
    const receivedRecords = await AgentReceivedCommission.findAll({
      where: { agent_id },
      order: [["date", "DESC"]],
    });

    res.status(200).json({
      status: true,
      agent_id,
      total_commission: totalCommission.toFixed(2),
      total_received: totalReceived.toFixed(2),
      pending_commission: pendingCommission.toFixed(2),
      received_commission_history: receivedRecords,
    });
  } catch (error) {
    console.error("Commission summary error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.payoutToAgent = async (req, res) => {
  const { agent_id } = req.body;

  try {
    if (!agent_id) {
      return res
        .status(400)
        .json({ status: false, message: "agent_id is required" });
    }

    // Total commission earned
    const totalCommission =
      (await AgentsPaymentCommission.sum("commission_amount", {
        where: { agent_id, status: 1 },
      })) || 0;

    // Total already received
    const totalReceived =
      (await AgentReceivedCommission.sum("total_recived_commission", {
        where: { agent_id },
      })) || 0;

    const pendingCommission = totalCommission - totalReceived;

    if (pendingCommission <= 0) {
      return res.status(200).json({
        status: false,
        message: "No pending commission to payout",
      });
    }

    // Insert payout
    const newPayout = await AgentReceivedCommission.create({
      agent_id,
      total_recived_commission: pendingCommission,
      date: new Date(),
    });

    res.status(201).json({
      status: true,
      message: "Payout successful",
      payout: newPayout,
      summary: {
        agent_id,
        total_commission: totalCommission.toFixed(2),
        total_received: (totalReceived + pendingCommission).toFixed(2),
        pending_commission: "0.00",
      },
    });
  } catch (error) {
    console.error("Payout error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
