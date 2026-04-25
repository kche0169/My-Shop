const crypto = require('crypto');

const orderWebhook = async (req, res) => {
  const db = req.app.get('db');
  
  try {
    const event = JSON.parse(req.body.toString());
    if (event.event_type !== 'CHECKOUT.ORDER.APPROVED' && event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return res.sendStatus(200);
    }

    const paypalOrderId = event.resource.id || event.resource.order_id;
    if (!paypalOrderId) return res.sendStatus(200);

    // 查询订单
    const order = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE paypal_order_id = ?', [paypalOrderId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!order || order.status === 'PAID') return res.sendStatus(200);

    // 验证摘要
    const items = JSON.parse(order.items_json);
    const itemsString = items.map(item => `${item.pid}|${item.num}|${item.price}`).join('|');
    const rawString = [
      order.currency, order.merchant_email, order.salt, itemsString, order.total_price.toFixed(2)
    ].join('|');
    const regeneratedDigest = crypto.createHash('sha256').update(rawString).digest('hex');

    if (regeneratedDigest !== order.digest) return res.sendStatus(400);

    // 更新订单状态
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE orders SET status = 'PAID', paid_at = CURRENT_TIMESTAMP, paypal_transaction_id = ?
        WHERE id = ?
      `, [event.resource.id || paypalOrderId, order.id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('[Webhook Error]', err);
    res.sendStatus(500);
  }
};

module.exports = orderWebhook;