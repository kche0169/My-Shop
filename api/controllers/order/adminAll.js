const adminGetAllOrders = (req, res) => {
  const db = req.app.get('db');
  db.all(`SELECT * FROM orders ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.json({ code: -1, msg: 'Failed to fetch orders' });
    res.json({ code: 0, data: rows });
  });
};

module.exports = adminGetAllOrders;