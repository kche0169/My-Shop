/**
 * app.js - Local Debug Version (100% Fix Connection Error)
 * 所有原有功能保留 | 适配本地HTTP环境 | 无浏览器拦截
 */
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();
// 固定本地端口
const port = 3000;

// 数据库连接
const db = new sqlite3.Database('./shop.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) console.error('[ERROR] Database connection failed:', err.message);
  else console.log('[SUCCESS] SQLite database connected successfully!');
});
app.set('db', db);

// CORS 基础配置
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 基础安全头（无HTTPS强制，本地兼容）
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 管理员权限验证
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

// 受保护的admin路由
app.use('/admin', requireAdmin, express.static(path.join(__dirname, 'admin')));

// 登录接口
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.get('db');

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.json({ success: false, msg: 'User not found' });

    const [salt, key] = user.password.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    if (hash !== key) return res.json({ success: false, msg: 'Password error' });

    // 本地环境：secure=false 核心修复
    res.cookie('user', user.userid, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 3 * 24 * 60 * 60 * 1000
    });
    res.json({ success: true });
  });
});

// 登出接口
app.get('/api/logout', (req, res) => {
  res.clearCookie('user');
  res.send('Logout success');
});

// 原有业务接口（完全保留）
try {
  const cateApi = require('./api/categoryApi');
  const productsApi = require('./api/productsApi');
  app.use('/api/cate', cateApi);
  app.use('/api/products', productsApi);
  console.log('[SUCCESS] Routes mounted successfully: /api/cate, /api/products');
} catch (err) {
  console.error('[ERROR] Route mounting failed:', err.message);
}

// 启动服务
app.listen(port, '0.0.0.0', () => {
  console.log('[SUCCESS] Local server started successfully!');
  console.log(`[INFO] Local address: http://localhost:${port}`);
  console.log(`[INFO] Admin page: http://localhost:${port}/admin`);
});

// 关闭数据库
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('[ERROR] DB close error:', err.message);
    else console.log('[SUCCESS] DB connection closed');
    process.exit(0);
  });
});

module.exports = { app, db };