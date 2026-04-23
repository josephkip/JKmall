const { Delivery, Order, User } = require('../models');

// GET /api/deliveries/:orderId
exports.getDelivery = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customers can only view their own order delivery
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const delivery = await Delivery.findOne({
      where: { order_id: req.params.orderId },
      include: [
        { model: User, as: 'rider', attributes: ['id', 'name', 'phone'] },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'delivery_lat', 'delivery_lng', 'delivery_address', 'status'],
        },
      ],
    });

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not yet assigned' });
    }

    res.json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries  (admin — assign rider)
exports.assignDelivery = async (req, res, next) => {
  try {
    const { order_id, rider_id, pickup_lat, pickup_lng } = req.body;

    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const rider = await User.findByPk(rider_id);
    if (!rider || rider.role !== 'rider') {
      return res.status(400).json({ success: false, message: 'Invalid rider' });
    }

    const existing = await Delivery.findOne({ where: { order_id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Delivery already assigned' });
    }

    const delivery = await Delivery.create({
      order_id,
      rider_id,
      pickup_lat: pickup_lat || null,
      pickup_lng: pickup_lng || null,
      status: 'assigned',
    });

    // Update order status
    await order.update({ status: 'out_for_delivery' });

    // Notify customer
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order_id}`).emit('delivery_assigned', {
        delivery_id: delivery.id,
        rider_name: rider.name,
        rider_phone: rider.phone,
      });
      io.to(`order_${order_id}`).emit('order_status_update', {
        order_id,
        status: 'out_for_delivery',
      });
    }

    res.status(201).json({ success: true, message: 'Delivery assigned', data: delivery });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/deliveries/:id/location  (rider)
exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, status } = req.body;

    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    // Only assigned rider can update location
    if (delivery.rider_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updates = { current_lat: lat, current_lng: lng };
    if (status) updates.status = status;
    if (status === 'delivered') {
      updates.delivered_at = new Date();
      await Order.update({ status: 'delivered' }, { where: { id: delivery.order_id } });
    }

    await delivery.update(updates);

    // Broadcast live location to customer
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${delivery.order_id}`).emit('location_update', {
        delivery_id: delivery.id,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        status: updates.status || delivery.status,
      });
    }

    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    next(err);
  }
};

// GET /api/deliveries/rider/my  (rider)
exports.getRiderDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.findAll({
      where: { rider_id: req.user.id },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'delivery_address', 'delivery_lat', 'delivery_lng', 'total_amount'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: deliveries });
  } catch (err) {
    next(err);
  }
};
