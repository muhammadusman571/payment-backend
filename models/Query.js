const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Query = sequelize.define('Query', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  ticket_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    },
  },
  department: { type: DataTypes.STRING, allowNull: true },
  query_subject: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM("Created", "OnHold", "Closed"),
    allowNull: false,
    defaultValue: "Created"
  },
  attachment: { type: DataTypes.STRING, allowNull: true },
  details: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'queries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Query.associate = (models) => {
  Query.belongsTo(models.Admin, { foreignKey: 'agent_id', as: 'agent' });
};

module.exports = Query;
