const { Game } = require('../models');

const gameSelectedBasedAgentController = {
  // add: async (req, res) => {
  //   try {
  //     const { name, status } = req.body;

  //     if (!name) {
  //       return res.status(400).json({ status: false, error: 'Name is required' });
  //     }

  //     const game = await Game.create({ name, status });
  //     res.status(201).json({ status: true, message: 'Game added', game });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ status: false, error: 'Internal server error' });
  //   }
  // },

  details: async (req, res) => {
    try {

      const { id } = req.body;
      if (!id) {
        return res.status(400).json({
          status: false,
          error: 'Game is required'
        });
      }
      const game = await Game.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!game) {
        return res.status(404).json({
          status: false,
          error: 'Game not found'
        });
      }

      res.json({
        status: true,
        game
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        status: false,
        error: 'Internal server error'
      });
    }
  },
  

  list: async (req, res) => {
    try {
      const games = await Game.findAll();
      res.json({ status: true, games });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: 'Internal server error' });
    }
  },

  edit: async (req, res) => {
    try {
      const { id, name, status } = req.body;

      const game = await Game.findByPk(id);
      if (!game) return res.status(404).json({ status: false, error: 'Game not found' });

      await game.update({ name, status });
      res.json({ status: true, message: 'Game updated', game });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: 'Internal server error' });
    }
  },

  // delete: async (req, res) => {
  //   try {
  //     const { id } = req.body;

  //     const game = await Game.findByPk(id);
  //     if (!game) return res.status(404).json({ status: false, error: 'Game not found' });

  //     await game.destroy();
  //     res.json({ status: true, message: 'Game deleted' });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ status: false, error: 'Internal server error' });
  //   }
  // },
  
};



module.exports = gameController;
