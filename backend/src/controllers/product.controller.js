const { Op } = require('sequelize');
const { Product, Category } = require('../models');
const fs = require('fs');
const path = require('path');

// GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category_id,
      min_price,
      max_price,
      featured,
      sort = 'created_at',
      order = 'DESC',
    } = req.query;

    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (category_id) where.category_id = category_id;
    if (featured === 'true') where.is_featured = true;
    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }

    const validSortFields = ['price', 'rating', 'created_at', 'name'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [[sortField, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });

    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// POST /api/products  (admin)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, original_price, stock, category_id, is_featured, sku } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      original_price: original_price ? parseFloat(original_price) : null,
      stock: parseInt(stock) || 0,
      category_id: category_id || null,
      images,
      is_featured: is_featured === 'true',
      sku: sku || null,
    });

    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id  (admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, price, original_price, stock, category_id, is_featured, is_active, sku, remove_images } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (original_price !== undefined) updates.original_price = parseFloat(original_price);
    if (stock !== undefined) updates.stock = parseInt(stock);
    if (category_id !== undefined) updates.category_id = category_id;
    if (is_featured !== undefined) updates.is_featured = is_featured === 'true';
    if (is_active !== undefined) updates.is_active = is_active === 'true';
    if (sku !== undefined) updates.sku = sku;

    // Handle image updates
    let currentImages = [...product.images];
    if (remove_images) {
      const toRemove = JSON.parse(remove_images);
      toRemove.forEach((imgPath) => {
        const fullPath = path.join(__dirname, '../../', imgPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });
      currentImages = currentImages.filter((img) => !toRemove.includes(img));
    }
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => `/uploads/${f.filename}`);
      currentImages = [...currentImages, ...newImages];
    }
    updates.images = currentImages;

    await product.update(updates);

    res.json({ success: true, message: 'Product updated', data: product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id  (admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft delete
    await product.update({ is_active: false });

    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
};
