const express = require('express');
const path = require('path');

// 1. Import modularized files
const db = require('./config/db');
const globalMiddlewares = require('./middlewares/global');
const pageRoutes = require('./routes/page');
const userRoutes = require('./routes/user');
const requireAdmin = require('./api/middlewares/auth'); // Your existing admin guard

// 2. Session storage
const sessionStore = new Map();
const app = express();
app.disable('x-powered-by');
app.set('sessionStore', sessionStore);
app.set('db', db);
const port = 3000;

// 3. Register global middlewares
globalMiddlewares(app);

// 4. Mount routes
app.use('/', pageRoutes); // Page routes
app.use('/api', userRoutes); // User APIs
app.use('/admin', requireAdmin, express.static(path.join(__dirname, 'admin'))); // Admin pages

// 5. Mount business routes (category / product / order)
try {
  const cateApi = require('./api/routes/category');
  const productsApi = require('./api/routes/products');
  const ordersApi = require('./api/routes/orders');
  
  app.use('/api/cate', cateApi);
  app.use('/api/products', productsApi);
  app.use('/api/orders', ordersApi);
  console.log('[SUCCESS] All routes mounted!');
} catch (err) {
  console.error('[ERROR] Route mounting failed:', err.message);
}

// 6. SEO URL routing - Handle /{catId}-{name} and /{catId}-{name}/{productId}-{name}
app.get(/^\/(\d+)-[a-zA-Z0-9\-]+(\/(\d+)-[a-zA-Z0-9\-]+)?\/?$/, (req, res) => {
  const path = req.path;
  // Check if it's a product URL (has product ID)
  const productMatch = path.match(/^\/(\d+)-[a-zA-Z0-9\-]+\/(\d+)-[a-zA-Z0-9\-]+\/?$/);
  
  if (productMatch) {
    // Product detail page
    res.sendFile(path.join(__dirname, 'public', 'pages', 'product', 'detail.html'));
  } else {
    // Category detail page
    res.sendFile(path.join(__dirname, 'public', 'pages', 'category', 'detail.html'));
  }
});

// 6. Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running: http://localhost:${port}`);
});

// 7. Graceful shutdown
process.on('SIGINT', () => {
  db.close(() => process.exit(0));
});

module.exports = { app, db };