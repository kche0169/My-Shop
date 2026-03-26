/**
 * app.js - Local Debug Version with Enhanced Startup Logs
 * All original features retained | Adapted for local HTTP environment
 */

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const port = 3000;

// ===================== 1. Database Connection =====================
const db = new sqlite3.Database('./shop.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) console.error('[ERROR] Database connection failed:', err.message);
  else console.log('[SUCCESS] SQLite database connected successfully!');
});

app.set('db', db);

// ===================== 2. CORS Configuration =====================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ===================== 3. Security Headers =====================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ===================== 4. Parsing Middleware =====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ===================== 5. Static Files =====================
app.use(express.static(path.join(__dirname, 'public')));

// ===================== 6. Admin Authentication Middleware =====================
const requireAdmin = (req, res, next) => {
  const userId = req.cookies.user;
  if (!userId) return res.status(401).send('Access Denied: Login Required');
  
  const db = req.app.get('db');
  db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, user) => {
    if (err || !user || user.admin !== 1) return res.status(403).send('Access Denied: Admin Only');
    req.user = user;
    next();
  });
};

// Protected admin route
app.use('/admin', requireAdmin, express.static(path.join(__dirname, 'admin')));

// ===================== 7. Login API =====================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.get('db');
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.json({ success: false, msg: 'User not found' });
    
    const [salt, key] = user.password.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    
    if (hash !== key) return res.json({ success: false, msg: 'Password error' });
    
    res.cookie('user', user.userid, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 3 * 24 * 60 * 60 * 1000
    });
    
    res.json({ success: true });
  });
});

// ===================== 8. Logout API =====================
app.get('/api/logout', (req, res) => {
  res.clearCookie('user');
  res.send('Logout success');
});

// ===================== 9. Business Routes =====================
try {
  const cateApi = require('./api/categoryApi');
  const productsApi = require('./api/productsApi');
  
  app.use('/api/cate', cateApi);
  app.use('/api/products', productsApi);
  
  console.log('[SUCCESS] Routes mounted successfully: /api/cate, /api/products');
} catch (err) {
  console.error('[ERROR] Route mounting failed:', err.message);
}

// ===================== 10. Start Server with Detailed Logs =====================
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

// ===================== 11. Graceful Shutdown =====================
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('[ERROR] Database disconnection failed:', err.message);
    else console.log('[SUCCESS] SQLite database connection closed');
    process.exit(0);
  });
});

module.exports = { app, db };