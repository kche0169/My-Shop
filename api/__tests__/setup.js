const request = require('supertest');
const express = require('express');

const db = require('../../config/db');

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    req.app.set('db', db);
    req.app.set('sessionStore', new Map());
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