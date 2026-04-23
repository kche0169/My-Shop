/**
 * api/ordersApi.js
 * 独立的订单接口文件 (不修改 productsApi.js)
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
    }]
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

    res.json({
      code: 0,
      msg: 'Order created',
      data: {
        orderId,
        paypalOrderId: paypalOrder.id,
        approvalLink: paypalOrder.links.find(l => l.rel === 'approve')?.href
      }
    });

  } catch (err) {
    console.error('[Orders Create Error]', err);
    res.status(500).json({ code: -1, msg: 'Failed to create order' });
  }
});

// ===================== 核心接口 2: Webhook (占位) =====================
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  console.log('[PayPal Webhook] Received:', req.body);
  res.sendStatus(200);
});

module.exports = router;