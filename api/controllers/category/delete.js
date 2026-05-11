const db = require('../../../db/conn');
const fs = require('fs');
const path = require('path');

const deleteCategory = (req, res) => {
  const { catid } = req.params;
  const catIdNum = Number(catid);
  if (!catid || isNaN(catIdNum)) {
    return res.status(400).json({ code: -1, msg: 'Category ID must be a valid number!' });
  }

  db.get('SELECT catid FROM categories WHERE catid = ?', [catIdNum], (err, category) => {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Database error: ' + err.message });
    }
    if (!category) {
      return res.status(400).json({ code: -1, msg: 'Category does not exist' });
    }

    db.all('SELECT pid FROM products WHERE catid = ?', [catIdNum], (err, rows) => {
      if (err) {
        return res.status(500).json({ code: -1, msg: 'Failed to get products: ' + err.message });
      }

      if (!rows || rows.length === 0) {
        db.run('DELETE FROM categories WHERE catid = ?', [catIdNum], function (err) {
          if (err) {
            return res.status(500).json({ code: -1, msg: 'Failed to delete category' });
          }
          res.json({ code: 0, msg: 'Category deleted successfully' });
        });
        return;
      }

      const deleteImages = () => {
        return new Promise((resolve) => {
          let deleted = 0;
          if (rows.length === 0) return resolve();

          rows.forEach(row => {
            const pid = row.pid;
            const originPath = path.join(__dirname, '../../../uploads/origin', `${pid}_origin.jpg`);
            const thumbPath = path.join(__dirname, '../../../uploads/thumb', `${pid}_thumb.jpg`);
            try {
              if (fs.existsSync(originPath)) fs.unlinkSync(originPath);
              if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
            } catch (e) {
              console.error(`Failed to delete images for product ${pid}:`, e);
            }
            deleted++;
            if (deleted === rows.length) resolve();
          });
        });
      };

      deleteImages().then(() => {
        db.run('DELETE FROM products WHERE catid = ?', [catIdNum], (err) => {
          if (err) {
            return res.status(500).json({ code: -1, msg: 'Failed to delete products' });
          }

          db.run('DELETE FROM categories WHERE catid = ?', [catIdNum], function (err) {
            if (err) {
              return res.status(500).json({ code: -1, msg: 'Failed to delete category' });
            }
            res.json({ code: 0, msg: 'Category deleted successfully (associated products and images cleaned up)' });
          });
        });
      });
    });
  });
};

module.exports = deleteCategory;