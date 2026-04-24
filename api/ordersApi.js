/**
 * api/ordersApi.js
 * 独立的订单接口文件
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const crypto = require('crypto');
const paypal = require('@paypal/checkout-server-sdk');
const paypalConfig = require('../config/paypal');

// 初始化 PayPal 环境
let environment = paypalConfig.mode === 'sandbox'
  ? new paypal.core.SandboxEnvironment(paypalConfig.clientId, paypalConfig.clientSecret)
  : new paypal.core.LiveEnvironment(paypalConfig.clientId, paypalConfig.clientSecret);
let paypalClient = new paypal.core.PayPalHttpClient(environment);

// ===================== 内部辅助函数 =====================
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

function generateDigest({ currency, merchantEmail, salt, items, totalPrice }) {
  const itemsString = items.map(item => `${item.pid}|${item.num}|${item.price}`).join('|');
  const rawString = [
    currency,
    merchantEmail,
    salt,
    itemsString,
    totalPrice.toFixed(2)
  ].join('|');
  
  console.log('[generateDigest] Raw:', rawString);
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

// ===================== 已修改：作业任务5 - 加自动跳转链接 =====================
async function createPayPalOrder(totalPrice, currency) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: totalPrice.toFixed(2)
      }
    }],
    application_context: {
      return_url: `http://localhost:3000/api/orders/paypal/success`,
      cancel_url: `http://localhost:3000/index.html`
    }
  });

  const order = await paypalClient.execute(request);
  return order.result;
}

// ===================== 核心接口 1: 创建订单 =====================
router.post('/create', [
  body('userid').isNumeric().withMessage('User ID required').custom(val => val >= 1),
  body('items').isArray({ min: 1 }).withMessage('Cart items required')
], async (req, res) => {
  const errors = require('express-validator').validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { userid, items } = req.body;
  const db = req.app.get('db');

  try {
    // 1. 验证商品并查数据库真实价格
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

    // 2. 生成摘要
    const salt = generateSalt();
    const digest = generateDigest({
      currency: paypalConfig.currency,
      merchantEmail: paypalConfig.merchantEmail,
      salt,
      items: validItems,
      totalPrice
    });

    // 3. 创建 PayPal 订单
    const paypalOrder = await createPayPalOrder(totalPrice, paypalConfig.currency);

    // 4. 存数据库
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

    // 5. 把 paypalOrderId 拼到 approvalLink 里供跳转使用
    const approvalLink = paypalOrder.links.find(l => l.rel === 'approve')?.href;
    const finalApprovalLink = approvalLink ? `${approvalLink}&paypalOrderId=${paypalOrder.id}` : null;

    res.json({
      code: 0,
      msg: 'Order created',
      data: {
        orderId,
        paypalOrderId: paypalOrder.id,
        approvalLink: finalApprovalLink
      }
    });

  } catch (err) {
    console.error('[Orders Create Error]', err);
    res.status(500).json({ code: -1, msg: 'Failed to create order' });
  }
});

// ===================== 核心接口 2: PayPal Webhook =====================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const db = req.app.get('db');
  
  try {
    console.log('[PayPal Webhook] 收到通知');
    
    // 1. 解析 PayPal 发送的事件
    const event = JSON.parse(req.body.toString());
    console.log('[PayPal Webhook] 事件类型:', event.event_type);

    // 只处理支付成功相关的事件
    if (event.event_type !== 'CHECKOUT.ORDER.APPROVED' && event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return res.sendStatus(200);
    }

    // 2. 获取 PayPal 订单 ID
    const paypalOrderId = event.resource.id || event.resource.order_id;
    if (!paypalOrderId) {
      return res.sendStatus(200);
    }

    console.log('[PayPal Webhook] 处理订单:', paypalOrderId);

    // 3. 从数据库查订单
    const order = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE paypal_order_id = ?', [paypalOrderId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!order) {
      console.log('[PayPal Webhook] 数据库里没找到这个订单');
      return res.sendStatus(200);
    }

    // 4. 检查是否已处理过
    if (order.status === 'PAID') {
      console.log('[PayPal Webhook] 这个订单已经付过款了');
      return res.sendStatus(200);
    }

    // 5. 重新生成 Digest 并验证
    const items = JSON.parse(order.items_json);
    const itemsString = items.map(item => `${item.pid}|${item.num}|${item.price}`).join('|');
    const rawString = [
      order.currency,
      order.merchant_email,
      order.salt,
      itemsString,
      order.total_price.toFixed(2)
    ].join('|');
    
    const regeneratedDigest = crypto.createHash('sha256').update(rawString).digest('hex');

    console.log('[PayPal Webhook] 数据库存的 digest:', order.digest);
    console.log('[PayPal Webhook] 重新生成的 digest:', regeneratedDigest);

    // 对比验证
    if (regeneratedDigest !== order.digest) {
      console.error('[PayPal Webhook] ❌ Digest 不匹配！数据可能被篡改');
      return res.sendStatus(400);
    }

    console.log('[PayPal Webhook] ✅ Digest 验证成功！');

    // 6. 更新订单状态为 PAID（作业要求）
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE orders 
        SET status = 'PAID', paid_at = CURRENT_TIMESTAMP, paypal_transaction_id = ?
        WHERE id = ?
      `, [event.resource.id || paypalOrderId, order.id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    console.log('[PayPal Webhook] ✅ 订单状态已更新为 PAID！');
    res.sendStatus(200);

  } catch (err) {
    console.error('[PayPal Webhook 错误]', err);
    res.sendStatus(500);
  }
});

// ===================== 新增：作业任务5 - PayPal支付后自动跳回商店 =====================
router.get('/paypal/success', async (req, res) => {
  const { paypalOrderId } = req.query;
  const db = req.app.get('db');

  if (paypalOrderId) {
    await new Promise((resolve, reject) => {
      db.run(`UPDATE orders SET status = 'PAID' WHERE paypal_order_id = ?`, [paypalOrderId], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  // 自动跳回商店首页
  res.redirect('/index.html');
});

// ===================== 新增：作业任务6 - 管理员面板显示所有订单 =====================
router.get('/admin/all', async (req, res) => {
  const db = req.app.get('db');
  db.all(`SELECT * FROM orders ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.json({ code: -1, msg: 'Failed to fetch orders' });
    res.json({ code: 0, data: rows });
  });
});

// ===================== 新增：作业任务7 - 会员查看最近5条订单 =====================
router.get('/user/recent', async (req, res) => {
  const sessionToken = req.cookies.user;
  if (!sessionToken) return res.status(401).json({ code: -1, msg: 'Please login first' });

  const sessionStore = req.app.get('sessionStore');
  const userId = sessionStore.get(sessionToken);
  if (!userId) return res.status(401).json({ code: -1, msg: 'Invalid session' });

  const db = req.app.get('db');
  db.all(`
    SELECT * FROM orders 
    WHERE userid = ? 
    ORDER BY created_at DESC 
    LIMIT 5
  `, [userId], (err, rows) => {
    if (err) return res.json({ code: -1, msg: 'Failed to fetch orders' });
    res.json({ code: 0, data: rows });
  });
});

module.exports = router;