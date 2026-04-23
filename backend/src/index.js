require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const mpesaRoutes = require('./routes/mpesa.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io globally accessible (for M-Pesa callback)
global.io = io;
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Customer joins order room to receive live updates
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined room: order_${orderId}`);
  });

  // Rider broadcasts live location
  socket.on('rider_location', ({ delivery_id, order_id, lat, lng, status }) => {
    io.to(`order_${order_id}`).emit('location_update', { delivery_id, lat, lng, status });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Dynamic Sitemap for SEO
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { Product, Category } = require('./models');
    const products = await Product.findAll({ where: { is_active: true }, attributes: ['id', 'updated_at'] });
    const categories = await Category.findAll({ where: { is_active: true }, attributes: ['id'] });
    const baseUrl = process.env.FRONTEND_URL || 'https://jkmall.co.ke';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/login</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/register</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>\n`;
    categories.forEach(c => { xml += `  <url><loc>${baseUrl}/?category=${c.id}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`; });
    products.forEach(p => { xml += `  <url><loc>${baseUrl}/product/${p.id}</loc><lastmod>${p.updated_at.toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`; });
    xml += `</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

// In production, serve the frontend build
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  // 404 handler (dev only — frontend is on separate Vite server)
  app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });
}

// Error handler
app.use(errorHandler);

// ── Database + Start ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    // Sync tables (creates if not exists)
    await sequelize.sync();
    console.log('✅ Database synced');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 JKmall API running on port ${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
