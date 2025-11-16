const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ticket = sequelize.define('Ticket', {
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open'
  }
}, {
  tableName: 'tickets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Ticket.associate = (models) => {
  Ticket.belongsTo(models.Admin, { foreignKey: 'agent_id', as: 'Agent' });
  Ticket.hasMany(models.TicketMessage, { foreignKey: 'ticket_id' });
};

module.exports = Ticket;
