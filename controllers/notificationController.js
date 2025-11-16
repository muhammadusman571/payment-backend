const sequelize = require("../config/db");
const { Notification } = require("../models");
let n = 0;
const notificationController = {
  getUnreadCount: async (req, res) => {
    try {
      let whereCondition = {};
      let announcementCount = 0;
      if (req?.admin?.role === "agent") {
        const [results] = await sequelize.query(
          `SELECT COUNT(*) AS total FROM announcements
         WHERE (NOT JSON_CONTAINS(agents, JSON_ARRAY(:agentId)) OR agents IS NULL)
         AND status = 'active'`,
          {
            replacements: { agentId: req.admin.id },
          }
        );
        announcementCount = results[0].total;
      }
      if (req?.admin?.role === "agent") {
        whereCondition = {
          user_id: req.admin.id, // assuming the agent's ID is in req.admin.id
          is_read: false,
        };
      } else {
        whereCondition = {
          role: "superadmin",
          is_read: false,
        };
      }

      const count = await Notification.count({
        where: whereCondition,
      });

      res.status(200).json({
        status: true,
        message: "Data found",
        count: count,
        announcementCount,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: false,
        message: "Error from server!",
      });
    }
  },
  getNotification: async (req, res) => {
    try {
      console.log("here");
      let whereCondition = {};

      if (req?.admin?.role === "agent") {
        whereCondition = {
          user_id: req.admin.id,
        };
      } else {
        whereCondition = {
          role: "superadmin",
        };
      }

      const response = await Notification.findAll({
        where: whereCondition,
        order: [["created_at", "DESC"]], // 👈 Sort by created_at descending
      });

      res.status(200).json({
        status: true,
        message: "Data found",
        data: response,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: false,
        message: "Error from server!",
      });
    }
  },
  notificationMarkAllRead: async (req, res) => {
    try {
      console.log("here");
      let whereCondition = {};

      if (req?.admin?.role === "agent") {
        whereCondition = {
          user_id: req.admin.id,
          is_read: false,
        };
      } else {
        whereCondition = {
          role: "superadmin",
          is_read: false,
        };
      }

      const response = await Notification.update(
        { is_read: true }, // ✅ Data to update
        { where: whereCondition } // ✅ Where condition
      );

      res.status(200).json({
        status: true,
        message: "All notifications marked as read.",
        data: response,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: false,
        message: "Error from server!",
      });
    }
  },
  createNotification: async (message, type, role, user_id) => {
    try {
      console.log("here", message, type, role, user_id);
      await Notification.create({
        message,
        type,
        role,
        user_id,
      });
    } catch (err) {
      console.error(err);
    }
  },
};

module.exports = notificationController;
