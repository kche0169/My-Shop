const express = require('express');
const router = express.Router();
const db = require('../db/conn');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// ==========================================
// [NEW] Add Admin Authentication Check Logic
// ==========================================
const requireAdmin = (req, res, next) => {
  // Get session store from app
  const sessionStore = req.app.get('sessionStore');
  const sessionToken = req.cookies.user;
  
  if (!sessionToken) return res.status(401).json({ code: -1, msg: 'Access Denied: Login Required' });
  
  const userId = sessionStore.get(sessionToken);
  if (!userId) return res.status(401).json({ code: -1, msg: 'Access Denied: Invalid Session' });
  
  const db = req.app.get('db');
  db.get('SELECT * FROM users WHERE userid = ?', [userId], (err, user) => {
    if (err || !user || user.admin !== 1) {
      return res.status(403).json({ code: -1, msg: 'Access Denied: Admin Only' });
    }
    req.user = user;
    next();
  });
};

// 1. Get all categories (Public access allowed, or make it admin-only as needed)
router.get('/all', (req, res) => {
  db.all('SELECT catid, name FROM categories ORDER BY catid ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Failed to get categories: ' + err.message });
    }
    res.json({ code: 0, data: rows, msg: 'Categories retrieved successfully' });
  });
});

// 2. Add new category (PROTECTED)
router.post('/add', requireAdmin, [
  body('name').notEmpty().withMessage('Category name cannot be empty').trim()
], (req, res) => {
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
});

// 3. Edit category (PROTECTED)
router.post('/edit', requireAdmin, [
  body('name').notEmpty().withMessage('Category name cannot be empty').trim(),
  body('catid').isNumeric().withMessage('Category ID must be a valid number')
], (req, res) => {
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
});

// 4. Delete category (PROTECTED)
router.get('/del/:catid', requireAdmin, (req, res) => {
  const { catid } = req.params;
  if (!catid || isNaN(catid)) {
    return res.status(400).json({ code: -1, msg: 'Category ID must be a valid number!' });
  }

  db.serialize(() => {
    db.all('SELECT pid FROM products WHERE catid = ?', [catid], (err, rows) => {
      if (err) console.error('Failed to get products under category: ', err);
      rows.forEach(row => {
        const pid = row.pid;
        const originPath = path.join(__dirname, '../../uploads/origin', `${pid}_origin.jpg`);
        const thumbPath = path.join(__dirname, '../../uploads/thumb', `${pid}_thumb.jpg`);
        if (fs.existsSync(originPath)) fs.unlinkSync(originPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      });
    });

    db.run('DELETE FROM products WHERE catid = ?', [catid]);

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

module.exports = router;