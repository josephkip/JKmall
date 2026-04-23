const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { Category } = require('../models');
const upload = require('../config/multer');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/users', ctrl.getUsers);
router.patch('/users/:id', ctrl.updateUser);

// Category management
router.get('/categories', async (req, res) => {
  const cats = await Category.findAll({ order: [['name', 'ASC']] });
  res.json({ success: true, data: cats });
});

router.post('/categories', upload.single('image'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const cat = await Category.create({ name, description, image_url });
    res.status(201).json({ success: true, data: cat });
  } catch (err) { next(err); }
});

router.put('/categories/:id', upload.single('image'), async (req, res, next) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    const updates = { ...req.body };
    if (req.file) updates.image_url = `/uploads/${req.file.filename}`;
    await cat.update(updates);
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Not found' });
    await cat.update({ is_active: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
