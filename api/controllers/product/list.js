const db = require('../../../db/conn');

const getProductList = (req, res) => {
  const { catid } = req.query;
  let query = '';
  let params = [];

  if (!catid || isNaN(Number(catid)) || Number(catid) < 1) {
    query = 'SELECT p.*, c.name as cateName FROM products p LEFT JOIN categories c ON p.catid = c.catid';
  } else {
    query = 'SELECT p.*, c.name as cateName FROM products p LEFT JOIN categories c ON p.catid = c.catid WHERE p.catid = ?';
    params = [Number(catid)];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('商品列表查询失败:', err.message);
      return res.status(500).json({ code: -1, msg: '服务器错误' });
    }
    res.json({ code: 0, msg: `找到 ${rows.length} 个商品`, data: rows });
  });
};

module.exports = getProductList;