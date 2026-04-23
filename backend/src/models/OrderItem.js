const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at time of purchase',
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Snapshot of product name',
  },
  product_image: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Snapshot of product image',
  },
}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
});

module.exports = OrderItem;
