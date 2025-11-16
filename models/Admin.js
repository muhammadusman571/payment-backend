const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");

const Admin = sequelize.define(
  "Admin",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    ref_id: { type: DataTypes.STRING },
    agent_id: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    mobile: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: "admin" },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    agent_title: { type: DataTypes.STRING, allowNull: true },
    agent_description: { type: DataTypes.TEXT, allowNull: true },
    passwordUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "admins",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Admin.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

Admin.associate = function (models) {
  Admin.hasMany(models.Query, {
    foreignKey: "agent_id",
    as: "queries",
  });

  Admin.hasMany(models.QueryMessage, {
    foreignKey: "sender_id",
    as: "sent_messages",
  });
};

module.exports = Admin;
