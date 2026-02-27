/**
 * 最终版 app.js - 适配 products 文件夹
 */
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// 1. 数据库连接
const db = new sqlite3.Database('./shop.db', (err) => {
  if (err) {
    console.error('❌ 数据库连接失败：', err.message);
  } else {
    console.log('✅ SQLite数据库连接成功！');
  }
});

// 2. 跨域配置
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 3. 基础解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. 静态资源托管
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 5. 路由挂载（适配 productsApi.js 文件夹）
try {
  const cateApi = require('./api/categoryApi');
  const productsApi = require('./api/productsApi'); // 改成 productsApi.js（带s）
  app.use('/api/cate', cateApi);
  app.use('/api/products', productsApi); // 接口路径改成 /api/products（带s）
  console.log('✅ 路由挂载成功：/api/cate、/api/products');
} catch (err) {
  console.error('❌ 路由挂载失败：', err.message);
  console.error('   请检查api文件夹下是否有categoryApi.js和productsApi.js文件');
}

// 6. 启动服务
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Node服务启动成功！`);
  console.log(`   服务地址：http://localhost:${port}`);
  console.log(`   分类接口测试：http://localhost:${port}/api/cate/all`);
  console.log(`   产品列表测试：http://localhost:${port}/api/products/list?catid=1`); // 改products
  console.log(`   商品详情测试：http://localhost:${port}/api/products/detail?pid=1`); // 改products
  console.log(`   前端页面访问：http://localhost:${port}`);
});

module.exports = { app, db };