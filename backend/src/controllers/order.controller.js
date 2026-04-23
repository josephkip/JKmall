const { Op, fn, col, literal } = require('sequelize');
const { Order, OrderItem, Product, User, Payment, Delivery, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

const generateOrderNumber = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `JKM-${ts}${rand}`;
};

// POST /api/orders
exports.createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { items, delivery_address, delivery_lat, delivery_lng, delivery_notes } = req.body;

    if (!items || !items.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    // Validate products and stock
    let subtotal = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product || !product.is_active) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Product not found: ${item.product_id}` });
      }
      if (product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        });
      }
      subtotal += parseFloat(product.price) * item.quantity;
      enrichedItems.push({ product, quantity: item.quantity });
    }

    const delivery_fee = 150;
    const total_amount = subtotal + delivery_fee;

    // Create order
    const order = await Order.create({
      order_number: generateOrderNumber(),
      user_id: req.user.id,
      total_amount,
      delivery_fee,
      delivery_address,
      delivery_lat,
      delivery_lng,
      delivery_notes,
    }, { transaction: t });

    // Create order items and deduct stock
    for (const { product, quantity } of enrichedItems) {
      await OrderItem.create({
        order_id: order.id,
        product_id: product.id,
        quantity,
        unit_price: product.price,
        product_name: product.name,
        product_image: product.images[0] || null,
      }, { transaction: t });

      await product.decrement('stock', { by: quantity, transaction: t });
    }

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });

    res.status(201).json({ success: true, message: 'Order created', data: fullOrder });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Order.findAndCountAll({
      where: { user_id: req.user.id },
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment', attributes: ['status', 'mpesa_receipt', 'paid_at'] },
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['status', 'current_lat', 'current_lng', 'estimated_arrival'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment' },
        { model: Delivery, as: 'delivery', include: [{ model: User, as: 'rider', attributes: ['id', 'name', 'phone'] }] },
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customers can only view their own orders
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders  (admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment', attributes: ['status', 'mpesa_receipt'] },
        { model: Delivery, as: 'delivery', attributes: ['status', 'rider_id'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status  (admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, cancelled_reason } = req.body;
    const validStatuses = ['pending', 'paid', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updates = { status };
    if (status === 'cancelled' && cancelled_reason) updates.cancelled_reason = cancelled_reason;

    await order.update(updates);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order.id}`).emit('order_status_update', { order_id: order.id, status });
    }

    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (err) {
    next(err);
  }
};
