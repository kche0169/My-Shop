const db = require('../../db/conn');

const getAllCategories = (req, res) => {
  db.all('SELECT catid, name FROM categories ORDER BY catid ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Failed to get categories: ' + err.message });
    }
    res.json({ code: 0, data: rows, msg: 'Categories retrieved successfully' });
  });
};

module.exports = getAllCategories;