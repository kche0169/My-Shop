const db = require('../../../db/conn');

const getProductDetail = (req, res) => {
  const { pid } = req.query;
  
  if (!pid || isNaN(Number(pid)) || Number(pid) < 1) {
    return res.status(400).json({ code: -1, msg: '商品ID不合法' });
  }

  const query = `
    SELECT p.*, c.name as cateName 
    FROM products p 
    LEFT JOIN categories c ON p.catid = c.catid 
    WHERE p.pid = ?
  `;
  db.get(query, [Number(pid)], (err, row) => {
    if (err) {
      console.error('商品详情查询失败:', err.message);
      return res.status(500).json({ code: -1, msg: '服务器错误' });
    }
    if (!row) {
      return res.status(404).json({ code: -1, msg: '商品不存在' });
    }
    res.json({ code: 0, msg: '查询成功', data: row });
  });
};

module.exports = getProductDetail;