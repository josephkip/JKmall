const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'paid',
      'processing',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ),
    defaultValue: 'pending',
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  delivery_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 150.00,
    comment: 'KES',
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  delivery_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  delivery_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  delivery_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancelled_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
});

module.exports = Order;
