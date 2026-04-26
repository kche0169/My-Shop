const crypto = require('crypto');
const paypal = require('@paypal/checkout-server-sdk');
const paypalConfig = require('../../../config/paypal');

// PayPal环境初始化
let environment = paypalConfig.mode === 'sandbox'
  ? new paypal.core.SandboxEnvironment(paypalConfig.clientId, paypalConfig.clientSecret)
  : new paypal.core.LiveEnvironment(paypalConfig.clientId, paypalConfig.clientSecret);
let paypalClient = new paypal.core.PayPalHttpClient(environment);

// 生成随机盐
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// 生成订单摘要
function generateDigest({ currency, merchantEmail, salt, items, totalPrice }) {
  const itemsString = items.map(item => `${item.pid}|${item.num}|${item.price}`).join('|');
  const rawString = [
    currency,
    merchantEmail,
    salt,
    itemsString,
    totalPrice.toFixed(2)
  ].join('|');
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

// 创建PayPal订单
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
      return_url: `https://s66.iems5718.iecuhk.cc/api/orders/paypal/success`, 
      cancel_url: `https://s66.iems5718.iecuhk.cc/index.html`, 
      shipping_preference: "NO_SHIPPING", 
      user_action: "PAY_NOW" 
    }
  });
  const order = await paypalClient.execute(request);
  return order.result;
}

module.exports = {
  generateSalt,
  generateDigest,
  createPayPalOrder,
  paypalClient
};