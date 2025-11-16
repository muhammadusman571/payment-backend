const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AgentGameRate = sequelize.define(
  "AgentGameRate",
  {
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "agent_game_rates",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["agent_id", "game_id"],
      },
    ],
  }
);

// Associations
AgentGameRate.associate = (models) => {
  AgentGameRate.belongsTo(models.Admin, { foreignKey: "agent_id" });
  AgentGameRate.belongsTo(models.Game, { foreignKey: "game_id" });
};

module.exports = AgentGameRate;
