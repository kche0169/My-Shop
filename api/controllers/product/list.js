const db = require('../../../db/conn');

const getProductList = (req, res) => {
  const { catid, page = 1, limit = 8 } = req.query;
  
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit) || 8));
  const offset = (pageNum - 1) * pageSize;

  let countQuery = '';
  let countParams = [];
  let dataQuery = '';
  let dataParams = [];

  if (!catid || isNaN(Number(catid)) || Number(catid) < 1) {
    countQuery = 'SELECT COUNT(*) as total FROM products p';
    dataQuery = 'SELECT p.*, c.name as cateName FROM products p LEFT JOIN categories c ON p.catid = c.catid';
  } else {
    countQuery = 'SELECT COUNT(*) as total FROM products p WHERE p.catid = ?';
    countParams = [Number(catid)];
    dataQuery = 'SELECT p.*, c.name as cateName FROM products p LEFT JOIN categories c ON p.catid = c.catid WHERE p.catid = ?';
    dataParams = [Number(catid)];
  }

  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error('商品总数查询失败:', err.message);
      return res.status(500).json({ code: -1, msg: '服务器错误' });
    }

    const total = countResult.total;
    const totalPages = Math.ceil(total / pageSize);

    dataQuery += ' ORDER BY p.pid ASC LIMIT ? OFFSET ?';
    dataParams.push(pageSize, offset);

    db.all(dataQuery, dataParams, (err, rows) => {
      if (err) {
        console.error('商品列表查询失败:', err.message);
        return res.status(500).json({ code: -1, msg: '服务器错误' });
      }

      res.json({
        code: 0,
        msg: `找到 ${rows.length} 个商品`,
        data: rows,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: total,
          totalPages: totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    });
  });
};

module.exports = getProductList;