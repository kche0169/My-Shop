const express = require('express');
const router = express.Router();
const db = require('../db/conn'); 
const { body, validationResult, param } = require('express-validator'); 
const multer = require('multer');
const sharp = require('sharp');
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

// ===================== Image Upload Configuration (Adapt to public/images structure) =====================
// Fix: Unified upload root directory (public/images)
const UPLOAD_ROOT = path.resolve(__dirname, '../public/images');
// Ensure the root upload directory exists (create if not)
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true, mode: 0o777 }); 
}

// Map catid to category name (match your public/images directory structure)
const getCategoryName = (catid) => {
  const categoryMap = {
    1: 'electronics',
    2: 'fashion',
    3: 'home',
    4: 'sports',
    5: 'carousel' // Add if needed, align with your actual category directory
  };
  return categoryMap[catid] || 'electronics'; // Default to electronics
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Only jpg/png format images are supported!');
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
}).single('proImg'); 

// Fix: Unified image processing function (adapt to category directory)
const handleImageUpload = async (pid, catid, fileBuffer) => {
  try {
    // Log start of image processing
    console.log(`[handleImageUpload] Starting image processing for product ID: ${pid}, category ID: ${catid}`);
    
    // 1. Get category name by catid
    const cateName = getCategoryName(catid);
    console.log(`[handleImageUpload] Mapped category ID ${catid} to category name: ${cateName}`);
    
    // 2. Product-specific folder path: public/images/[cateName]/[PID]
    const productDir = path.join(UPLOAD_ROOT, cateName, String(pid));
    console.log(`[handleImageUpload] Target product directory: ${productDir}`);
    
    // 3. Create folder (force recursive creation + permission)
    if (!fs.existsSync(productDir)) {
      console.log(`[handleImageUpload] Product directory does not exist, creating: ${productDir}`);
      fs.mkdirSync(productDir, { recursive: true, mode: 0o777 });
      console.log(`[handleImageUpload] Product directory created successfully: ${productDir}`);
    } else {
      console.log(`[handleImageUpload] Product directory already exists: ${productDir}`);
    }

    // Verify directory creation
    if (!fs.existsSync(productDir)) {
      throw new Error(`Product directory creation failed: ${productDir}`);
    }

    // 4. Image paths (absolute)
    const originPath = path.join(productDir, 'origin.jpg');
    const thumbPath = path.join(productDir, 'thumb.jpg');
    console.log(`[handleImageUpload] Origin image path: ${originPath}`);
    console.log(`[handleImageUpload] Thumbnail image path: ${thumbPath}`);

    // 5. Generate images (ensure sharp processes the buffer correctly)
    console.log(`[handleImageUpload] Starting to process origin image with sharp`);
    await sharp(fileBuffer)
      .jpeg({ quality: 90 })
      .toFile(originPath);
    console.log(`[handleImageUpload] Origin image generated: ${originPath}`);

    console.log(`[handleImageUpload] Starting to process thumbnail image with sharp`);
    await sharp(fileBuffer)
      .resize(300, 300, { fit: 'cover', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);
    console.log(`[handleImageUpload] Thumbnail image generated: ${thumbPath}`);

    // Verify file exists
    console.log(`[handleImageUpload] Verifying image files exist`);
    const originExists = fs.existsSync(originPath);
    const thumbExists = fs.existsSync(thumbPath);
    console.log(`[handleImageUpload] Origin image exists: ${originExists}, Thumbnail exists: ${thumbExists}`);

    if (!originExists || !thumbExists) {
      throw new Error('Image file not generated successfully');
    }

    // Update database image path (store full access path: /images/[cateName]/[PID])
    const imgFullPath = `/images/${cateName}/${pid}`;
    console.log(`[handleImageUpload] Updating database with image path: ${imgFullPath} for product ID: ${pid}`);
    
    await new Promise((resolve, reject) => {
      db.run('UPDATE products SET img_path = ? WHERE pid = ?', [imgFullPath, pid], (err) => {
        if (err) {
          console.error(`[handleImageUpload] Database update failed for product ID ${pid}: ${err.message}`);
          reject(err);
        } else {
          console.log(`[handleImageUpload] Database updated successfully for product ID: ${pid}`);
          resolve();
        }
      });
    });

    console.log(`[handleImageUpload] Image processing completed successfully for product ID: ${pid}`);
    return true;
  } catch (err) {
    console.error(`[handleImageUpload] Image processing failed for product ID: ${pid} - Error: ${err.message}`);
    throw err; 
  }
};

// ===================== Product Query API (Unchanged) =====================
router.get('/list', (req, res) => {
  const { catid } = req.query;
  let query = '';
  let params = [];

  if (!catid || isNaN(Number(catid)) || Number(catid) < 1) {
    query = 'SELECT p.*, c.name as cateName FROM products p LEFT JOIN categories c ON p.catid = c.catid';
  } else {
    query = 'SELECT p.*, c.name as cateName FROM products p LEFT JOIN categories c ON p.catid = c.catid WHERE p.catid = ?';
    params = [Number(catid)];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Failed to query product list:', err.message);
      return res.status(500).json({ code: -1, msg: 'Server error: ' + err.message });
    }
    res.json({ code: 0, msg: `Found ${rows.length} products`, data: rows });
  });
});

