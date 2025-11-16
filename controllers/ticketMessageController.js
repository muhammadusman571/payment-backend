const { TicketMessage, Ticket, Admin } = require('../models');
const path = require('path');

const ticketMessageController = {
  reply: async (req, res) => {
    try {
      const { ticket_id, message, sender_role, sender_id } = req.body;
      const file = req.file;

      if (!ticket_id || !message || !sender_role) {
        return res.status(400).json({ status: false, error: 'All fields are required' });
      }

      const agent = await Admin.findOne({ where: { id: sender_id } });
      if (!agent) {
        return res.status(404).json({ status: false, message: 'Sender not found' });
     }

     const ticket = await Ticket.findOne({ where: { id: ticket_id } });
      if (!ticket) {
        return res.status(404).json({ status: false, message: 'Ticket not found' });
     }

     let attachmentUrl = null;
         if (file) {
           const ext = path.extname(file.originalname).toLowerCase();
           const allowedImageTypes = ['.jpg', '.jpeg', '.png'];
     
           if (!allowedImageTypes.includes(ext)) {
             return res.status(400).json({ status: false, error: 'Only image files (jpg, jpeg, png) are allowed' });
           }
     
           attachmentUrl = `/uploads/${file.filename}`;
         }

      const reply = await TicketMessage.create({
        ticket_id,
        message,
        sender_role,
        attachment_url: attachmentUrl,
        sender_id
      });

      res.status(201).json({ status: true, message: 'Reply added', data: reply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Internal server error' });
    }
  },

  list: async (req, res) => {
    try {
      const { ticket_id } = req.params;

      const ticket = await Ticket.findOne({ where: { id: ticket_id } });
      if (!ticket) {
        return res.status(404).json({ status: false, message: 'Ticket not found' });
     }

      const messages = await TicketMessage.findAll({
        where: { ticket_id },
        order: [['created_at', 'ASC']],
        include: [
          {
            model: Admin,
            attributes: ['id', 'name'],
            as: 'Sender'
          }
        ]
      });

      res.json({ status: true, messages });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Internal server error' });
    }
  }
};

module.exports = ticketMessageController;
