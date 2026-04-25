/**
 * app.js - Local Debug Version with Enhanced Startup Logs
 * All original features retained | Adapted for local HTTP environment
 */

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// [NEW] In-memory session store: Maps random session tokens to user IDs
const sessionStore = new Map();
app.set('sessionStore', sessionStore);
const app = express();
const port = 3000;

process.on('uncaughtException', (err) => {
  console.error('🔥 uncaughtException:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('🔥 unhandledRejection:', err);
});

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

// ===================== 6. Page Routes =====================
// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve register page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// ===================== 7. Admin Authentication Middleware =====================
const requireAdmin = (req, res, next) => {
  const sessionToken = req.cookies.user;
  if (!sessionToken) return res.status(401).send('Access Denied: Login Required');
  
  // [FIX] Get real user ID from in-memory session store
  const userId = sessionStore.get(sessionToken);
  if (!userId) return res.status(401).send('Access Denied: Invalid Session');
  
  const db = req.app.get('db');
  db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, user) => {
    if (err || !user || user.admin !== 1) return res.status(403).send('Access Denied: Admin Only');
    req.user = user;
    next();
  });
};

// Protected admin route
app.use('/admin', requireAdmin, express.static(path.join(__dirname, 'admin')));

// ===================== 8. Register API =====================
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.get('db');
  
  // Check if email already exists
  db.get('SELECT userid FROM users WHERE email = ?', [email], (err, existingUser) => {
    if (err) return res.json({ success: false, message: 'Database error' });
    if (existingUser) return res.json({ success: false, message: 'Email already registered' });
    
    // Generate salt and hash password (same method as existing users)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    const storedPassword = `${salt}:${hash}`;
    
    // Insert new user (default to non-admin)
    db.run('INSERT INTO users (email, password, admin) VALUES (?, ?, 0)', [email, storedPassword], function(err) {
      if (err) return res.json({ success: false, message: 'Registration failed' });
      res.json({ success: true });
    });
  });
});

// ===================== 9. Login API =====================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.get('db');
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.json({ success: false, message: 'User not found' });
    
    const [salt, key] = user.password.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    
    if (hash !== key) return res.json({ success: false, message: 'Password error' });
    
    // [FIX 1] Generate cryptographically random session ID to prevent session fixation
    const randomSessionId = crypto.randomBytes(32).toString('hex');
    // [FIX 2] Map random session ID to real user ID in memory
    sessionStore.set(randomSessionId, user.userid);
    
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    // [FIX 3] Store random session ID in cookie instead of raw database user ID
    res.cookie('user', randomSessionId, {
      httpOnly: true,
      secure: isHttps, // Only set secure on HTTPS connections
      // sameSite: 'Strict',
      sameSite: 'none',
      maxAge: 3 * 24 * 60 * 60 * 1000
    });
    
    // Determine user role and redirect URL
    const userRole = user.admin === 1 ? 'Admin' : 'User';
    const redirectUrl = user.admin === 1 ? '/admin' : '/';
    res.json({ success: true, redirectUrl: redirectUrl, role: userRole });
  });
});

// ===================== 9.5. 获取当前登录用户信息 API =====================
app.get('/api/userinfo', (req, res) => {
  const sessionToken = req.cookies.user;
  if (!sessionToken) return res.json({ isLogin: false, role: 'Guest' });
  
  // [FIX] Get real user ID from in-memory session store
  const userId = sessionStore.get(sessionToken);
  if (!userId) return res.json({ isLogin: false, role: 'Guest' });
  
  const db = req.app.get('db');
  db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, user) => {
    if (err || !user) return res.json({ isLogin: false, role: 'Guest' });
    const userRole = user.admin === 1 ? 'Admin' : 'User';
    res.json({ isLogin: true, role: userRole, userId: user.userid, email: user.email });
  });
});

// ===================== 10. Logout API =====================
app.get('/api/logout', (req, res) => {
  const sessionToken = req.cookies.user;
  if (sessionToken) {
    // [FIX] Remove session from in-memory store on logout
    sessionStore.delete(sessionToken);
  }
  res.clearCookie('user');
  res.send('Logout success');
});

// ===================== 11. Business Routes =====================
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
}

// ===================== 12. Start Server with Detailed Logs =====================
app.listen(port, '0.0.0.0', () => {
  console.log('[SUCCESS] Node server started successfully!');
  console.log(`[INFO] Server address: http://localhost:${port}`);
  console.log(`[INFO] LAN access: http://${require('os').networkInterfaces().eth0?.[0]?.address || '192.168.1.xxx'}:${port}`);
  console.log(`[TEST] Category API: http://localhost:${port}/api/cate/all`);
  console.log(`[TEST] Product list: http://localhost:${port}/api/products/list?catid=1`);
  console.log(`[TEST] Product detail: http://localhost:${port}/api/products/detail?pid=1`);
  console.log(`[TEST] Admin page: http://localhost:${port}/admin`);
  console.log(`[TEST] Frontend page: http://localhost:${port}`);
  console.log(`[TEST] Login page: http://localhost:${port}/login`);
  console.log(`[TEST] Register page: http://localhost:${port}/register`);
});

// ===================== 13. Graceful Shutdown =====================
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('[ERROR] Database disconnection failed:', err.message);
    else console.log('[SUCCESS] SQLite database connection closed');
    process.exit(0);
  });
});

// ===================== 14. Change Password API =====================
// Verify current password, update to new password, then force logout
app.post('/api/change-password', (req, res) => {
  // Get session token from cookie
  const sessionToken = req.cookies.user;
  if (!sessionToken) {
    return res.status(401).json({ success: false, message: 'Please login first' });
  }

  // Get user ID from session store
  const userId = sessionStore.get(sessionToken);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid session, please login again' });
  }

  // Get input data
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Get user from database
  const db = req.app.get('db');
  db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const [salt, key] = user.password.split(':');
    const currentHash = crypto.pbkdf2Sync(currentPassword, salt, 10000, 64, 'sha256').toString('hex');

    if (currentHash !== key) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Generate new hashed password
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 10000, 64, 'sha256').toString('hex');
    const newPasswordHash = `${newSalt}:${newHash}`;

    // Update password in database
    db.run('UPDATE users SET password = ? WHERE userid = ?', [newPasswordHash, userId], function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to update password' });
      }

      // Destroy session after password change
      sessionStore.delete(sessionToken);
      res.clearCookie('user');

      return res.json({ success: true, message: 'Password updated successfully. Please login again.' });
    });
  });
});


// app.set('sessionStore', sessionStore);
module.exports = { app, db };
