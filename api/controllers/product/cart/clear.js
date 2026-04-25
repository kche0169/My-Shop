const db = require('../../../../db/conn');
const { validationResult } = require('express-validator');

const cartClear = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { userid } = req.body;
  db.run(`DELETE FROM cart WHERE userid = ?`, [Number(userid)], function(err) {
    if (err) return res.status(500).json({ code: -1, msg: '服务器错误' });
    res.json({ code: 0, msg: '清空购物车成功' });
  });
};

module.exports = cartClear;