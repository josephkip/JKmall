const router = require('express').Router();
const ctrl = require('../controllers/mpesa.controller');
const { authenticate } = require('../middleware/auth');

// Authenticated routes
router.post('/stk-push', authenticate, ctrl.initiatePayment);
router.get('/status/:checkoutId', authenticate, ctrl.checkPaymentStatus);

// Public callback from Safaricom — no auth
router.post('/callback', ctrl.mpesaCallback);

module.exports = router;
