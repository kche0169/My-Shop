const db = require('../../../../db/conn');
const { validationResult } = require('express-validator');

const cartAdd = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { userid, pid, num } = req.body;
  db.get('SELECT pid FROM products WHERE pid = ?', [Number(pid)], (err, row) => {
    if (err) return res.status(500).json({ code: -1, msg: '服务器错误' });
    if (!row) return res.status(404).json({ code: -1, msg: '商品不存在' });

    db.run('INSERT INTO cart (userid, pid, num) VALUES (?, ?, ?)', [Number(userid), Number(pid), Number(num)], function(err) {
      if (err) return res.status(500).json({ code: -1, msg: '加入购物车失败' });
      res.json({ code: 0, msg: '加入购物车成功', data: { cartId: this.lastID } });
    });
  });
};

module.exports = cartAdd;