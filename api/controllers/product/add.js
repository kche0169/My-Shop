const db = require('../../../db/conn');
const { validationResult } = require('express-validator');
const { handleImageUpload } = require('./uploads');

const addProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { name, price, description, catid } = req.body;
  const catidNum = Number(catid);
  let imgPath = '';

  try {
    const insertId = await new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO products (name, price, description, img_path, catid) 
        VALUES (?, ?, ?, ?, ?)
      `;
      db.run(insertQuery, [name, Number(price), description || '', imgPath, catidNum], function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      });
    });

    if (req.file) {
      await handleImageUpload(insertId, catidNum, req.file.buffer);
    }

    res.json({ code: 0, msg: '商品添加成功', data: { pid: insertId } });
  } catch (err) {
    console.error('添加商品失败:', err);
    res.status(500).json({ code: -1, msg: '添加失败' });
  }
};

module.exports = addProduct;