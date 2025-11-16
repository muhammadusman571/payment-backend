const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Game = sequelize.define(
  "Game",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("1", "0"),
      defaultValue: "1",
    },
  },
  {
    tableName: "games",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Game;
