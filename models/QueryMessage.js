const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QueryMessage = sequelize.define('QueryMessage', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  ticket_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachment_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sender_role: {
    type: DataTypes.ENUM('agent', 'admin'),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'query_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

QueryMessage.associate = (models) => {
  QueryMessage.belongsTo(models.Admin, { foreignKey: 'sender_id', as: 'sender' });
};

module.exports = QueryMessage;