router.get('/detail', (req, res) => {
  const { pid } = req.query;
  
  if (!pid || isNaN(Number(pid)) || Number(pid) < 1) {
    return res.status(400).json({ code: -1, msg: 'Invalid product ID (must be a number greater than 0)' });
  }

  const query = `
    SELECT p.*, c.name as cateName 
    FROM products p 
    LEFT JOIN categories c ON p.catid = c.catid 
    WHERE p.pid = ?
  `;
  db.get(query, [Number(pid)], (err, row) => {
    if (err) {
      console.error('Failed to query product details:', err.message);
      return res.status(500).json({ code: -1, msg: 'Server error: ' + err.message });
    }
    if (!row) {
      return res.status(404).json({ code: -1, msg: 'This product does not exist' });
    }
    res.json({ code: 0, msg: 'Query successful', data: row });
  });
});

// ===================== Add Product (PROTECTED) =====================
router.post('/add', requireAdmin, (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        code: -1, 
        msg: err.code === 'INVALID_FILE_TYPE' ? err.message : 'File upload failed: ' + err.message 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
    }

    const { name, price, description, catid } = req.body;
    const catidNum = Number(catid);
    let imgPath = ''; 

    try {
      // Step 1: Insert product basic info
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

      // Step 2: Process image if uploaded (pass catid)
      if (req.file) {
        await handleImageUpload(insertId, catidNum, req.file.buffer);
        imgPath = `/images/${getCategoryName(catidNum)}/${insertId}`;
      }

      res.json({ code: 0, msg: 'Product added successfully', data: { pid: insertId } });
    } catch (err) {
      console.error('Add product failed:', err.message);
      res.status(500).json({ code: -1, msg: 'Add failed: ' + err.message });
    }
  });
});

// ===================== Edit Product (PROTECTED) =====================
router.post('/edit', requireAdmin, (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        code: -1, 
        msg: err.code === 'INVALID_FILE_TYPE' ? err.message : 'File upload failed: ' + err.message 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
    }

    const { pid, name, price, description, catid } = req.body;
    const pidNum = Number(pid);
    const catidNum = Number(catid);

    try {
      // Step 1: Update product basic info
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
        return res.status(404).json({ code: -1, msg: 'This product does not exist, edit failed' });
      }

      // Step 2: Update image if uploaded
      if (req.file) {
        // Delete old images first
        const oldCateName = getCategoryName(catidNum);
        const productDir = path.join(UPLOAD_ROOT, oldCateName, String(pidNum));
        if (fs.existsSync(productDir)) {
          const oldOrigin = path.join(productDir, 'origin.jpg');
          const oldThumb = path.join(productDir, 'thumb.jpg');
          if (fs.existsSync(oldOrigin)) fs.unlinkSync(oldOrigin);
          if (fs.existsSync(oldThumb)) fs.unlinkSync(oldThumb);
        }
        // Generate new images (pass catid)
        await handleImageUpload(pidNum, catidNum, req.file.buffer);
      }

      res.json({ code: 0, msg: 'Product edited successfully' });
    } catch (err) {
      console.error('Edit product failed:', err.message);
      res.status(500).json({ code: -1, msg: 'Edit failed: ' + err.message });
    }
  });
});

