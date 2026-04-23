const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../config/multer');
const { Category } = require('../models');

// Public routes
router.get('/', ctrl.getProducts);
router.get('/categories', async (req, res) => {
  try {
    const cats = await Category.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load categories' });
  }
});
router.get('/:id', ctrl.getProduct);

// Admin only
router.post('/', authenticate, authorize('admin'), upload.array('images', 8), ctrl.createProduct);
router.put('/:id', authenticate, authorize('admin'), upload.array('images', 8), ctrl.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), ctrl.deleteProduct);

module.exports = router;
