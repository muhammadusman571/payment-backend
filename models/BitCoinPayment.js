const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Game = require("./Game");
const Admin = require("./Admin");

const BitCoinPayment = sequelize.define(
  "BitCoinPayment",
  {
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address: DataTypes.STRING,
    privateKey: DataTypes.STRING,
    username: DataTypes.STRING,
    rates: DataTypes.STRING,
    credits: DataTypes.STRING,
    qrUrl: DataTypes.STRING,
    amount: DataTypes.DECIMAL(10, 2),
  },
  {
    tableName: "bit_coin_payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);
BitCoinPayment.belongsTo(Admin, { foreignKey: "agent_id", as: "agent" });
BitCoinPayment.belongsTo(Game, { foreignKey: "game_id", as: "game" });

module.exports = BitCoinPayment;
