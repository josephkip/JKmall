require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Product } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (tables recreated)');

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin JKmall',
      email: 'admin@jkmall.co.ke',
      phone: '0712345678',
      password_hash: adminHash,
      role: 'admin',
    });
    console.log('✅ Admin created:', admin.email);

    // Create rider user
    const riderHash = await bcrypt.hash('rider123', 12);
    const rider = await User.create({
      name: 'Boda Rider One',
      email: 'rider@jkmall.co.ke',
      phone: '0798765432',
      password_hash: riderHash,
      role: 'rider',
    });
    console.log('✅ Rider created:', rider.email);

    // Create test customer
    const customerHash = await bcrypt.hash('customer123', 12);
    await User.create({
      name: 'John Kamau',
      email: 'john@example.com',
      phone: '0723456789',
      password_hash: customerHash,
      role: 'customer',
    });
    console.log('✅ Test customer created');

    // Create categories
    const categories = await Category.bulkCreate([
      { name: 'Electronics', description: 'Phones, laptops, gadgets & accessories' },
      { name: 'Fashion', description: 'Clothing, shoes & accessories' },
      { name: 'Home & Kitchen', description: 'Furniture, appliances & utensils' },
      { name: 'Groceries', description: 'Fresh produce, snacks & beverages' },
      { name: 'Health & Beauty', description: 'Skincare, medicine & wellness' },
      { name: 'Sports & Outdoor', description: 'Fitness gear, camping & sports equipment' },
    ]);
    console.log(`✅ ${categories.length} categories created`);

    // Create sample products
    const products = await Product.bulkCreate([
      { name: 'Samsung Galaxy A15', description: 'Samsung Galaxy A15 with 128GB storage, 6GB RAM, Super AMOLED display. Perfect for everyday use.', price: 22500, original_price: 27000, stock: 50, category_id: categories[0].id, is_featured: true, rating: 4.5, review_count: 128, sku: 'ELEC-001' },
      { name: 'Tecno Spark 20 Pro', description: 'Tecno Spark 20 Pro with 256GB storage, 8GB RAM, and 108MP camera for stunning photos.', price: 18999, original_price: 23000, stock: 35, category_id: categories[0].id, is_featured: true, rating: 4.2, review_count: 89, sku: 'ELEC-002' },
      { name: 'JBL Flip 6 Speaker', description: 'Portable Bluetooth speaker with powerful bass, waterproof design, and 12-hour battery life.', price: 15500, original_price: 18000, stock: 20, category_id: categories[0].id, is_featured: false, rating: 4.7, review_count: 56, sku: 'ELEC-003' },
      { name: 'Wireless Earbuds Pro', description: 'True wireless earbuds with active noise cancellation, touch controls, and premium sound quality.', price: 4500, original_price: 6000, stock: 100, category_id: categories[0].id, is_featured: true, rating: 4.0, review_count: 230, sku: 'ELEC-004' },
      { name: 'Men\'s Casual Polo Shirt', description: 'Premium cotton polo shirt, available in multiple colors. Comfortable fit for work or casual outings.', price: 1800, original_price: 2500, stock: 200, category_id: categories[1].id, is_featured: false, rating: 4.3, review_count: 45, sku: 'FASH-001' },
      { name: 'Women\'s Ankara Dress', description: 'Beautiful Ankara print dress, handcrafted with African fabric. Elegant for any occasion.', price: 3500, original_price: 4500, stock: 30, category_id: categories[1].id, is_featured: true, rating: 4.8, review_count: 67, sku: 'FASH-002' },
      { name: 'Nike Air Max Sneakers', description: 'Classic Nike Air Max sneakers with cushioned sole for maximum comfort all day long.', price: 12000, original_price: 15000, stock: 15, category_id: categories[1].id, is_featured: true, rating: 4.6, review_count: 190, sku: 'FASH-003' },
      { name: 'Non-stick Cooking Set', description: '10-piece non-stick cookware set. Includes pots, pans, and utensils. Perfect for any kitchen.', price: 8500, original_price: 12000, stock: 25, category_id: categories[2].id, is_featured: false, rating: 4.4, review_count: 32, sku: 'HOME-001' },
      { name: 'Blender & Juicer Combo', description: 'Powerful 1500W blender with juicer attachment. Make smoothies, juices, and soups effortlessly.', price: 6500, original_price: 8000, stock: 40, category_id: categories[2].id, is_featured: true, rating: 4.1, review_count: 78, sku: 'HOME-002' },
      { name: 'Premium Kenyan Coffee (1kg)', description: 'Single-origin Kenyan AA coffee beans from the highlands of Mt. Kenya. Rich, bold flavor.', price: 1200, stock: 500, category_id: categories[3].id, is_featured: true, rating: 4.9, review_count: 310, sku: 'GROC-001' },
      { name: 'Organic Macadamia Nuts (500g)', description: 'Locally grown organic macadamia nuts. Roasted and lightly salted. High in protein.', price: 850, stock: 150, category_id: categories[3].id, is_featured: false, rating: 4.5, review_count: 55, sku: 'GROC-002' },
      { name: 'Aloe Vera Skincare Set', description: 'Complete skincare set with natural aloe vera. Includes cleanser, toner, and moisturizer.', price: 2800, original_price: 3500, stock: 60, category_id: categories[4].id, is_featured: false, rating: 4.3, review_count: 42, sku: 'HLTH-001' },
    ]);
    console.log(`✅ ${products.length} products created`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin@jkmall.co.ke / admin123');
    console.log('   Rider: rider@jkmall.co.ke / rider123');
    console.log('   Customer: john@example.com / customer123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
