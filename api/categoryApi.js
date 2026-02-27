const express = require('express');
const router = express.Router();
const db = require('../db/conn');
const { body, validationResult } = require('express-validator'); // 输入验证

// 1. 获取所有分类
router.get('/all', (req, res) => {
  db.all('SELECT * FROM categories', (err, rows) => {
    if (err) res.status(500).json({ code: -1, msg: err.message });
    else res.json({ code: 0, data: rows });
  });
});

// 2. 新增分类（输入验证：分类名不能为空）
router.post('/add', [
  body('name').notEmpty().withMessage('分类名不能为空').trim() // 输入清洗+验证
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ msg: errors.array()[0].msg });
  
  const { name } = req.body;
  db.run('INSERT INTO categories (name) VALUES (?)', [name], (err) => {
    if (err) res.json({ code: -1, msg: '分类已存在/新增失败' });
    else res.json({ code: 0, msg: '分类新增成功' });
  });
});

// 3. 修改分类
router.post('/edit', [
  body('name').notEmpty().withMessage('分类名不能为空').trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ msg: errors.array()[0].msg });
  
  const { catid, name } = req.body;
  db.run('UPDATE categories SET name = ? WHERE catid = ?', [name, catid], (err) => {
    if (err) res.json({ code: -1, msg: '修改失败' });
    else res.json({ code: 0, msg: '分类修改成功' });
  });
});

// 4. 删除分类（先删关联产品）
router.get('/del/:catid', (req, res) => {
  const { catid } = req.params;
  db.serialize(() => {
    db.run('DELETE FROM products WHERE catid = ?', [catid]);
    db.run('DELETE FROM categories WHERE catid = ?', [catid], (err) => {
      if (err) res.json({ code: -1, msg: '删除失败' });
      else res.json({ code: 0, msg: '分类删除成功' });
    });
  });
});

module.exports = router;