const { Admin, Query, QueryMessage } = require('../models');
const path = require('path');
const fs = require('fs');
const { sendEmail, generateEmailMessageContent, generateEmailMessageContentAdmin } = require("../utils/notification");

const queryMessageController = {
  // create: async (req, res) => {
  //   try {
  //     const { sender_role, ticket_id, message, sender_id, file } = req.body; // 🟢 file is coming in req.body

  //     if (!sender_id || !ticket_id || !message || !sender_role) {
  //       return res.status(400).json({ status: false, message: 'Missing required fields' });
  //     }
  //     console.log(ticket_id);
  //     const user = await Admin.findOne({ where: { id: sender_id } });
  //     const queryresult = await Query.findOne({ where: { ticket_id: ticket_id } });
  //     const querystatus = queryresult?.status;
  //     const userrole = user?.role;
  //     if (querystatus === 'Closed' || userrole === 'superadmin') {
  //       await Query.update(
  //         { status: 'OnHold' },
  //         { where: { ticket_id } }
  //       );
  //     }

  //     if (!user) {
  //       return res.status(404).json({ status: false, message: 'Agent not found' });
  //     }

  //     let attachment = null;

  //     if (file) {
  //       const matches = file.match(/^data:(image\/\w+);base64,(.+)$/);
  //       if (!matches || matches.length !== 3) {
  //         return res.status(400).json({
  //           status: false,
  //           error: 'Invalid base64 file format',
  //         });
  //       }

  //       const mimeType = matches[1];
  //       const ext = mimeType.split('/')[1];
  //       const base64Data = matches[2];

  //       const allowedTypes = ['jpg', 'jpeg', 'png'];
  //       if (!allowedTypes.includes(ext)) {
  //         return res.status(400).json({
  //           status: false,
  //           error: 'Only image files (jpg, jpeg, png) are allowed',
  //         });
  //       }

  //       // Ensure upload folder exists
  //       const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  //       if (!fs.existsSync(uploadDir)) {
  //         fs.mkdirSync(uploadDir, { recursive: true });
  //       }

  //       const fileName = `ticket_${Date.now()}.${ext}`;
  //       const filePath = path.join(uploadDir, fileName);

  //       fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  //       attachment = `/uploads/${fileName}`;
  //     }

  //     await QueryMessage.create({
  //       ticket_id,
  //       sender_id,
  //       message,
  //       sender_role,
  //       attachment_url: attachment,
  //     });

  //     return res.status(201).json({ status: true, message: 'Ticket created successfully' });

  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({ status: false, message: 'Server error while creating ticket' });
  //   }
  // },

  create: async (req, res) => {
    try {
      const { sender_role, ticket_id, message, sender_id, file } = req.body;

      if (!sender_id || !ticket_id || !message || !sender_role) {
        return res.status(400).json({ status: false, message: 'Missing required fields' });
      }
      
      const messagedetails = message.replace(/\n/g, '<br>');
      
      const user = await Admin.findOne({ where: { id: sender_id } });
      const queryresult = await Query.findOne({ where: { ticket_id: ticket_id } });
      const querystatus = queryresult?.status;
      const userrole = user?.role;

      if (querystatus === 'Closed' || userrole === 'superadmin') {
        await Query.update(
          { status: 'OnHold' },
          { where: { ticket_id } }
        );
      }

      if (!user) {
        return res.status(404).json({ status: false, message: 'Agent not found' });
      }

      let attachment = null;

      if (file) {
        const matches = file.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.status(400).json({
            status: false,
            error: 'Invalid base64 file format',
          });
        }

        const mimeType = matches[1];
        const ext = mimeType.split('/')[1];
        const base64Data = matches[2];

        const allowedTypes = ['jpg', 'jpeg', 'png'];
        if (!allowedTypes.includes(ext)) {
          return res.status(400).json({
            status: false,
            error: 'Only image files (jpg, jpeg, png) are allowed',
          });
        }

        // Ensure upload folder exists
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `ticket_${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        attachment = `/uploads/${fileName}`;
      }

      const querymessagecreate = await QueryMessage.create({
        ticket_id,
        sender_id,
        message:messagedetails,
        sender_role,
        attachment_url: attachment,
      });

      await Query.update(
        { updated_at: new Date() },
        { where: { ticket_id } }
      );
      const usersDetails = await Admin.findOne({
        where: { id: sender_id }
      });
      const AgentName = usersDetails?.name || '';
      const AgentNameEmail = usersDetails?.email || '';

      // const qcontent = {
      //   ticket_id,
      //   sender_id,
      //   message,
      //   sender_role,
      //   name: AgentName,
      //   created_at: querymessagecreate.created_at
      // };
      // const emailContent = generateEmailMessageContent(qcontent);
      // const emailContentAdmin = generateEmailMessageContentAdmin(qcontent);
      // const subject = `Support Ticket Response: [#${ticket_id}]}`;

      // await sendEmail(AgentNameEmail, subject, emailContent);
      // await sendEmail('swipemilky@gmail.com', subject, emailContentAdmin);

      return res.status(201).json({ status: true, message: 'Ticket created successfully' });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: 'Server error while creating ticket' });
    }
  },

  list: async (req, res) => {
    const { ticket_id } = req.body; // 🟢 file is coming in req.body

    try {
      if (!ticket_id) {
        return socket.emit("querymessage:list:response", {
          status: false,
          error: "Ticket ID is required",
        });
      }


      const messages = await QueryMessage.findAll({
        where: { ticket_id },
        include: [
          {
            model: Admin,
            as: 'sender',
          },
        ],
        order: [['created_at', 'DESC']],
      });

      //const QueryMessage = 'tesst';

      res.json({ status: true, messages });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Internal server error' });
    }
  },

  listTicketMessageSocket2: async (socket, ticket_id) => {
    try {
      if (!ticket_id) {
        return socket.emit("querymessage:test", {
          status: false,
          error: "Ticket ID is required",
        });
      }
      const messages = await QueryMessage.findAll({
        where: { ticket_id },
        include: [
          {
            model: Admin,
            as: 'sender',
          },
        ],
        order: [['created_at', 'DESC']],
      });
      socket.emit("querymessage:test", {
        status: true,
        data: messages,
      });

    } catch (error) {
      console.error("Socket Query List Error:", error);
      socket.emit("querymessage:test", {
        status: false,
        error: "Internal server error",
      });
    }
  }
};
module.exports = queryMessageController;