const db = require('../../db/conn');
const { validationResult } = require('express-validator');

const addCategory = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }
  
  const { name } = req.body;
  db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name], function (err) {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Failed to add category: ' + err.message });
    }
    if (this.changes === 0) {
      return res.status(400).json({ code: -1, msg: 'Category name already exists, cannot add duplicate!' });
    }
    res.json({ code: 0, msg: 'Category added successfully' });
  });
};

module.exports = addCategory;