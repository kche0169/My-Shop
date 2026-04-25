const { validationResult } = require('express-validator');
const { generateSalt, generateDigest, createPayPalOrder } = require('./utils');
const paypalConfig = require('../../config/paypal');

const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { userid, items } = req.body;
  const db = req.app.get('db');

  try {
    // 验证商品
    const validItems = [];
    let totalPrice = 0;

    for (const item of items) {
      const pid = parseInt(item.pid);
      const num = parseInt(item.num);
      if (isNaN(pid) || pid < 1 || isNaN(num) || num < 1) continue;

      const product = await new Promise((resolve, reject) => {
        db.get('SELECT pid, price FROM products WHERE pid = ?', [pid], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (product) {
        validItems.push({ pid, num, price: product.price });
        totalPrice += product.price * num;
      }
    }

    if (validItems.length === 0) {
      return res.status(400).json({ code: -1, msg: 'No valid items in cart' });
    }

    // 生成摘要
    const salt = generateSalt();
    const digest = generateDigest({
      currency: paypalConfig.currency,
      merchantEmail: paypalConfig.merchantEmail,
      salt,
      items: validItems,
      totalPrice
    });

    // 创建PayPal订单
    const paypalOrder = await createPayPalOrder(totalPrice, paypalConfig.currency);

    // 存入数据库
    const orderId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO orders (userid, paypal_order_id, items_json, total_price, currency, digest, merchant_email, salt, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        Number(userid),
        paypalOrder.id,
        JSON.stringify(validItems),
        totalPrice,
        paypalConfig.currency,
        digest,
        paypalConfig.merchantEmail,
        salt,
        'PENDING'
      ], function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      });
    });

    // 生成支付链接
    const approvalLink = paypalOrder.links.find(l => l.rel === 'approve')?.href;
    const finalApprovalLink = approvalLink ? `${approvalLink}&paypalOrderId=${paypalOrder.id}` : null;

    res.json({
      code: 0,
      msg: 'Order created',
      data: { orderId, paypalOrderId: paypalOrder.id, approvalLink: finalApprovalLink }
    });

  } catch (err) {
    console.error('[Orders Create Error]', err);
    res.status(500).json({ code: -1, msg: 'Failed to create order' });
  }
};

module.exports = createOrder;