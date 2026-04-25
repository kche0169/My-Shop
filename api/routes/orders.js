const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// 引入管理员保安
const requireAdmin = require('../middlewares/auth');

// 引入所有订单控制器
const createOrder = require('../controllers/order/create');
const orderWebhook = require('../controllers/order/webhook');
const paySuccess = require('../controllers/order/success');
const adminGetAllOrders = require('../controllers/order/adminAll');
const userGetRecentOrders = require('../controllers/order/userRecent');

// 订单接口路由
router.post('/create', [
  body('userid').isNumeric().withMessage('User ID required').custom(val => val >= 1),
  body('items').isArray({ min: 1 }).withMessage('Cart items required')
], createOrder);

router.post('/webhook', express.raw({ type: 'application/json' }), orderWebhook);
router.get('/paypal/success', paySuccess);
router.get('/admin/all', requireAdmin, adminGetAllOrders);
router.get('/user/recent', userGetRecentOrders);

module.exports = router;