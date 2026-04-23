const router = require('express').Router();
const ctrl = require('../controllers/delivery.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/rider/my', authenticate, authorize('rider'), ctrl.getRiderDeliveries);
router.get('/:orderId', authenticate, ctrl.getDelivery);
router.post('/', authenticate, authorize('admin'), ctrl.assignDelivery);
router.patch('/:id/location', authenticate, authorize('rider'), ctrl.updateLocation);

module.exports = router;
