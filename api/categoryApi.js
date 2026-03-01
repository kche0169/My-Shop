const express = require('express');
const router = express.Router();
const db = require('../db/conn');
const { body, validationResult } = require('express-validator');
const fs = require('fs'); // Added: File operations (clean up images)
const path = require('path'); // Added: Path handling

// 1. Get all categories (keep original logic, optimize response format)
router.get('/all', (req, res) => {
  db.all('SELECT catid, name FROM categories ORDER BY catid ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Failed to get categories: ' + err.message });
    }
    res.json({ code: 0, data: rows, msg: 'Categories retrieved successfully' });
  });
});

// 2. Add new category (Added: Prevent duplicate insertion + precise error prompts)
router.post('/add', [
  body('name').notEmpty().withMessage('Category name cannot be empty').trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }
  
  const { name } = req.body;
  // Modified: INSERT OR IGNORE to prevent duplicate insertion
  db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name], function (err) {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Failed to add category: ' + err.message });
    }
    // Added: Check if insertion succeeded (no changes = category exists)
    if (this.changes === 0) {
      return res.status(400).json({ code: -1, msg: 'Category name already exists, cannot add duplicate!' });
    }
    res.json({ code: 0, msg: 'Category added successfully' });
  });
});

// 3. Edit category (Added: Validate catid validity + precise error prompts)
router.post('/edit', [
  body('name').notEmpty().withMessage('Category name cannot be empty').trim(),
  // Added: Validate catid as valid number
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
    // Added: Check if update succeeded (no changes = category does not exist)
    if (this.changes === 0) {
      return res.status(400).json({ code: -1, msg: 'Category does not exist, edit failed!' });
    }
    res.json({ code: 0, msg: 'Category edited successfully' });
  });
});

// 4. Delete category (Added: Clean up associated product images + validate catid)
router.get('/del/:catid', (req, res) => {
  const { catid } = req.params;
  // Added: Validate catid as valid number
  if (!catid || isNaN(catid)) {
    return res.status(400).json({ code: -1, msg: 'Category ID must be a valid number!' });
  }

  db.serialize(() => {
    // Added: Step 1 - Get all product IDs under the category, delete corresponding images (Phase2B core requirement)
    db.all('SELECT pid FROM products WHERE catid = ?', [catid], (err, rows) => {
      if (err) console.error('Failed to get products under category: ', err);
      rows.forEach(row => {
        const pid = row.pid;
        // Delete original and thumbnail images
        const originPath = path.join(__dirname, '../../uploads/origin', `${pid}_origin.jpg`);
        const thumbPath = path.join(__dirname, '../../uploads/thumb', `${pid}_thumb.jpg`);
        if (fs.existsSync(originPath)) fs.unlinkSync(originPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      });
    });

    // Kept: Step 2 - Delete associated products
    db.run('DELETE FROM products WHERE catid = ?', [catid]);

    // Step 3 - Delete category (Added: Precise error prompts)
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