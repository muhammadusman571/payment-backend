const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QueryLog = sequelize.define('QueryLog', {
   ticket_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    changed_by: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'query_logs', // or whatever your table name is
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

module.exports = QueryLog;
