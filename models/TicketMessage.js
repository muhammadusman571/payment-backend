const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TicketMessage = sequelize.define('TicketMessage', {
  ticket_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  sender_role: {
    type: DataTypes.ENUM('agent', 'admin'),
    allowNull: false
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admins', 
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachment_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attachment_type: {
    type: DataTypes.ENUM('image', 'document'),
    default: 'image',
    allowNull: true
  }
}, {
  tableName: 'ticket_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

TicketMessage.associate = (models) => {
  TicketMessage.belongsTo(models.Ticket, { foreignKey: 'ticket_id' });
  TicketMessage.belongsTo(models.Admin, { foreignKey: 'sender_id', as: "Sender" });
};

module.exports = TicketMessage;
