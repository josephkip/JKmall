const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Phone number used for M-Pesa',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  mpesa_checkout_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'CheckoutRequestID from STK Push',
  },
  mpesa_merchant_request_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'MerchantRequestID from STK Push',
  },
  mpesa_receipt: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'M-Pesa receipt number after success',
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  result_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  result_desc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

module.exports = Payment;
