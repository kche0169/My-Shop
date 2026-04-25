const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 用户注册
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.get('db');
  
  db.get('SELECT userid FROM users WHERE email = ?', [email], (err, existingUser) => {
    if (err) return res.json({ success: false, message: 'Database error' });
    if (existingUser) return res.json({ success: false, message: 'Email already registered' });
    
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    const storedPassword = `${salt}:${hash}`;
    
    db.run('INSERT INTO users (email, password, admin) VALUES (?, ?, 0)', [email, storedPassword], function(err) {
      if (err) return res.json({ success: false, message: 'Registration failed' });
      res.json({ success: true });
    });
  });
});

// 用户登录
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.get('db');
  const sessionStore = req.app.get('sessionStore');
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.json({ success: false, message: 'User not found' });
    
    const [salt, key] = user.password.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    
    if (hash !== key) return res.json({ success: false, message: 'Password error' });
    
    const randomSessionId = crypto.randomBytes(32).toString('hex');
    sessionStore.set(randomSessionId, user.userid);
    
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('user', randomSessionId, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'none',
      maxAge: 3 * 24 * 60 * 60 * 1000
    });
    
    const userRole = user.admin === 1 ? 'Admin' : 'User';
    const redirectUrl = user.admin === 1 ? '/admin' : '/';
    res.json({ success: true, redirectUrl, role: userRole });
  });
});

// 获取用户信息
router.get('/userinfo', (req, res) => {
  const sessionToken = req.cookies.user;
  if (!sessionToken) return res.json({ isLogin: false, role: 'Guest' });
  
  const userId = req.app.get('sessionStore').get(sessionToken);
  if (!userId) return res.json({ isLogin: false, role: 'Guest' });
  
  const db = req.app.get('db');
  db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, user) => {
    if (err || !user) return res.json({ isLogin: false, role: 'Guest' });
    const userRole = user.admin === 1 ? 'Admin' : 'User';
    res.json({ isLogin: true, role: userRole, userId: user.userid, email: user.email });
  });
});

// 登出
router.get('/logout', (req, res) => {
  const sessionToken = req.cookies.user;
  const sessionStore = req.app.get('sessionStore');
  if (sessionToken) sessionStore.delete(sessionToken);
  res.clearCookie('user');
  res.send('Logout success');
});

// 修改密码
router.post('/change-password', (req, res) => {
  const sessionToken = req.cookies.user;
  if (!sessionToken) return res.status(401).json({ success: false, message: 'Please login first' });

  const userId = req.app.get('sessionStore').get(sessionToken);
  if (!userId) return res.status(401).json({ success: false, message: 'Invalid session' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'All fields required' });

  const db = req.app.get('db');
  db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, user) => {
    if (err || !user) return res.status(500).json({ success: false, message: 'User not found' });

    const [salt, key] = user.password.split(':');
    const currentHash = crypto.pbkdf2Sync(currentPassword, salt, 10000, 64, 'sha256').toString('hex');
    if (currentHash !== key) return res.status(401).json({ success: false, message: 'Current password incorrect' });

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 10000, 64, 'sha256').toString('hex');
    const newPasswordHash = `${newSalt}:${newHash}`;

    db.run('UPDATE users SET password = ? WHERE userid = ?', [newPasswordHash, userId], function (err) {
      if (err) return res.status(500).json({ success: false, message: 'Update failed' });
      req.app.get('sessionStore').delete(sessionToken);
      res.clearCookie('user');
      res.json({ success: true, message: 'Password updated! Login again.' });
    });
  });
});

module.exports = router;