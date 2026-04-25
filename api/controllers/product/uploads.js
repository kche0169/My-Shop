const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const db = require('../../../db/conn');

// 上传根目录
const UPLOAD_ROOT = path.resolve(__dirname, '../../../public/images');
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true, mode: 0o777 });
}

// 分类ID映射目录名
const getCategoryName = (catid) => {
  const categoryMap = {
    1: 'electronics',
    2: 'fashion',
    3: 'home',
    4: 'sports',
    5: 'carousel'
  };
  return categoryMap[catid] || 'electronics';
};

// 图片处理核心函数
const handleImageUpload = async (pid, catid, fileBuffer) => {
  try {
    const cateName = getCategoryName(catid);
    const productDir = path.join(UPLOAD_ROOT, cateName, String(pid));

    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true, mode: 0o777 });
    }

    const originPath = path.join(productDir, 'origin.jpg');
    const thumbPath = path.join(productDir, 'thumb.jpg');

    await sharp(fileBuffer).jpeg({ quality: 90 }).toFile(originPath);
    await sharp(fileBuffer).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(thumbPath);

    const imgFullPath = `/images/${cateName}/${pid}`;
    await new Promise((resolve, reject) => {
      db.run('UPDATE products SET img_path = ? WHERE pid = ?', [imgFullPath, pid], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return true;
  } catch (err) {
    console.error('[图片上传错误]', err);
    throw err;
  }
};

module.exports = {
  getCategoryName,
  handleImageUpload,
  UPLOAD_ROOT
};