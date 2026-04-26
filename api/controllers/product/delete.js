const db = require('../../../db/conn');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { getCategoryName, UPLOAD_ROOT } = require('./uploads');

const deleteProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { pid } = req.params;
  const pidNum = Number(pid);

  try {
    const product = await new Promise((resolve, reject) => {
      db.get('SELECT catid FROM products WHERE pid = ?', [pidNum], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!product) {
      return res.status(404).json({ code: -1, msg: '商品不存在' });
    }

    const cateName = getCategoryName(product.catid);
    const productDir = path.join(UPLOAD_ROOT, cateName, String(pidNum));
    if (fs.existsSync(productDir)) {
      fs.rmSync(productDir, { recursive: true, force: true });
    }

    const deleteResult = await new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE pid = ?', [pidNum], function(err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    if (deleteResult === 0) {
      return res.status(404).json({ code: -1, msg: '商品不存在' });
    }

    res.json({ code: 0, msg: '商品删除成功' });
  } catch (err) {
    console.error('删除商品失败:', err);
    res.status(500).json({ code: -1, msg: '删除失败' });
  }
};

module.exports = deleteProduct;