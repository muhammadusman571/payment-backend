const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define(
  "Payment",
  {
    address_id: DataTypes.STRING,
    status: DataTypes.STRING,
    provider: DataTypes.STRING,
    ref_no: DataTypes.STRING,
    game: DataTypes.STRING,
    username: DataTypes.STRING,
    amount: DataTypes.DECIMAL(10, 2),
    fees: DataTypes.DECIMAL(10, 2),
    cashAppfees: DataTypes.DECIMAL(10, 2),
    currency: DataTypes.STRING,
    reference_id: DataTypes.STRING,
    customer_email: DataTypes.STRING,
    payment_id: DataTypes.STRING,
    payment_url: DataTypes.TEXT,
    address_in: DataTypes.TEXT,
    polygon_address_in: DataTypes.TEXT,
    callback_url: DataTypes.TEXT,
    ipn_token: DataTypes.TEXT,
    agent_id: DataTypes.STRING,
    agent_name: DataTypes.STRING,
    show_name: DataTypes.STRING,
    agent_p_id: DataTypes.STRING,
    refNumber: DataTypes.STRING,
    paymentSender: DataTypes.STRING,
    paymentReceived: DataTypes.STRING,
    messageId: DataTypes.TEXT,
    is_manual: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: false, // Prevent null values
      unique: true, // Ensure the identifier is unique
    },
    receivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Payment;
