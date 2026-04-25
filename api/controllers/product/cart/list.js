const db = require('../../../../db/conn');
const { validationResult } = require('express-validator');

const cartList = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { userid } = req.body;
  const query = `
    SELECT c.*, p.name, p.price, p.img_path 
    FROM cart c 
    LEFT JOIN products p ON c.pid = p.pid 
    WHERE c.userid = ?
  `;
  db.all(query, [Number(userid)], (err, rows) => {
    if (err) return res.status(500).json({ code: -1, msg: '服务器错误' });
    res.json({ code: 0, msg: '获取购物车成功', data: rows });
  });
};

module.exports = cartList;