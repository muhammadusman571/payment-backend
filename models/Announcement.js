const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Announcement = sequelize.define(
  "Announcement",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    target_role: {
      type: DataTypes.ENUM("agent", "admin", "all"),
      defaultValue: "agent",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    agents: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
    },
  },
  {
    tableName: "announcements",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Announcement;
