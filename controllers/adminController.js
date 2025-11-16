const jwt = require("jsonwebtoken");
const {
  Admin,
  Permission,
  Payment,
  Setting,
  WithdrawalPayment,
  Payouts,
} = require("../models");

const bcrypt = require("bcryptjs"); // ✅ Already added
const { Op, QueryTypes } = require("sequelize");
const moment = require("moment"); // install via: npm i moment
const { fn, col, literal } = require("sequelize");
const sequelize = require("../config/db");

const adminController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: false,
          error: "Email and password are required",
        });
      }
      console.log("emailstart", email, "emailEnd");

      const admin = await Admin.findOne({
        where: {
          email,
          // role: {
          //   [Op.ne]: "superadmin",
          // },
        },
      });

      if (!admin) {
        return res.status(404).json({
          status: false,
          error: "Admin not found",
        });
      }

      // if (!(await admin.validPassword(password))) {
      //   return res.status(401).json({
      //     status: false,
      //     error: "Invalid credentials",
      //   });
      // }

      if (admin.status !== "active") {
        return res.status(403).json({
          status: false,
          error: "Account is inactive",
        });
      }

      const token = jwt.sign(
        { id: admin.id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: "6h" }
      );
      const adminData = admin.get({ plain: true });
      delete adminData.password;
      res.json({
        status: true,
        message: "Login successful",
        token,
        admin: adminData,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },
  superLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: false,
          error: "Email and password are required",
        });
      }
      const admin = await Admin.findOne({
        where: {
          email,
          role: "superadmin",
        },
      });

      if (!admin) {
        return res.status(404).json({
          status: false,
          error: "Admin not found",
        });
      }

      if (!(await admin.validPassword(password))) {
        return res.status(401).json({
          status: false,
          error: "Invalid credentials",
        });
      }

      if (admin.status !== "active") {
        return res.status(403).json({
          status: false,
          error: "Account is inactive",
        });
      }

      const token = jwt.sign(
        { id: admin.id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: "6h" }
      );
      const adminData = admin.get({ plain: true });
      delete adminData.password;
      res.json({
        status: true,
        message: "Login successful",
        token,
        admin: adminData,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({
          status: false,
          error: "Admin ID is required",
        });
      }
      const admin = await Admin.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      if (!admin) {
        return res.status(404).json({
          status: false,
          error: "Admin not found",
        });
      }

      res.json({
        status: true,
        admin,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },

  agentProfile: async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({
          status: false,
          error: "Agent ID is required",
        });
      }
      const admin = await Admin.findOne({
        where: {
          ref_id: id,
        },
        attributes: { exclude: ["password"] },
      });

      if (!admin) {
        return res.status(404).json({
          status: false,
          error: "Admin not found or ref_id missing",
        });
      }

      res.json({
        status: true,
        admin,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },

  agentProfileById: async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({
          status: false,
          error: "Agent ID is required",
        });
      }
      const admin = await Admin.findOne({
        where: {
          id: id,
        },
        attributes: { exclude: ["password"] },
      });

      if (!admin) {
        return res.status(404).json({
          status: false,
          error: "Admin not found or id missing",
        });
      }

      res.json({
        status: true,
        admin,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },

  dashboardDepositGraph: async (req, res) => {
    try {
      const { id, role, startDate, endDate } = req.body;

      if (!id || !role) {
        return res.status(400).json({
          status: false,
          error: "user_id and role are required",
        });
      }

      console.log("Dashboard graph request:", id, role, startDate, endDate);
      // Admin: See all agents
      // const totalAgents = await Admin.count({
      //   where: { role: "agent" },
      // });

      // // Filters for payments
      // const paymentFilter = role === "agent" ? { agent_p_id: id } : {};

      // const Agents = await Admin.findOne({
      //   where: { role: "agent" },
      //   ...paymentFilter,
      // });

      const agentFilter =
        role === "agent" ? `AND p.agent_p_id = ${sequelize.escape(id)}` : "";

      const sql = `
        WITH RECURSIVE dates AS (
          SELECT :startDate AS date
          UNION ALL
          SELECT date + INTERVAL 1 DAY FROM dates WHERE date + INTERVAL 1 DAY <= :endDate
        )
        SELECT 
          d.date,
          COALESCE(SUM(p.amount), 0) AS amount
        FROM dates d
        LEFT JOIN payments p 
          ON DATE(p.created_at) = d.date
          AND p.status = '1'
          ${agentFilter}
        GROUP BY d.date
        ORDER BY d.date ASC;
      `;
      const result = await sequelize.query(sql, {
        replacements: {
          startDate,
          endDate,
        },
        type: QueryTypes.SELECT,
        raw: true,
      });

      console.log(result);
      res.json({
        status: true,
        data: {
          depositGraph: result,
        },
      });
    } catch (error) {
      console.error("Dashboard graph error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  dashboardStats: async (req, res) => {
    try {
      res.json({
        status: true,
        data: {},
      });
      return;
      const { id, role } = req.body;

      if (!id || !role) {
        return res.status(400).json({
          status: false,
          error: "user_id and role are required",
        });
      }

      // Admin: See all agents
      const totalAgents = await Admin.count({
        where: { role: "agent" },
      });

      // Filters for payments
      const paymentFilter = role === "agent" ? { agent_p_id: id } : {};

      const Agents = await Admin.findOne({
        where: { role: "agent" },
        ...paymentFilter,
      });

      // Total Earnings
      const totalEarningData = await Payment.sum("amount", {
        where: {
          currency: "USD",
          status: "1",
          ...paymentFilter,
        },
      });

      const totalEarning = totalEarningData || 0;

      // Total Transactions
      const totalTransaction =
        (await Payment.sum("amount", {
          where: {
            status: "1",
            ...paymentFilter,
          },
        })) || 0;

      // Today's Transactions
      const today = moment().startOf("day").toDate();
      const todayTransaction =
        (await Payment.sum("amount", {
          where: {
            status: "1",
            created_at: {
              [Op.gte]: today,
            },
            ...paymentFilter,
          },
        })) || 0;

      // Today's withdrawals
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayDeposits =
        (await Payment.sum("amount", {
          where: {
            status: "1",
            created_at: {
              [Op.between]: [todayStart, todayEnd],
            },
            ...paymentFilter,
          },
        })) || 0;

      // Today's withdrawals
      const todayWithdrawals =
        (await WithdrawalPayment.sum("amount", {
          where: {
            status: ["2", "4"],
            created_at: {
              [Op.between]: [todayStart, todayEnd],
            },
            ...paymentFilter,
          },
        })) || 0;

      const fees =
        (await WithdrawalPayment.sum("fees", {
          where: {
            status: ["2", "4"],
            ...paymentFilter,
          },
        })) || 0;

      const depositFees =
        (await Payment.sum("fees", {
          where: {
            status: "1",
            ...paymentFilter,
          },
        })) || 0;

      const feesfinal = fees + depositFees;

      // Today's Transactions
      const totalDeposits =
        (await Payment.sum("amount", {
          where: {
            status: "1",
            ...paymentFilter,
          },
        })) || 0; // 1300

      // Total withdrawals
      const totalWithdrawals =
        (await WithdrawalPayment.sum("amount", {
          where: {
            status: ["2", "4"],
            ...paymentFilter,
          },
        })) || 0;

      const User = await Admin.findOne({
        where: { id },
        raw: true,
      });

      const lifetimeEarnings =
        (await Payouts.sum("amount", {
          where: {
            agent_id: id,
          },
        })) || 0;

      const totalWithdrawalsFinal =
        Number(totalWithdrawals) + Number(lifetimeEarnings);

      const availableBalance = totalDeposits - totalWithdrawalsFinal;

      const availablePayout = totalDeposits - totalWithdrawalsFinal - feesfinal;
      const agentFilter =
        role === "agent" ? `AND p.agent_p_id = ${sequelize.escape(id)}` : "";

      const [depositGraph] = await sequelize.query(`
  WITH RECURSIVE dates AS (
    SELECT CURDATE() - INTERVAL 6 DAY AS date
    UNION ALL
    SELECT date + INTERVAL 1 DAY FROM dates WHERE date + INTERVAL 1 DAY <= CURDATE()
  )
  SELECT 
    d.date,
    COALESCE(SUM(p.amount), 0) AS amount
  FROM dates d
  LEFT JOIN payments p 
    ON DATE(p.created_at) = d.date
    AND p.status = '1'
    ${agentFilter}
  GROUP BY d.date
  ORDER BY d.date ASC;
`);
      let topDepositors = { daily: [], weekly: [], allTime: [] };
      if (role !== "agent") {
        const weekStart = moment().startOf("isoWeek").toDate();
        const topProviderQueries = [
          // Daily
          sequelize.query(
            `SELECT provider, ANY_VALUE(show_name) AS show_name, SUM(amount) AS amount
       FROM payments
       WHERE status = '1' AND created_at >= :todayStart AND provider IS NOT NULL
       GROUP BY provider
       ORDER BY amount DESC
       LIMIT 5`,
            { replacements: { todayStart }, type: sequelize.QueryTypes.SELECT }
          ),

          // Weekly
          sequelize.query(
            `SELECT provider, ANY_VALUE(show_name) AS show_name, SUM(amount) AS amount
       FROM payments
       WHERE status = '1' AND created_at >= :weekStart AND provider IS NOT NULL
       GROUP BY provider
       ORDER BY amount DESC
       LIMIT 5`,
            { replacements: { weekStart }, type: sequelize.QueryTypes.SELECT }
          ),

          // All Time
          sequelize.query(
            `SELECT provider, ANY_VALUE(show_name) AS show_name, SUM(amount) AS amount
       FROM payments
       WHERE status = '1' AND provider IS NOT NULL
       GROUP BY provider
       ORDER BY amount DESC
       LIMIT 5`,
            { type: sequelize.QueryTypes.SELECT }
          ),
        ];

        const [dailyTop, weeklyTop, allTimeTop] = await Promise.all(
          topProviderQueries
        );

        topDepositors = {
          daily: dailyTop.map((d) => ({
            name: d.show_name || d.provider || "Unknown",
            amount: `$${parseFloat(d.amount).toFixed(2)}`,
          })),
          weekly: weeklyTop.map((d) => ({
            name: d.show_name || d.provider || "Unknown",
            amount: `$${parseFloat(d.amount).toFixed(2)}`,
          })),
          allTime: allTimeTop.map((d) => ({
            name: d.show_name || d.provider || "Unknown",
            amount: `$${parseFloat(d.amount).toFixed(2)}`,
          })),
        };
      }

      console.log(depositGraph);
      res.json({
        status: true,
        data: {
          totalAgents, // only included if role is 'admin'
          totalEarning: `$ ${totalEarning}`,
          totalTransaction: `$ ${totalTransaction}`,
          todayTransaction: `$ ${todayTransaction}`,
          totalDeposits: `$ ${totalDeposits}`,
          totalWithdrawals: `$ ${totalWithdrawalsFinal}`,
          todayDeposits: `$ ${todayDeposits}`,
          todayWithdrawals: `$ ${todayWithdrawals}`,
          fees: `$ ${feesfinal}`,
          availableBalance: `$ ${availableBalance}`,
          availablePayout: `$ ${availablePayout}`,
          lifetimeEarnings: `$ ${lifetimeEarnings}`,
          depositGraph,
          topDepositors,
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  getAllSettings: async (req, res) => {
    try {
      const settings = await Setting.findAll();
      res.json({
        status: true,
        settings,
      });
    } catch (error) {
      console.error("Get all settings error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },

  editSetting: async (req, res) => {
    try {
      const { id, address } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          error: "Setting ID is required",
        });
      }

      const setting = await Setting.findByPk(id);
      if (!setting) {
        return res.status(404).json({
          status: false,
          error: "Setting not found",
        });
      }

      setting.address = address || setting.address;

      await setting.save();

      res.json({
        status: true,
        message: "Setting updated successfully",
        setting,
      });
    } catch (error) {
      console.error("Edit setting error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },

  createSetting: async (req, res) => {
    try {
      const { type } = req.body;
      const file = req.file;

      if (!type) {
        return res.status(400).json({
          status: false,
          error: "Setting type is required",
        });
      }

      let logo = null;
      if (file) {
        const serverUrl = `${req.protocol}://${req.get("host")}`;
        logo = `${serverUrl}/uploads/${file.filename}`;
      }

      let setting = await Setting.findOne({ where: { type } });

      if (!setting) {
        setting = await Setting.create({
          type,
          logo,
        });
      } else {
        if (logo) {
          setting.logo = logo;
          await setting.save();
        }
      }

      res.json({
        status: true,
        message: setting._options.isNewRecord
          ? "Setting created successfully"
          : logo
          ? "Logo updated successfully"
          : "No changes made",
        setting,
      });
    } catch (error) {
      console.error("Setting error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },
};
module.exports = adminController;
