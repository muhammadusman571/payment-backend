const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10, // Maximum number of connections in pool
      min: 1, // Minimum number of connections in pool
      acquire: 600000, // Time (in ms) to wait for a connection before throwing an error
      idle: 100000, // Time (in ms) before a connection is considered idle
    },
  }
);

module.exports = sequelize;
