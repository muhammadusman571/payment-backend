const sequelize = require("../config/db");
const { Admin, Announcement } = require("../models");

const announcementController = {
  create: async (req, res) => {
    try {
      const { title, message, created_by } = req.body;

      if (!title || !message || !created_by) {
        return res
          .status(400)
          .json({ status: false, message: "All fields are required" });
      }

      const creator = await Admin.findByPk(created_by);
      if (!creator || creator.role !== "superadmin") {
        return res.status(403).json({
          status: false,
          message: "Only superadmins can create announcements",
        });
      }

      const announcement = await Announcement.create({
        title,
        message,
        created_by,
        target_role: "agent",
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("announcement:agent", announcement);
      }

      return res.status(201).json({
        status: true,
        message: "Announcement created and sent to agents successfully",
        data: announcement,
      });
    } catch (err) {
      console.error("Error creating announcement:", err);
      return res
        .status(500)
        .json({ status: false, message: "Internal server error" });
    }
  },
  getAll: async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;

      page = parseInt(page);
      limit = parseInt(limit);
      console.log("role", req?.admin?.role);

      const offset = (page - 1) * limit;

      const { count, rows } = await Announcement.findAndCountAll({
        order: [["created_at", "DESC"]],
        offset,
        limit,
      });
      if (req?.admin?.role === "agent") {
        const agentId = req.admin.id;
        //       const res = await sequelize.query(
        //         `UPDATE announcements
        //  SET agents = JSON_ARRAY_APPEND(agents, '$', :agentId)
        //  WHERE (NOT JSON_CONTAINS(agents, JSON_ARRAY(:agentId)) OR agents IS NULL)`,
        //         {
        //           replacements: { agentId },
        //           type: sequelize.QueryTypes.UPDATE,
        //         }
        //       );
        //     }
        const res = await sequelize.query(
          `UPDATE announcements
   SET agents = JSON_ARRAY_APPEND(COALESCE(agents, JSON_ARRAY()), '$', :agentId)
   WHERE NOT JSON_CONTAINS(COALESCE(agents, JSON_ARRAY()), JSON_ARRAY(:agentId))`,
          {
            replacements: { agentId },
            type: sequelize.QueryTypes.UPDATE,
          }
        );
      }

      return res.status(200).json({
        status: true,
        message: "Announcements fetched successfully",
        data: rows,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      console.error("Error fetching announcements:", err);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },

  edit: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, message } = req.body;

      if (!title || !message || !id) {
        return res.status(400).json({
          status: false,
          message: "All fields are required",
        });
      }

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          status: false,
          message: "Announcement not found",
        });
      }

      await announcement.update({
        title,
        message,
      });

      return res.status(200).json({
        status: true,
        message: "Announcement updated successfully",
        data: announcement,
      });
    } catch (err) {
      console.error("Error updating announcement:", err);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          status: false,
          message: "Announcement not found",
        });
      }

      await announcement.destroy();

      const io = req.app.get("io");
      if (io) {
        io.emit("announcement:agent:delete", { id: announcement.id });
      }

      return res.status(200).json({
        status: true,
        message: "Announcement deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting announcement:", err);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
};

module.exports = announcementController;
