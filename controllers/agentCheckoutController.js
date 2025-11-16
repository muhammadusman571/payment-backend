const { Admin } = require('../models');


const agentCheckoutController = {

  addOrUpdate: async (req, res) => {
    try {
      const { id, agent_title, agent_description } = req.body;

    // Validation
      if (!agent_title) {
        return res.status(400).json({ status: false, error: 'Agent title is required.' });
      }

      let result;
      if (id) {
      // Try to find the existing admin record
        const admin = await Admin.findByPk(id);
        if (!admin) {
          return res.status(404).json({ status: false, error: 'Admin not found' });
        }
      // Update existing record
        await admin.update({ agent_title, agent_description });
        result = {
          status: true,
          message: 'Admin updated successfully.',
          data: admin
        };

      } else {
      // Create new admin record
        const newAdmin = await Admin.create({ agent_title, agent_description });
        result = {
          status: true,
          message: 'Admin created successfully.',
          data: newAdmin
        };
      }
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in addOrUpdate:', error);
      return res.status(500).json({
        status: false,
        error: 'Internal server error'
      });
    }
  },

 list: async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({ status: false, error: 'Admin not found' });
    }

    res.json({ status: true, data: admin });

  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ status: false, error: 'Internal server error' });
  }
}



};

module.exports = agentCheckoutController;