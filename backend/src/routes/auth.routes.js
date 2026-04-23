const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../config/multer');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.getMe);
router.put('/profile', authenticate, upload.single('avatar'), ctrl.updateProfile);
router.put('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
