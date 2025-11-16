const { Admin, Ticket, TicketMessage } = require('../models');
const path = require('path');
const fs = require('fs');

const ticketController = {
  create: async (req, res) => {
    try {
      const { subject, message,  agent_id } = req.body;
      const file = req.file;

      if (!subject || !message || !agent_id) {
        return res.status(400).json({ status: false, message: 'All fields are required' });
      }

      const agent = await Admin.findOne({ where: { id: agent_id } });
      if (!agent) {
        return res.status(404).json({ status: false, message: 'Agent not found' });
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

      const ticket = await Ticket.create({ subject, agent_id });
      

      await TicketMessage.create({
        ticket_id: ticket.id,
        message,
        sender_role: 'agent',
        attachment_url: attachmentUrl,
        sender_id: agent_id,
      });

      res.status(201).json({ status: true, message: 'Ticket created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, message: 'Error creating ticket from server!' });
    }
  },

  list: async (req, res) => {
  try {
    const { agent_id } = req.body;

    const whereClause = agent_id ? { agent_id } : {};

    const tickets = await Ticket.findAll({
      where: whereClause,
      include: [
        {
          model: TicketMessage,
          limit: 1,
          separate: true,
          order: [['created_at', 'DESC']],
          attributes: ['message', 'created_at', 'attachment_url']
        },
        {
          model: Admin,
          attributes: ['id', 'name', 'email'],
          as: 'Agent' // Ensure this alias is correct in your associations
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ status: true, tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, error: 'Internal server error' });
  }
}

};

module.exports = ticketController;
