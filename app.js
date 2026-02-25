const express = require('express');
const path = require('path');
const app = express();
const port = 3000; // 服务端口，后续Apache反向代理指向这个端口

// 基础配置
app.use(express.json()); // 解析json请求
app.use(express.urlencoded({ extended: true })); // 解析表单提交
app.use(express.static(path.join(__dirname, 'public'))); // 静态资源（前端页面）
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 图片访问路径：http://ip:3000/uploads/xxx.jpg
app.use('/admin', express.static(path.join(__dirname, 'admin'))); // 管理员面板访问路径：http://ip:3000/admin

// 路由挂载（后续写的接口都放这里）
const cateApi = require('./api/categoryApi');
const proApi = require('./api/productApi');
app.use('/api/cate', cateApi); // 分类接口：/api/cate/xxx
app.use('/api/pro', proApi);   // 产品接口：/api/pro/xxx

// 启动服务
app.listen(port, () => {
  console.log(`Node服务启动成功：http://localhost:${port}`);
});

module.exports = app;