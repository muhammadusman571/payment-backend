const { Op } = require("sequelize");
const { Game, Admin } = require("../models");
const AgentGameRate = require("../models/AgentGameRates");

const gameController = {
  add: async (req, res) => {
    try {
      const { name, status } = req.body;
      const file = req.file;
      let logo;
      if (file) {
        serverUrl = `${req.protocol}://${req.get("host")}`;
        logo = `${serverUrl}/uploads/${file.filename}`;
      }

      if (!name) {
        return res
          .status(400)
          .json({ status: false, error: "Name is required" });
      }

      const game = await Game.create({ name, status, logo });
      res.status(201).json({ status: true, message: "Game added", game });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  details: async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({
          status: false,
          error: "Game is required",
        });
      }
      const game = await Game.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      if (!game) {
        return res.status(404).json({
          status: false,
          error: "Game not found",
        });
      }

      res.json({
        status: true,
        game,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        status: false,
        error: "Internal server error",
      });
    }
  },

  list: async (req, res) => {
    try {
      let { status, search, page, limit } = req.query;

      page = page ? parseInt(page) : null;
      limit = limit ? parseInt(limit) : null;

      const whereClause = {};
      if (status && status !== "all") {
        whereClause.status = status;
      }
      if (search) {
        whereClause.name = { [Op.like]: `%${search}%` };
      }

      let games, totalCount, totalPages;
      if (page && limit) {
        totalCount = await Game.count({ where: whereClause });
        totalPages = Math.ceil(totalCount / limit);
        games = await Game.findAll({
          where: whereClause,
          offset: (page - 1) * limit,
          limit: limit,
        });
      } else {
        games = await Game.findAll({ where: whereClause });
        totalCount = games.length;
        totalPages = 1;
      }

      res.json({
        status: true,
        message: "games fetched",
        games,
        totalPages,
        totalCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
  edit: async (req, res) => {
    try {
      const { id, name, status } = req.body;

      const file = req.file;

      const game = await Game.findByPk(id);
      if (!game)
        return res.status(404).json({ status: false, error: "Game not found" });

      let logo = game.logo;
      if (file) {
        serverUrl = `${req.protocol}://${req.get("host")}`;
        logo = `${serverUrl}/uploads/${file.filename}`;
      }

      await game.update({ name, status, logo });
      res.json({ status: true, message: "Game updated", game });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.body;

      const game = await Game.findByPk(id);
      if (!game)
        return res.status(404).json({ status: false, error: "Game not found" });

      await game.destroy();
      res.json({ status: true, message: "Game deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  changeGameStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const game = await Game.findByPk(id);

      if (!game) {
        return res
          .status(404)
          .json({ status: false, message: "Game not found" });
      }

      game.status = status;

      await game.save();

      return res.status(200).json({
        status: true,
        message: "Status updated successfully",
        game,
      });
    } catch (err) {
      console.error("Error updating status:", err);
      res.status(500).json({ status: false, error: err.message });
    }
  },

  showActiveGames: async (req, res) => {
    try {
      const games = await Game.findAll({
        where: { status: 1 },
      });
      res.json({ status: true, games });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },

  rateList: async (req, res) => {
    try {
      const search = req.query.search || "";
      const gameSearch = req.query.gameSearch || "";
      const page = parseInt(req.query.page) || 1;
      const rowsPerPage = parseInt(req.query.limit) || 13;

      const { count, rows: agents } = await Admin.findAndCountAll({
        where: {
          status: "active",
          name: { [Op.like]: `%${search}%` },
        },
        attributes: ["id", "name", "email", "status"],
        order: [["name", "ASC"]],
        offset: (page - 1) * rowsPerPage,
        limit: rowsPerPage,
      });

      const games = await Game.findAll({
        where: {
          status: "1",
          name: { [Op.like]: `%${gameSearch}%` },
        },
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
      });

      const agentIds = agents.map((a) => a.id);
      const ratesRaw = await AgentGameRate.findAll({
        where: { agent_id: agentIds },
        attributes: ["agent_id", "game_id", "percentage"],
      });

      const rates = {};
      ratesRaw.forEach((r) => {
        if (!rates[r.agent_id]) rates[r.agent_id] = {};
        rates[r.agent_id][r.game_id] = Number(r.percentage);
      });

      res.json({
        agents,
        games,
        rates,
        totalAgents: count,
        currentPage: page,
        totalPages: Math.ceil(count / rowsPerPage),
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch rate list" });
    }
  },
  rateListById: async (req, res) => {
    try {
      console.log(req.admin);
      const agent_id = req.admin.id;

      const data = await AgentGameRate.findAll({
        where: { agent_id },
        attributes: ["agent_id", "game_id", "percentage"],
      });

      res.json({
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch rate list" });
    }
  },
  updateRateList: async (req, res) => {
    try {
      const { agent_id, game_id, percentage } = req.body;

      if (!agent_id || !game_id || percentage == null) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const numericValue = Number(percentage);
      if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
        return res.status(400).json({ message: "Percentage must be 0-100" });
      }

      const [rate, created] = await AgentGameRate.upsert(
        {
          agent_id,
          game_id,
          percentage: numericValue,
        },
        { returning: true }
      );

      res.json({
        message: created
          ? "Rate created successfully"
          : "Rate updated successfully",
        rate,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch rate list" });
    }
  },

  agentRateList: async (req, res) => {
    try {
      const agent_id = req.admin.id;
      let { search, page, limit } = req.query;

      page = page ? parseInt(page) : null;
      limit = limit ? parseInt(limit) : null;

      const whereClause = {
        status: "1",
      };

      if (search) {
        whereClause.name = { [Op.like]: `%${search}%` };
      }

      let games, totalCount, totalPages;
      if (page && limit) {
        console.log(whereClause);
        totalCount = await Game.count({ where: whereClause });
        totalPages = Math.ceil(totalCount / limit);
        games = await Game.findAll({
          where: whereClause,
          offset: (page - 1) * limit,
          limit: limit,
        });
      } else {
        games = await Game.findAll({ where: whereClause });
        totalCount = games.length;
        totalPages = 1;
      }

      // fetch percentages for given agent
      let agentRates = [];
      if (agent_id) {
        agentRates = await AgentGameRate.findAll({
          where: { agent_id },
        });
      }

      const gamesWithPercentage = games.map((game) => {
        const rate = agentRates.find((r) => r.game_id === game.id);
        return {
          ...game.toJSON(),
          percentage: rate ? rate.percentage : 0,
        };
      });

      res.json({
        status: true,
        message: "active games fetched",
        games: gamesWithPercentage,
        totalPages,
        totalCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: "Internal server error" });
    }
  },
};

module.exports = gameController;
