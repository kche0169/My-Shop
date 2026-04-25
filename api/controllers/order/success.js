const paySuccess = async (req, res) => {
  const { token } = req.query;
  const db = req.app.get('db');

  if (token) {
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE orders SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
        WHERE paypal_order_id = ?
      `, [token], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
  res.redirect('/index.html');
};

module.exports = paySuccess;