const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, ctrl.createOrder);
router.get('/my', authenticate, ctrl.getMyOrders);
router.get('/', authenticate, authorize('admin'), ctrl.getAllOrders);
router.get('/:id', authenticate, ctrl.getOrder);
router.patch('/:id/status', authenticate, authorize('admin'), ctrl.updateOrderStatus);

module.exports = router;