// ===================== Delete Product (PROTECTED) =====================
router.get('/del/:pid', requireAdmin, [
  param('pid').isNumeric().withMessage('Product ID must be a number').custom(val => val >= 1).withMessage('Product ID must be greater than 0')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { pid } = req.params;
  const pidNum = Number(pid);

  try {
    // Step 1: Get product's catid first (to locate image directory)
    const product = await new Promise((resolve, reject) => {
      db.get('SELECT catid FROM products WHERE pid = ?', [pidNum], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!product) {
      return res.status(404).json({ code: -1, msg: 'This product does not exist, delete failed' });
    }

    // Step 2: Delete product folder and images
    const cateName = getCategoryName(product.catid);
    const productDir = path.join(UPLOAD_ROOT, cateName, String(pidNum));
    if (fs.existsSync(productDir)) {
      if (process.version < 'v14.14.0') {
        const deleteDir = (dir) => {
          if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(file => {
              const curPath = path.join(dir, file);
              if (fs.lstatSync(curPath).isDirectory()) {
                deleteDir(curPath);
              } else {
                fs.unlinkSync(curPath);
              }
            });
            fs.rmdirSync(dir);
          }
        };
        deleteDir(productDir);
      } else {
        fs.rmSync(productDir, { recursive: true, force: true });
      }
    }

    // Step 3: Delete product from database
    const deleteResult = await new Promise((resolve, reject) => {
      const query = 'DELETE FROM products WHERE pid = ?';
      db.run(query, [pidNum], function(err) {
        if (err) reject(err);
        resolve(this.changes);
      });
    });

    if (deleteResult === 0) {
      return res.status(404).json({ code: -1, msg: 'This product does not exist, delete failed' });
    }

    res.json({ code: 0, msg: 'Product deleted successfully (image folder cleaned up)' });
  } catch (err) {
    console.error('Delete product failed:', err.message);
    res.status(500).json({ code: -1, msg: 'Delete failed: ' + err.message });
  }
});

// ===================== Cart API (Unchanged - User Feature) =====================
router.post('/cart/add', [
  body('userid').isNumeric().withMessage('User ID must be a number').custom(val => val >= 1).withMessage('User ID must be greater than 0'),
  body('pid').isNumeric().withMessage('Product ID must be a number').custom(val => val >= 1).withMessage('Product ID must be greater than 0'),
  body('num').isNumeric().withMessage('Quantity must be a number').custom(val => val >= 1).withMessage('Quantity must be greater than 0')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: -1, msg: errors.array()[0].msg });
  }

  const { userid, pid, num } = req.body;
  db.get('SELECT pid FROM products WHERE pid = ?', [Number(pid)], (err, row) => {
    if (err) {
      console.error('Verify product failed:', err.message);
      return res.status(500).json({ code: -1, msg: 'Server error: ' + err.message });
    }
    if (!row) {
      return res.status(404).json({ code: -1, msg: 'This product does not exist, cannot add to cart' });
    }

    const query = 'INSERT INTO cart (userid, pid, num) VALUES (?, ?, ?)';
    db.run(query, [Number(userid), Number(pid), Number(num)], function(err) {
      if (err) {
        console.error('Add to cart failed:', err.message);
        return res.status(500).json({ code: -1, msg: 'Add to cart failed: ' + err.message });
      }
      res.json({ code: 0, msg: 'Added to cart successfully', data: { cartId: this.lastID } });
    });
  });
});

module.exports = router;