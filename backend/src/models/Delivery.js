const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  rider_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Assigned boda-boda rider',
  },
  status: {
    type: DataTypes.ENUM('assigned', 'picked_up', 'in_transit', 'delivered'),
    defaultValue: 'assigned',
  },
  current_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'Live GPS latitude from rider',
  },
  current_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'Live GPS longitude from rider',
  },
  pickup_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  pickup_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  estimated_arrival: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'deliveries',
  timestamps: true,
  underscored: true,
});

module.exports = Delivery;
