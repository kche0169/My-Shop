const db = require('../../../db/conn');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { handleImageUpload, getCategoryName, UPLOAD_ROOT } = require('./upload');

const editProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { pid, name, price, description, catid } = req.body;
  const pidNum = Number(pid);
  const catidNum = Number(catid);

  try {
    const updateResult = await new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE products 
        SET name = ?, price = ?, description = ?, catid = ? 
        WHERE pid = ?
      `;
      db.run(updateQuery, [name, Number(price), description || '', catidNum, pidNum], function(err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    if (updateResult === 0) {
      return res.status(404).json({ code: -1, msg: '商品不存在' });
    }

    if (req.file) {
      const oldCateName = getCategoryName(catidNum);
      const productDir = path.join(UPLOAD_ROOT, oldCateName, String(pidNum));
      if (fs.existsSync(productDir)) {
        const oldOrigin = path.join(productDir, 'origin.jpg');
        const oldThumb = path.join(productDir, 'thumb.jpg');
        if (fs.existsSync(oldOrigin)) fs.unlinkSync(oldOrigin);
        if (fs.existsSync(oldThumb)) fs.unlinkSync(oldThumb);
      }
      await handleImageUpload(pidNum, catidNum, req.file.buffer);
    }

    res.json({ code: 0, msg: '商品编辑成功' });
  } catch (err) {
    console.error('编辑商品失败:', err);
    res.status(500).json({ code: -1, msg: '编辑失败' });
  }
};

module.exports = editProduct;