const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { Admin, Query, QueryLog } = require("../models");
const upload = multer({ dest: "uploads/" });

const {
  sendEmail,
  generateEmailContent,
  generateEmailContentAdmin,
  generateEmailTicketClose,
} = require("../utils/notification");
const { where } = require("sequelize");
const { name } = require("ejs");
const { sendTicketEmail } = require("../utils/mailer");

const queryController = {
  // add: async (req, res) => {
  //   try {
  //     const { department, query_subject, details, agent_id, file, ticket_id } = req.body;
  //     let attachment = null;
  //     if (file) {
  //       const matches = file.match(/^data:(image\/\w+);base64,(.+)$/);
  //       if (!matches || matches.length !== 3) {
  //         return res.status(400).json({
  //           status: false,
  //           error: "Invalid base64 file format",
  //         });
  //       }
  //       const mimeType = matches[1];
  //       const ext = mimeType.split("/")[1];
  //       const base64Data = matches[2];
  //       const allowedTypes = ["jpg", "jpeg", "png"];
  //       if (!allowedTypes.includes(ext)) {
  //         return res.status(400).json({
  //           status: false,
  //           error: "Only image files (jpg, jpeg, png) are allowed",
  //         });
  //       }
  //       const fileName = `ticket_${Date.now()}.${ext}`;
  //       const filePath = path.join(__dirname, "..", "public", "uploads", fileName);
  //       // Save file
  //       fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
  //       attachment = `/uploads/${fileName}`;
  //     }

  //     const query = await Query.create({
  //       ticket_id,
  //       agent_id,
  //       department,
  //       query_subject,
  //       details,
  //       attachment,
  //     });

  //     const queryLog = await QueryLog.create({
  //       ticket_id: ticket_id,
  //       status: "created",
  //       remarks: details,
  //       changed_by: agent_id,
  //     });

  //     res.status(201).json({
  //       status: true,
  //       message: "Ticket added successfully",
  //       query,
  //     });
  //   } catch (error) {
  //     console.error("Add Ticket Error:", error);
  //     res.status(500).json({ status: false, error: "Internal server error" });
  //   }
  // },

  add: async (req, res) => {
    try {
      const { department, query_subject, details, agent_id, file, ticket_id } =
        req.body;
      const detailsStoreinformat = details.replace(/\n/g, "<br>");

      let attachment = null;
      if (file) {
        const matches = file.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.status(400).json({
            status: false,
            error: "Invalid base64 file format",
          });
        }
        const mimeType = matches[1];
        const ext = mimeType.split("/")[1];
        const base64Data = matches[2];
        const allowedTypes = ["jpg", "jpeg", "png"];
        if (!allowedTypes.includes(ext)) {
          return res.status(400).json({
            status: false,
            error: "Only image files (jpg, jpeg, png) are allowed",
          });
        }
        const fileName = `ticket_${Date.now()}.${ext}`;
        const filePath = path.join(
          __dirname,
          "..",
          "public",
          "uploads",
          fileName
        );
        // Save file
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        attachment = `/uploads/${fileName}`;
      }

      const query = await Query.create({
        ticket_id,
        agent_id,
        department,
        query_subject,
        details: detailsStoreinformat,
        attachment,
      });

      // const queryLog = await QueryLog.create({
      //   ticket_id: ticket_id,
      //   status: "created",
      //   remarks: details,
      //   changed_by: agent_id,
      // });

      const usersDetails = await Admin.findOne({
        where: { id: agent_id },
      });
      const AgentName = usersDetails?.name || "";
      const AgentNameEmail = usersDetails?.email || "";

      const qcontent = {
        ticket_id,
        agent_id,
        department,
        query_subject,
        details,
        name: AgentName,
        created_at: query.created_at,
      };

      const emailContent = generateEmailContent(qcontent);
      const emailContentAdmin = generateEmailContentAdmin(qcontent);
      const subject = `Support Ticket Received: [#${ticket_id}] – ${query_subject}`;

      await sendTicketEmail(AgentNameEmail, subject, emailContent, true);
      // await sendEmail("swipemilky@gmail.com", subject, emailContentAdmin);

      res.status(201).json({
        status: true,
        message: "Ticket added successfully",
        query,
      });
    } catch (error) {
      console.error("Add Ticket Error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  list: async (req, res) => {
    try {
      // const queries = await Query.findAll({
      //   order: [['created_at', 'DESC']]
      // });

      const queryWithAgent = await Query.findAll({
        include: [
          {
            model: Admin,
            as: "agent",
          },
        ],
      });
      res.status(200).json({ status: true, data: queryWithAgent });
    } catch (error) {
      console.error("List Ticket Error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
  listSocket: async (socket, id, role) => {
    try {
      // Filters for payments
      const paymentFilter = role === "agent" ? { agent_id: id } : {};
      //  const CreatedTicketCount = await Query.count({
      //   where: { status: 'Created' },
      //    ...paymentFilter
      // });

      const queries = await Query.findAll({
        where: paymentFilter, // Your filtering condition
        include: [
          {
            model: Admin,
            as: "agent",
          },
        ],
        order: [["updated_at", "DESC"]],
        //order: [['created_at', 'ASC'], ['updated_at', 'DESC']]
      });

      // const queries = await Query.findAll({
      //   where: paymentFilter,
      //   order: [['created_at', 'DESC']]
      // });

      const CreatedTicketCount = await Query.count({
        where: {
          status: "Created",
          ...paymentFilter,
        },
      });
      const OnHoldTicketCount = await Query.count({
        where: {
          status: "OnHold",
          ...paymentFilter,
        },
      });
      const ClosedTicketCount = await Query.count({
        where: {
          status: "Closed",
          ...paymentFilter,
        },
      });
      socket.emit("query:list:response", {
        status: true,
        data: queries,
        created: CreatedTicketCount,
        hold: OnHoldTicketCount,
        Closed: ClosedTicketCount,
      });
    } catch (error) {
      console.error("Socket Query List Error:", error);
      socket.emit("query:list:response", {
        status: false,
        error: "Internal server error",
      });
    }
  },

  listById: async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, error: "Ticket ID is required" });
      }
      const queries = await Query.findAll({
        where: { agent_id: id },
        order: [["created_at", "DESC"]],
      });
      //const queries = await query.findAll({ order: [['created_at', 'DESC']] }); // get all in order
      res.status(200).json({ status: true, data: queries });
    } catch (error) {
      console.error("List Ticket Error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  listByIdOnly: async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, error: "Ticket ID is required" });
      }
      const query = await Query.findOne({
        where: { id },
        raw: true,
      });
      const ticket_id = query.ticket_id;
      const queryLog = await QueryLog.findAll({
        where: { ticket_id: ticket_id },
        raw: true,
      });
      res.status(200).json({ status: true, data: query, queryLog: queryLog });
    } catch (error) {
      console.error("List Ticket Error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
  edit: async (req, res) => {
    try {
      const { id, department, query_subject, query_type, attachment, details } =
        req.body;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, error: "Ticket ID is required" });
      }
      const query = await Query.findByPk(id);
      if (!query) {
        return res
          .status(404)
          .json({ status: false, error: "Ticket not found" });
      }
      await query.update({
        department,
        query_subject,
        query_type,
        attachment,
        details,
      });

      //  const queryLog = await QueryLog.create({
      //   query.ticket_id,
      //   status: 'updated',
      //   remarks: details,
      //   changed_by: agent_id
      // });

      res.status(200).json({
        status: true,
        message: "Ticket successfully updated",
        data: query,
      });
    } catch (error) {
      console.error("Edit Ticket Error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, error: "Ticket ID is required" });
      }
      const query = await Query.findByPk(id);
      if (!query) {
        return res
          .status(404)
          .json({ status: false, error: "Ticket not found" });
      }
      await query.destroy();
      res.status(200).json({
        status: true,
        message: "Ticket successfully deleted",
      });
    } catch (error) {
      console.error("Delete Ticket Error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
  listByTicketId: async (req, res) => {
    try {
      const { ticket_id } = req.body;
      if (!ticket_id) {
        return res
          .status(400)
          .json({ status: false, error: "Ticket ID is required" });
      }
      const query = await Query.findOne({
        where: { ticket_id: ticket_id },
        include: [
          {
            model: Admin,
            as: "agent",
          },
        ],
      });

      res.status(200).json({ status: true, data: query });
    } catch (error) {
      console.error("List Ticket Error:", error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
  close: async (req, res) => {
    try {
      const { ticket_id } = req.body;
      if (!ticket_id) {
        return res
          .status(400)
          .json({ status: false, error: "Ticket ID is required" });
      }
      await Query.update(
        { status: "Closed" }, // fields to update
        { where: { ticket_id } } // condition
      );
      const usersDetails = await Admin.findOne({
        where: { id: agent_id },
      });
      const AgentName = usersDetails?.name || "";
      const AgentNameEmail = usersDetails?.email || "";

      const qcontent = {
        ticket_id,
        agent_id,
        name: AgentName,
      };

      const emailContent = generateEmailTicketClose(qcontent);
      const subject = `Support Ticket Closed: [#${ticket_id}]`;
      await sendTicketEmail(AgentNameEmail, subject, emailContent);

      res
        .status(200)
        .json({ status: true, message: "Ticket successfully Closed" });
    } catch (error) {
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
};
module.exports = queryController;
