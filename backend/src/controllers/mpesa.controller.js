const { Payment, Order } = require('../models');
const { initiateSTKPush, formatPhone } = require('../services/mpesa.service');

// POST /api/mpesa/stk-push
exports.initiatePayment = async (req, res, next) => {
  try {
    const { order_id, phone } = req.body;

    if (!order_id || !phone) {
      return res.status(400).json({ success: false, message: 'order_id and phone are required' });
    }

    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Order is already paid or cancelled' });
    }

    // Check for existing pending payment
    const existingPayment = await Payment.findOne({
      where: { order_id, status: 'pending' },
    });

    const stkResponse = await initiateSTKPush({
      phone,
      amount: order.total_amount,
      orderId: order.id,
      orderNumber: order.order_number,
    });

    if (stkResponse.ResponseCode !== '0') {
      return res.status(400).json({
        success: false,
        message: stkResponse.ResponseDescription || 'STK Push failed',
      });
    }

    // Update or create payment record
    const paymentData = {
      order_id,
      phone: formatPhone(phone),
      amount: order.total_amount,
      mpesa_checkout_id: stkResponse.CheckoutRequestID,
      mpesa_merchant_request_id: stkResponse.MerchantRequestID,
      status: 'pending',
    };

    if (existingPayment) {
      await existingPayment.update(paymentData);
    } else {
      await Payment.create(paymentData);
    }

    res.json({
      success: true,
      message: 'STK Push sent to your phone. Enter your M-Pesa PIN to complete payment.',
      data: {
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
      },
    });
  } catch (err) {
    if (err.response?.data) {
      return res.status(400).json({
        success: false,
        message: err.response.data.errorMessage || 'M-Pesa request failed',
      });
    }
    next(err);
  }
};

// POST /api/mpesa/callback  (public — called by Safaricom)
exports.mpesaCallback = async (req, res, next) => {
  try {
    const { Body } = req.body;
    const stk = Body?.stkCallback;

    if (!stk) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stk;

    const payment = await Payment.findOne({ where: { mpesa_checkout_id: CheckoutRequestID } });
    if (!payment) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      // Successful payment
      const metadata = stk.CallbackMetadata?.Item || [];
      const getValue = (name) => metadata.find((i) => i.Name === name)?.Value;

      await payment.update({
        status: 'success',
        mpesa_receipt: getValue('MpesaReceiptNumber'),
        result_code: ResultCode,
        result_desc: ResultDesc,
        paid_at: new Date(),
      });

      // Update order status
      const order = await Order.findByPk(payment.order_id);
      if (order) {
        await order.update({ status: 'paid' });

        // Emit to frontend via socket
        const io = global.io;
        if (io) {
          io.to(`order_${order.id}`).emit('payment_confirmed', {
            order_id: order.id,
            receipt: getValue('MpesaReceiptNumber'),
            amount: getValue('Amount'),
          });
          io.to(`order_${order.id}`).emit('order_status_update', {
            order_id: order.id,
            status: 'paid',
          });
        }
      }
    } else {
      // Failed payment
      await payment.update({
        status: ResultCode === 1032 ? 'cancelled' : 'failed',
        result_code: ResultCode,
        result_desc: ResultDesc,
      });

      const io = global.io;
      if (io) {
        io.to(`order_${payment.order_id}`).emit('payment_failed', {
          order_id: payment.order_id,
          reason: ResultDesc,
        });
      }
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('M-Pesa callback error:', err.message);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

// GET /api/mpesa/status/:checkoutId
exports.checkPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      where: { mpesa_checkout_id: req.params.checkoutId },
      include: [{ model: Order, as: 'order', attributes: ['id', 'order_number', 'status'] }],
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};
