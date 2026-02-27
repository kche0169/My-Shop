const express = require('express');
const router = express.Router();
const db = require('../db/conn'); // 和categoryApi保持相同的数据库连接路径
const { body, validationResult, param } = require('express-validator'); // 输入验证

// ===================== 商品查询接口 =====================
// 1. 根据分类ID获取商品列表（对应前端 /api/products/list?catid=xx）
router.get('/list', (req, res) => {
  const { catid } = req.query;
  
  // 参数校验：catid必须是数字且大于0
  if (!catid || isNaN(Number(catid)) || Number(catid) < 1) {
    return res.status(400).json({ code: -1, msg: '无效的分类ID（必须是大于0的数字）' });
  }

  const query = 'SELECT * FROM products WHERE catid = ?';
  db.all(query, [Number(catid)], (err, rows) => {
    if (err) {
      console.error('查询商品列表失败：', err.message);
      return res.status(500).json({ code: -1, msg: '服务器错误：' + err.message });
    }
    // 成功返回（即使无数据也返回空数组，避免前端报错）
    res.json({ code: 0, msg: `找到 ${rows.length} 个商品`, data: rows });
  });
});

// 2. 根据商品ID获取商品详情（对应前端 /api/products/detail?pid=xx）
router.get('/detail', (req, res) => {
  const { pid } = req.query;
  
  // 参数校验：pid必须是数字且大于0
  if (!pid || isNaN(Number(pid)) || Number(pid) < 1) {
    return res.status(400).json({ code: -1, msg: '无效的商品ID（必须是大于0的数字）' });
  }

  // 联表查询：获取商品+所属分类名称（和categoryApi关联）
  const query = `
    SELECT p.*, c.name as cateName 
    FROM products p 
    LEFT JOIN categories c ON p.catid = c.catid 
    WHERE p.pid = ?
  `;
  db.get(query, [Number(pid)], (err, row) => {
    if (err) {
      console.error('查询商品详情失败：', err.message);
      return res.status(500).json({ code: -1, msg: '服务器错误：' + err.message });
    }
    if (!row) {
      return res.status(404).json({ code: -1, msg: '该商品不存在' });
    }
    // 成功返回商品详情
    res.json({ code: 0, msg: '查询成功', data: row });
  });
});

// ===================== 商品操作接口（增/改/删） =====================
// 3. 新增商品（输入验证：必填字段非空，价格/分类ID格式合法）
router.post('/add', [
  body('name').notEmpty().withMessage('商品名称不能为空').trim(), // 名称非空+去空格
  body('price').isNumeric().withMessage('价格必须是数字').custom(val => val >= 0).withMessage('价格不能为负数'), // 价格合法
  body('catid').isNumeric().withMessage('分类ID必须是数字').custom(val => val >= 1).withMessage('分类ID必须大于0'), // 关联分类
  body('description').optional().trim(), // 描述可选，但去空格
  body('image').optional().trim() // 图片路径可选，但去空格
], (req, res) => {
  // 验证结果校验
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { name, price, description, image, catid } = req.body;
  const query = `
    INSERT INTO products (name, price, description, image, catid) 
    VALUES (?, ?, ?, ?, ?)
  `;
  // 注意：用function而非箭头函数，才能获取this.lastID（新增商品的ID）
  db.run(query, [name, Number(price), description || '', image || '', Number(catid)], function(err) {
    if (err) {
      console.error('新增商品失败：', err.message);
      return res.status(500).json({ code: -1, msg: '新增失败：' + err.message });
    }
    // 成功返回，附带新增商品的ID
    res.json({ code: 0, msg: '商品新增成功', data: { pid: this.lastID } });
  });
});

// 4. 修改商品（输入验证 + 校验商品ID）
router.post('/edit', [
  body('pid').isNumeric().withMessage('商品ID必须是数字').custom(val => val >= 1).withMessage('商品ID必须大于0'),
  body('name').notEmpty().withMessage('商品名称不能为空').trim(),
  body('price').isNumeric().withMessage('价格必须是数字').custom(val => val >= 0).withMessage('价格不能为负数'),
  body('catid').isNumeric().withMessage('分类ID必须是数字').custom(val => val >= 1).withMessage('分类ID必须大于0'),
  body('description').optional().trim(),
  body('image').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { pid, name, price, description, image, catid } = req.body;
  const query = `
    UPDATE products 
    SET name = ?, price = ?, description = ?, image = ?, catid = ? 
    WHERE pid = ?
  `;
  // 校验修改结果：this.changes 表示受影响的行数
  db.run(query, [name, Number(price), description || '', image || '', Number(catid), Number(pid)], function(err) {
    if (err) {
      console.error('修改商品失败：', err.message);
      return res.status(500).json({ code: -1, msg: '修改失败：' + err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ code: -1, msg: '该商品不存在，修改失败' });
    }
    res.json({ code: 0, msg: '商品修改成功' });
  });
});

// 5. 删除商品（RESTful规范：用DELETE方法，参数从URL路径获取）
router.delete('/del/:pid', [
  // 路径参数验证：pid必须是数字且大于0
  param('pid').isNumeric().withMessage('商品ID必须是数字').custom(val => val >= 1).withMessage('商品ID必须大于0')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { pid } = req.params;
  const query = 'DELETE FROM products WHERE pid = ?';
  // 校验删除结果：this.changes 表示受影响的行数
  db.run(query, [Number(pid)], function(err) {
    if (err) {
      console.error('删除商品失败：', err.message);
      return res.status(500).json({ code: -1, msg: '删除失败：' + err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ code: -1, msg: '该商品不存在，删除失败' });
    }
    res.json({ code: 0, msg: '商品删除成功' });
  });
});

// ===================== 购物车接口（可选） =====================
// 6. 加入购物车（和categoryApi风格一致）
router.post('/cart/add', [
  body('userid').isNumeric().withMessage('用户ID必须是数字').custom(val => val >= 1).withMessage('用户ID必须大于0'),
  body('pid').isNumeric().withMessage('商品ID必须是数字').custom(val => val >= 1).withMessage('商品ID必须大于0'),
  body('num').isNumeric().withMessage('数量必须是数字').custom(val => val >= 1).withMessage('数量必须大于0')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { userid, pid, num } = req.body;
  // 先校验商品是否存在（避免添加不存在的商品到购物车）
  db.get('SELECT pid FROM products WHERE pid = ?', [Number(pid)], (err, row) => {
    if (err) {
      console.error('校验商品失败：', err.message);
      return res.status(500).json({ code: -1, msg: '服务器错误：' + err.message });
    }
    if (!row) {
      return res.status(404).json({ code: -1, msg: '该商品不存在，无法加入购物车' });
    }

    // 商品存在，插入购物车
    const query = 'INSERT INTO cart (userid, pid, num) VALUES (?, ?, ?)';
    db.run(query, [Number(userid), Number(pid), Number(num)], function(err) {
      if (err) {
        console.error('加入购物车失败：', err.message);
        return res.status(500).json({ code: -1, msg: '加入购物车失败：' + err.message });
      }
      res.json({ code: 0, msg: '加入购物车成功', data: { cartId: this.lastID } });
    });
  });
});

module.exports = router;