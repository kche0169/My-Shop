const userGetRecentOrders = (req, res) => {
  const sessionToken = req.cookies.user;
  if (!sessionToken) return res.status(401).json({ code: -1, msg: 'Please login first' });

  const sessionStore = req.app.get('sessionStore');
  const userId = sessionStore.get(sessionToken);
  if (!userId) return res.status(401).json({ code: -1, msg: 'Invalid session' });

  const db = req.app.get('db');
  db.all(`
    SELECT * FROM orders WHERE userid = ? 
    ORDER BY created_at DESC LIMIT 5
  `, [userId], (err, rows) => {
    if (err) return res.json({ code: -1, msg: 'Failed to fetch orders' });
    res.json({ code: 0, data: rows });
  });
};

module.exports = userGetRecentOrders;