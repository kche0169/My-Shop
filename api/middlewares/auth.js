const requireAdmin = (req, res, next) => {
  // Get session store from app
  const sessionStore = req.app.get('sessionStore');
  const sessionToken = req.cookies.user;
  
  if (!sessionToken) return res.status(401).json({ code: -1, msg: 'Access Denied: Login Required' });
  
  const userId = sessionStore.get(sessionToken);
  if (!userId) return res.status(401).json({ code: -1, msg: 'Access Denied: Invalid Session' });
  
  const db = req.app.get('db');
  db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, user) => {
    if (err || !user || user.admin !== 1) {
      return res.status(403).json({ code: -1, msg: 'Access Denied: Admin Only' });
    }
    req.user = user;
    next();
  });
};

module.exports = requireAdmin;