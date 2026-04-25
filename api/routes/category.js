const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// 引入保安
const requireAdmin = require('../middlewares/auth');

// 引入4个干活文件
const getAllCategories = require('../controllers/category/getAll');
const addCategory = require('../controllers/category/add');
const editCategory = require('../controllers/category/edit');
const deleteCategory = require('../controllers/category/delete');

// 接口路由（纯网址定义）
router.get('/all', getAllCategories);
router.post('/add', requireAdmin, [body('name').notEmpty().withMessage('Category name cannot be empty').trim()], addCategory);
router.post('/edit', requireAdmin, [body('name').notEmpty().withMessage('Category name cannot be empty').trim(), body('catid').isNumeric().withMessage('Category ID must be a valid number')], editCategory);
router.get('/del/:catid', requireAdmin, deleteCategory);

module.exports = router;