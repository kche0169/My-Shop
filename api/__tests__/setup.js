const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// 直接使用项目的主数据库连接
const db = require('../../db/conn');

// 全局sessionStore，在整个应用中共享
const sessionStore = new Map();

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use((req, res, next) => {
    req.app.set('db', db);
    req.app.set('sessionStore', sessionStore);
    next();
  });

  const cateApi = require('../routes/category');
  const productsApi = require('../routes/products');
  const ordersApi = require('../routes/orders');
  const userRoutes = require('../../routes/user');

  app.use('/api/cate', cateApi);
  app.use('/api/products', productsApi);
  app.use('/api/orders', ordersApi);
  app.use('/api', userRoutes);

  return app;
}

module.exports = {
  request,
  createTestApp,
  db
};