const db = require('../models');
const AgentsPaymentCommission = db.AgentsPaymentCommission;
const AgentReceivedCommission = db.AgentReceivedCommission;
const { Op } = require('sequelize');

exports.getAgentCommissionSummary = async (req, res) => {
  const { agent_id } = req.body;

  try {
    // Total earned commission
    const totalCommission = await AgentsPaymentCommission.sum('commission_amount', {
      where: { agent_id, status: 1 }
    }) || 0;

    // Total received commission
    const totalReceived = await AgentReceivedCommission.sum('total_recived_commission', {
      where: { agent_id }
    }) || 0;

    // Pending = total - received
    const pendingCommission = totalCommission - totalReceived;

    res.status(200).json({
      status: true,
      agent_id,
      total_commission: totalCommission.toFixed(2),
      total_received: totalReceived.toFixed(2),
      pending_commission: pendingCommission.toFixed(2)
    });

  } catch (error) {
    console.error("Commission summary error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
