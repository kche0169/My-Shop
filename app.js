/**
 * Final Version app.js - Adapted for products folder + Best Practice Optimization
 */
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// ===================== 1. Database Connection (Unified instance for reuse in other files) =====================
const db = new sqlite3.Database('./shop.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('[ERROR] Database connection failed:', err.message);
  } else {
    console.log('[SUCCESS] SQLite database connected successfully!');
  }
});

// Mount db instance to app for reuse in other route files (avoid duplicate connections)
app.set('db', db);

// ===================== 2. CORS Configuration (Unchanged, compliant with standards) =====================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static('public'));
// ===================== 3. Basic Parsing (Unchanged, compliant with standards) =====================
app.use(express.json({ limit: '10mb' })); // Parse JSON requests (10MB limit for large payloads)
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded requests

// ===================== 4. Static Resource Hosting (Optimization: Remove redundant /uploads config) =====================
app.use(express.static(path.join(__dirname, 'public'))); // Core: Host public folder (contains images)
app.use('/admin', express.static(path.join(__dirname, 'admin'))); // Host admin page

// ===================== 5. Route Mounting (Optimization: Unified log format + More detailed error capture) =====================
try {
  const cateApi = require('./api/categoryApi');
  const productsApi = require('./api/productsApi');
  const ordersApi = require('./api/ordersApi');
  
  app.use('/api/cate', cateApi); // Mount category API routes
  app.use('/api/products', productsApi); // Mount products API routes
  app.use('/api/orders', ordersApi);
  
  console.log('[SUCCESS] Routes mounted successfully: /api/cate, /api/products');
} catch (err) {
  console.error('[ERROR] Route mounting failed:', err.message);
  console.error('[TIPS] Please check:');
  console.error('  1. Whether categoryApi.js and productsApi.js exist in the api folder;');
  console.error('  2. Whether module.exports = router; is exported in the files;');
  console.error('  3. Whether there are syntax errors (e.g., missing semicolons, mismatched brackets);');
}

// ===================== 6. Start Server (Optimization: Unified log format + Clearer prompts) =====================
app.listen(port, '0.0.0.0', () => {
  console.log('[SUCCESS] Node server started successfully!');
  console.log(`[INFO] Server address: http://localhost:${port}`);
  console.log(`[INFO] LAN access: http://${require('os').networkInterfaces().eth0?.[0]?.address || '192.168.1.xxx'}:${port}`);
  console.log(`[TEST] Category API: http://localhost:${port}/api/cate/all`);
  console.log(`[TEST] Product list: http://localhost:${port}/api/products/list?catid=1`);
  console.log(`[TEST] Product detail: http://localhost:${port}/api/products/detail?pid=1`);
  console.log(`[TEST] Admin page: http://localhost:${port}/admin`);
  console.log(`[TEST] Frontend page: http://localhost:${port}`);
});

// ===================== 7. New: Graceful Database Connection Shutdown (Avoid process leaks) =====================
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('[ERROR] Database disconnection failed:', err.message);
    } else {
      console.log('[SUCCESS] SQLite database connection closed');
    }
    process.exit(0);
  });
});

module.exports = { app, db };
