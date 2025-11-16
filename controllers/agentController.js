const bcrypt = require("bcryptjs");
const {
  Admin,
  Game,
  Payment,
  WithdrawalPayment,
  Payouts,
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const { Parser } = require("json2csv");

const agentController = {
  create: async (req, res) => {
    try {
      const { name, email, mobile, password, status } = req.body;

      if (!name || !email || !mobile || !password) {
        return res
          .status(400)
          .json({ status: false, error: "All fields are required" });
      }

      const exists = await Admin.findOne({ where: { email } });
      if (exists) {
        return res
          .status(409)
          .json({ status: false, error: "Email already exists" });
      }

      const hash = await bcrypt.hash(password, 10);
      const ref_id = Math.floor(10000 + Math.random() * 90000);
      const agent_id = name.replace(/\s+/g, "") + ref_id;
      const agent = await Admin.create({
        name,
        email,
        mobile,
        password: hash,
        role: "agent",
        ref_id: agent_id,
        agent_id: ref_id,
        status,
      });

      const data = agent.get({ plain: true });
      delete data.password;

      res
        .status(201)
        .json({ status: true, message: "User created", agent: data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword, id } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res
          .status(400)
          .json({ status: false, error: "All fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          status: false,
          error: "New password and confirm password do not match",
        });
      }

      const user = await Admin.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ status: false, error: "User not found" });
      }

      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res
          .status(401)
          .json({ status: false, error: "Current password is incorrect" });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      user.passwordUpdatedAt = new Date();
      await user.save();

      res.json({ status: true, message: "Password changed successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  list: async (req, res) => {
    try {
      const { search, status } = req.body; // Use req.body for POST data
      let whereClause = {
        role: "agent",
      };

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { mobile: { [Op.like]: `%${search}%` } },
        ];
      }

      if (status === "active") {
        whereClause.status = "active"; // Only fetch active agents
      }

      // If status is 'inactive', filter for inactive records only
      else if (status === "inactive") {
        whereClause.status = "inactive"; // Only fetch inactive agents
      }

      // If no status is provided (empty or undefined), fetch both active and inactive records
      else if (status === undefined || status === "") {
        whereClause.status = { [Op.in]: ["active", "inactive"] }; // Fetch both active and inactive agents
      }

      const agents = await Admin.findAll({
        where: whereClause,
        attributes: { exclude: ["password"] },
      });

      res.json({ status: true, agents });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
  updatePercentage: async (req, res) => {
    try {
      const {
        id,
        percentage,
        withdrawal_percentage,
        deposit_percentage,
        cash_app_percentage,
        chime_app_percentage,
        with_cash_app_percentage,
        with_chime_app_percentage,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: "Admin ID and percentage are required.",
        });
      }

      const admin = await Admin.findOne({ where: { id } });

      if (!admin) {
        return res
          .status(404)
          .json({ status: false, message: "Admin not found" });
      }

      await admin.update({
        percentage,
        withdrawal_percentage,
        deposit_percentage,
        cash_app_percentage,
        chime_app_percentage,
        with_cash_app_percentage,
        with_chime_app_percentage,
      });

      return res.json({
        status: true,
        message: "Percentage updated successfully",
        admin,
      });
    } catch (error) {
      console.error("Error updating percentage:", error);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },

  edit: async (req, res) => {
    try {
      const { id, name, email, mobile, percentage, status } = req.body;

      const agent = await Admin.findByPk(id);
      if (!agent)
        return res.status(404).json({ status: false, error: "User not found" });

      await agent.update({ name, email, mobile, percentage, status });
      const updated = agent.get({ plain: true });
      delete updated.password;

      res.json({ status: true, message: "User updated", agent: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.body;
      const agent = await Admin.findByPk(id);
      if (!agent)
        return res
          .status(404)
          .json({ status: false, error: "Agent not found" });

      await agent.destroy();
      res.json({ status: true, message: "Agent deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  async computeAgentAnalytics(agent) {
    const agentId = agent.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Helper functions
    const safeNumber = (val) => (isNaN(val) || val === null ? 0 : Number(val));
    const formatCurrency = (val) => `$ ${safeNumber(val).toFixed(2)}`;

    // Get analytics data
    const [
      totalDepositsRaw,
      totalWithdrawalsRaw,
      todayDepositsRaw,
      todayWithdrawalsRaw,
      withdrawalFeesRaw,
      depositFeesRaw,
      lifetimeEarningsRaw,
    ] = await Promise.all([
      Payment.sum("amount", { where: { agent_p_id: agentId, status: "1" } }),
      WithdrawalPayment.sum("amount", {
        where: { agent_p_id: agentId, status: ["2", "4"] },
      }),
      Payment.sum("amount", {
        where: {
          agent_p_id: agentId,
          status: "1",
          created_at: { [Op.between]: [todayStart, todayEnd] },
        },
      }),
      WithdrawalPayment.sum("amount", {
        where: {
          agent_p_id: agentId,
          status: ["2", "4"],
          created_at: { [Op.between]: [todayStart, todayEnd] },
        },
      }),
      WithdrawalPayment.sum("fees", {
        where: { agent_p_id: agentId, status: ["2", "4"] },
      }),
      Payment.sum("fees", { where: { agent_p_id: agentId, status: "1" } }),
      Payouts.sum("amount", { where: { agent_id: agentId } }),
    ]);

    // Ensure numeric values
    const totalDeposits = safeNumber(totalDepositsRaw);
    const totalWithdrawals = safeNumber(totalWithdrawalsRaw);
    const todayDeposits = safeNumber(todayDepositsRaw);
    const todayWithdrawals = safeNumber(todayWithdrawalsRaw);
    const withdrawalFees = safeNumber(withdrawalFeesRaw);
    const depositFees = safeNumber(depositFeesRaw);
    const lifetimeEarnings = safeNumber(lifetimeEarningsRaw);

    const fees = withdrawalFees + depositFees;
    const totalWithdrawalsFinal = totalWithdrawals + lifetimeEarnings;
    const availablePayout = totalDeposits - totalWithdrawalsFinal - fees;

    return {
      id: agent.id,
      agent_id: agent.agent_id,
      name: agent.name,
      email: agent.email,
      totalDeposits: formatCurrency(totalDeposits),
      totalWithdrawals: formatCurrency(totalWithdrawalsFinal),
      todayWithdrawals: formatCurrency(todayWithdrawals),
      todayDeposits: formatCurrency(todayDeposits),
      fees: formatCurrency(fees),
      availablePayout: formatCurrency(availablePayout),
      lifetimeEarnings: formatCurrency(lifetimeEarnings),
    };
  },
  agentAnalytical: async (req, res) => {
    try {
      const { agentName, export_csv, page = 1, limit = 10 } = req.body;

      const whereClause = {
        role: "agent",
        status: "active",
        ...(agentName && {
          [Op.or]: [
            { name: { [Op.like]: `%${agentName}%` } },
            { id: agentName },
            { agent_id: agentName },
          ],
        }),
      };

      // Get agents (with or without pagination)
      const agents = export_csv
        ? await Admin.findAll({
            where: whereClause,
            attributes: { exclude: ["password"] },
            raw: true,
          })
        : await Admin.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ["password"] },
            limit: parseInt(limit),
            offset: (page - 1) * limit,
            raw: true,
          });

      const agentList = export_csv ? agents : agents.rows;
      const analyticsResults = await Promise.all(
        agentList.map((agent) => agentController.computeAgentAnalytics(agent))
      );

      if (export_csv) {
        const csvData = analyticsResults.map((item) => ({
          "Agent ID": item.agent_id,
          Name: item.name,
          Email: item.email,
          "Total Deposits": item.totalDeposits,
          "Total Withdrawals": item.totalWithdrawals,
          "Today's Withdrawals": item.todayWithdrawals,
          "Today's Deposits": item.todayDeposits,
          Fees: item.fees,
          "Available Payout": item.availablePayout,
          "Lifetime Earnings": item.lifetimeEarnings,
        }));

        const csv = new Parser().parse(csvData);
        return res.json({
          status: true,
          csv,
          filename: `agent-analytics-${Date.now()}.csv`,
        });
      }

      res.json({
        status: true,
        data: {
          agents: analyticsResults,
          totalPages: Math.ceil(agents.count / limit),
          totalRecords: agents.count,
          currentPage: parseInt(page),
          recordsPerPage: parseInt(limit),
        },
      });
    } catch (err) {
      console.error("Agent Analytical Error:", err);
      res
        .status(500)
        .json({ status: false, error: "Internal server error", test: err });
    }
  },
  detailReport: async (req, res) => {
    try {
      const { agentId, from, to } = req.body;

      if (!agentId) {
        return res
          .status(400)
          .json({ status: false, message: "agentId is required" });
      }

      const dateFilter = {};
      if (from && to) {
        dateFilter.created_at = {
          [Op.between]: [new Date(from), new Date(to)],
        };
      } else if (from) {
        dateFilter.created_at = {
          [Op.gte]: new Date(from),
        };
      } else if (to) {
        dateFilter.created_at = {
          [Op.lte]: new Date(to),
        };
      }

      // Get DEPOSITS grouped by game + payment method
      const depositData = await Payment.findAll({
        where: {
          agent_p_id: agentId,
          status: "1",
          ...dateFilter,
        },
        attributes: [
          [Sequelize.fn("ANY_VALUE", Sequelize.col("game")), "game"],
          "show_name",
          [Sequelize.fn("SUM", Sequelize.col("amount")), "totalAmount"],
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
          [
            Sequelize.fn(
              "ANY_VALUE",
              Sequelize.fn("DATE", Sequelize.col("created_at"))
            ),
            "date",
          ],
        ],
        group: ["show_name"],
        raw: true,
      });

      // Get WITHDRAWALS grouped by date + payment method
      const withdrawalData = await WithdrawalPayment.findAll({
        where: {
          agent_p_id: agentId,
          status: ["2", "4"],
          ...dateFilter,
        },
        attributes: [
          [Sequelize.fn("SUM", Sequelize.col("amount")), "totalAmount"],
          "show_name",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
          [
            Sequelize.fn(
              "ANY_VALUE",
              Sequelize.fn("DATE", Sequelize.col("created_at"))
            ),
            "date",
          ], // avoid GROUP BY error
        ],
        group: ["show_name"], // group only by show_name
        raw: true,
      });

      // Summary: Count by payment method
      const depositMethodMap = {};
      const withdrawalMethodMap = {};
      const depositDateMap = {};
      const withdrawalDateMap = {};

      depositData.forEach((d) => {
        depositMethodMap[d.show_name] =
          (depositMethodMap[d.show_name] || 0) + parseFloat(d.totalAmount);
        depositDateMap[d.date] =
          (depositDateMap[d.date] || 0) + parseFloat(d.totalAmount);
      });

      withdrawalData.forEach((w) => {
        withdrawalMethodMap[w.show_name] =
          (withdrawalMethodMap[w.show_name] || 0) + parseFloat(w.totalAmount);
        withdrawalDateMap[w.date] =
          (withdrawalDateMap[w.date] || 0) + parseFloat(w.totalAmount);
      });

      res.json({
        status: true,
        data: {
          depositData,
          withdrawalData,
          // summary: {
          //   topDepositMethod,
          //   topWithdrawalMethod,
          //   topDepositDate,
          //   topWithdrawalDate,
          // },
        },
      });
    } catch (error) {
      console.error("Agent Detail Report Error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
};

module.exports = agentController;
