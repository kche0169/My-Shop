/**
 * 管理员验证订单（模拟 PayPal 支付确认）
 * 将订单状态从 PENDING 改为 PAID
 */
const adminVerifyOrder = (req, res) => {
  const { orderId } = req.body;
  const db = req.app.get('db');

  if (!orderId || isNaN(parseInt(orderId))) {
    return res.status(400).json({ code: -1, msg: 'Invalid order ID' });
  }

  // 检查订单是否存在
  db.get('SELECT * FROM orders WHERE id = ?', [parseInt(orderId)], (err, order) => {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Database error' });
    }

    if (!order) {
      return res.status(404).json({ code: -1, msg: 'Order not found' });
    }

    // 更新订单状态为 PAID
    db.run(`
      UPDATE orders 
      SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [parseInt(orderId)], function(err) {
      if (err) {
        return res.status(500).json({ code: -1, msg: 'Failed to verify order' });
      }

      res.json({ code: 0, msg: 'Order verified successfully' });
    });
  });
};

module.exports = adminVerifyOrder;
