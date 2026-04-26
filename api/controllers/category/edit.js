const db = require('../../../db/conn');
const { validationResult } = require('express-validator');

const editCategory = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }
  
  const { catid, name } = req.body;
  db.run('UPDATE categories SET name = ? WHERE catid = ?', [name, catid], function (err) {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Failed to edit category: ' + err.message });
    }
    if (this.changes === 0) {
      return res.status(400).json({ code: -1, msg: 'Category does not exist, edit failed!' });
    }
    res.json({ code: 0, msg: 'Category edited successfully' });
  });
};

module.exports = editCategory;