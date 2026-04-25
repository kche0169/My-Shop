const express = require('express');
const path = require('path');

// 1. 引入拆分的文件
const db = require('./config/db');
const globalMiddlewares = require('./middlewares/global');
const pageRoutes = require('./routes/page');
const userRoutes = require('./routes/user');
const requireAdmin = require('./api/middlewares/auth'); // 你之前的管理员保安

// 2. 会话存储
const sessionStore = new Map();
const app = express();
app.set('sessionStore', sessionStore);
app.set('db', db);
const port = 3000;

// 3. 挂载全局中间件
globalMiddlewares(app);

// 4. 挂载路由
app.use('/', pageRoutes); // 页面路由
app.use('/api', userRoutes); // 用户接口
app.use('/admin', requireAdmin, express.static(path.join(__dirname, 'admin'))); // 管理员页面

// 5. 挂载业务路由（分类/产品/订单）
try {
  const cateApi = require('./api/routes/category');
  const productsApi = require('./api/routes/products');
  const ordersApi = require('./api/routes/orders');
  
  app.use('/api/cate', cateApi);
  app.use('/api/products', productsApi);
  app.use('/api/orders', ordersApi);
  console.log('[SUCCESS] All routes mounted!');
} catch (err) {
  console.error('[ERROR] Route mounting failed:', err.message);
}

// 6. 启动服务
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running: http://localhost:${port}`);
});

// 7. 优雅关闭
process.on('SIGINT', () => {
  db.close(() => process.exit(0));
});

module.exports = { app, db };