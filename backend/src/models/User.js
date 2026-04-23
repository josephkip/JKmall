const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [2, 100] },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^(\+254|0)[17]\d{8}$/,
    },
  },
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('customer', 'admin', 'rider'),
    defaultValue: 'customer',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;
