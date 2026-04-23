const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Delivery = require('./Delivery');

// ── Associations ────────────────────────────────────────────────────────────

// Category ↔ Product
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// User ↔ Order
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'customer' });

// Order ↔ OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product ↔ OrderItem
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order ↔ Payment
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Order ↔ Delivery
Order.hasOne(Delivery, { foreignKey: 'order_id', as: 'delivery' });
Delivery.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User (rider) ↔ Delivery
User.hasMany(Delivery, { foreignKey: 'rider_id', as: 'deliveries' });
Delivery.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Order,
  OrderItem,
  Payment,
  Delivery,
};
