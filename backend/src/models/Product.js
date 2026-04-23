const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'For showing discounts',
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 },
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    comment: 'Array of /uploads/filename paths',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
  },
  review_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
});

module.exports = Product;
