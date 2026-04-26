const db = require('../../../db/conn');
const fs = require('fs');
const path = require('path');

const deleteCategory = (req, res) => {
  const { catid } = req.params;
  if (!catid || isNaN(catid)) {
    return res.status(400).json({ code: -1, msg: 'Category ID must be a valid number!' });
  }

  db.serialize(() => {
    db.all('SELECT pid FROM products WHERE catid = ?', [catid], (err, rows) => {
      if (err) {
        console.error('Failed to get products under category: ', err);
        return res.status(500).json({ code: -1, msg: 'Failed to get products under category: ' + err.message });
      }
      if (!rows || rows.length === 0) {
        return db.run('DELETE FROM categories WHERE catid = ?', [catid], function (err) {
          if (err) {
            return res.status(500).json({ code: -1, msg: 'Failed to delete category: ' + err.message });
          }
          if (this.changes === 0) {
            return res.status(400).json({ code: -1, msg: 'Category does not exist, deletion failed!' });
          }
          res.json({ code: 0, msg: 'Category deleted successfully' });
        });
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
        db.run('DELETE FROM products WHERE catid = ?', [catid], (err) => {
          if (err) {
            return res.status(500).json({ code: -1, msg: 'Failed to delete products: ' + err.message });
          }

          db.run('DELETE FROM categories WHERE catid = ?', [catid], function (err) {
            if (err) {
              return res.status(500).json({ code: -1, msg: 'Failed to delete category: ' + err.message });
            }
            if (this.changes === 0) {
              return res.status(400).json({ code: -1, msg: 'Category does not exist, deletion failed!' });
            }
            res.json({ code: 0, msg: 'Category deleted successfully (associated products and images cleaned up)' });
          });
        });
      });
    });
  });
};

module.exports = deleteCategory;
