const db = require('../../../../db/conn');
const { validationResult } = require('express-validator');

const cartDelete = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { userid, pid } = req.body;
  db.run(`DELETE FROM cart WHERE userid = ? AND pid = ?`, [Number(userid), Number(pid)], function(err) {
    if (err) return res.status(500).json({ code: -1, msg: '服务器错误' });
    if (this.changes === 0) return res.status(404).json({ code: -1, msg: '购物车商品不存在' });
    res.json({ code: 0, msg: '删除成功' });
  });
};

module.exports = cartDelete;