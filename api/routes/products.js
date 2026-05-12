const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, param } = require('express-validator');
const requireAdmin = require('../middlewares/auth');

// 上传配置
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('仅支持JPG/PNG'), false);
  }
}).single('proImg');

// 引入控制器
const getProductList = require('../controllers/product/list');
const getProductDetail = require('../controllers/product/detail');
const addProduct = require('../controllers/product/add');
const editProduct = require('../controllers/product/edit');
const deleteProduct = require('../controllers/product/delete');
const seoProductDetail = require('../controllers/product/seoDetail');

// 购物车
const cartAdd = require('../controllers/product/cart/add');
const cartList = require('../controllers/product/cart/list');
const cartUpdate = require('../controllers/product/cart/update');
const cartDelete = require('../controllers/product/cart/delete');
const cartClear = require('../controllers/product/cart/clear');

// 商品接口
router.get('/list', getProductList);
router.get('/detail', getProductDetail);
router.post('/add', requireAdmin, upload, addProduct);
router.post('/edit', requireAdmin, upload, editProduct);
router.get('/del/:pid', requireAdmin, [param('pid').isNumeric().withMessage('商品ID不合法')], deleteProduct);

// SEO 友好 URL - 商品详情 /:catId-name/:pid-name
router.get('/seo/:catIdName/:productIdName', seoProductDetail);

// 购物车接口
router.post('/cart/add', [body('userid').isNumeric(), body('pid').isNumeric(), body('num').isNumeric()], cartAdd);
router.post('/cart/list', [body('userid').isNumeric()], cartList);
router.post('/cart/update', [body('userid').isNumeric(), body('pid').isNumeric(), body('num').isNumeric()], cartUpdate);
router.post('/cart/delete', [body('userid').isNumeric(), body('pid').isNumeric()], cartDelete);
router.post('/cart/clear', [body('userid').isNumeric()], cartClear);

module.exports = router;