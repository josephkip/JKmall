const { Op, fn, col, literal } = require('sequelize');
const { Order, User, Product, Payment, Category, sequelize } = require('../models');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total orders
    const totalOrders = await Order.count();
    const todayOrders = await Order.count({ where: { created_at: { [Op.gte]: startOfDay } } });
    const monthOrders = await Order.count({ where: { created_at: { [Op.gte]: startOfMonth } } });

    // Revenue
    const totalRevenue = await Order.sum('total_amount', { where: { status: { [Op.ne]: 'cancelled' } } });
    const monthRevenue = await Order.sum('total_amount', {
      where: { status: { [Op.ne]: 'cancelled' }, created_at: { [Op.gte]: startOfMonth } },
    });

    // Users
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    const totalRiders = await User.count({ where: { role: 'rider' } });

    // Products
    const totalProducts = await Product.count({ where: { is_active: true } });
    const lowStockProducts = await Product.count({ where: { stock: { [Op.lte]: 5 }, is_active: true } });

    // Orders by status
    const ordersByStatus = await Order.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    // Revenue last 7 days
    const last7Days = await Order.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('COUNT', col('id')), 'orders'],
      ],
      where: {
        created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: { [Op.ne]: 'cancelled' },
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Top products
    const topProducts = await Product.findAll({
      attributes: ['id', 'name', 'price', 'images'],
      order: [['review_count', 'DESC']],
      limit: 5,
    });

    // Recent orders
    const recentOrders = await Order.findAll({
      include: [{ model: User, as: 'customer', attributes: ['name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          todayOrders,
          monthOrders,
          totalRevenue: totalRevenue || 0,
          monthRevenue: monthRevenue || 0,
          totalCustomers,
          totalRiders,
          totalProducts,
          lowStockProducts,
        },
        ordersByStatus,
        revenueChart: last7Days,
        topProducts,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true,
      data: { users: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) } },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { role, is_active } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    await user.update(updates);
    res.json({ success: true, message: 'User updated', data: user });
  } catch (err) {
    next(err);
  }
};
