const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const { auth, requireAdmin } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

const authController = require('../controllers/authController');
const checkinController = require('../controllers/checkinController');
const pointsController = require('../controllers/pointsController');
const shopController = require('../controllers/shopController');
const challengeController = require('../controllers/challengeController');
const canteenController = require('../controllers/canteenController');
const adminController = require('../controllers/adminController');
const contentAdminController = require('../controllers/contentAdminController');

// 图片上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `plate-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('只允许上传图片文件'));
  },
});

// 菜品图片上传（存到 uploads/dishes/）
fs.mkdirSync(path.join(env.uploadDir, 'dishes'), { recursive: true });
const dishStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(env.uploadDir, 'dishes')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `dish-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const dishUpload = multer({
  storage: dishStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('只允许上传图片文件'));
  },
});

// 商品图片上传（存到 uploads/products/）
fs.mkdirSync(path.join(env.uploadDir, 'products'), { recursive: true });
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(env.uploadDir, 'products')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('只允许上传图片文件'));
  },
});

const router = express.Router();

// ===== 认证 =====
router.post('/auth/register', asyncHandler(authController.register));
router.post('/auth/login', asyncHandler(authController.login));
router.get('/auth/me', auth, asyncHandler(authController.me));

// ===== 学生端 =====
router.post('/checkins', auth, upload.single('image'), asyncHandler(checkinController.submit));
router.get('/checkins', auth, asyncHandler(checkinController.myCheckins));
router.get('/checkins/:id', auth, asyncHandler(checkinController.detail));

router.get('/points', auth, asyncHandler(pointsController.myPoints));
router.get('/points/logs', auth, asyncHandler(pointsController.myLogs));

router.get('/products', auth, asyncHandler(shopController.listProducts));
router.post('/orders', auth, asyncHandler(shopController.createOrder));
router.get('/orders', auth, asyncHandler(shopController.myOrders));
router.post('/orders/:id/cancel', auth, asyncHandler(shopController.cancelOrder));

router.get('/challenges', asyncHandler(challengeController.listChallenges));
router.post('/challenges/:id/join', auth, asyncHandler(challengeController.join));
router.get('/challenges/:id/ranking', asyncHandler(challengeController.ranking));
router.get('/challenges/:id/status', auth, asyncHandler(challengeController.myStatus));

router.get('/menus', asyncHandler(canteenController.listMenus));
router.get('/recipes', asyncHandler(canteenController.listRecipes));

// ===== 管理端 =====
router.get('/admin/checkins', auth, requireAdmin, asyncHandler(adminController.listCheckins));
router.post('/admin/checkins/:id/review', auth, requireAdmin, asyncHandler(adminController.reviewCheckin));

router.get('/admin/orders', auth, requireAdmin, asyncHandler(adminController.listOrders));
router.post('/admin/orders/:id/handle', auth, requireAdmin, asyncHandler(adminController.handleOrder));

router.get('/admin/rule-configs', auth, requireAdmin, asyncHandler(adminController.getRuleConfigs));
router.put('/admin/rule-configs', auth, requireAdmin, asyncHandler(adminController.updateRuleConfigs));

router.get('/admin/users', auth, requireAdmin, asyncHandler(adminController.listUsers));
router.get('/admin/user-filters', auth, requireAdmin, asyncHandler(adminController.userFilters));
router.post('/admin/users/:id/toggle', auth, requireAdmin, asyncHandler(adminController.toggleUserStatus));

router.get('/admin/dashboard', auth, requireAdmin, asyncHandler(adminController.statsDashboard));

// ===== 管理端 - 菜单管理 =====
router.get('/admin/menus', auth, requireAdmin, asyncHandler(adminController.listAdminMenus));
router.post('/admin/menus', auth, requireAdmin, dishUpload.single('image'), asyncHandler(adminController.createMenu));
router.put('/admin/menus/:id', auth, requireAdmin, dishUpload.single('image'), asyncHandler(adminController.updateMenu));
router.post('/admin/menus/:id/toggle', auth, requireAdmin, asyncHandler(adminController.toggleMenuStatus));
router.delete('/admin/menus/:id', auth, requireAdmin, asyncHandler(adminController.deleteMenu));

// ===== 管理端 - 挑战活动管理 =====
router.get('/admin/challenges', auth, requireAdmin, asyncHandler(contentAdminController.listChallenges));
router.post('/admin/challenges', auth, requireAdmin, asyncHandler(contentAdminController.createChallenge));
router.put('/admin/challenges/:id', auth, requireAdmin, asyncHandler(contentAdminController.updateChallenge));
router.delete('/admin/challenges/:id', auth, requireAdmin, asyncHandler(contentAdminController.deleteChallenge));
router.get('/admin/challenges/:id/participants', auth, requireAdmin, asyncHandler(contentAdminController.listChallengeParticipants));
router.post('/admin/challenges/:id/participants/:participantId/toggle', auth, requireAdmin, asyncHandler(contentAdminController.toggleChallengeParticipant));

// ===== 管理端 - 商城商品管理 =====
router.get('/admin/products', auth, requireAdmin, asyncHandler(contentAdminController.listProducts));
router.post('/admin/products', auth, requireAdmin, productUpload.single('image'), asyncHandler(contentAdminController.createProduct));
router.put('/admin/products/:id', auth, requireAdmin, productUpload.single('image'), asyncHandler(contentAdminController.updateProduct));
router.post('/admin/products/:id/toggle', auth, requireAdmin, asyncHandler(contentAdminController.toggleProduct));
router.delete('/admin/products/:id', auth, requireAdmin, asyncHandler(contentAdminController.deleteProduct));

// ===== 管理端 - 食谱推荐管理 =====
router.get('/admin/recipes', auth, requireAdmin, asyncHandler(contentAdminController.listRecipes));
router.post('/admin/recipes', auth, requireAdmin, asyncHandler(contentAdminController.createRecipe));
router.put('/admin/recipes/:id', auth, requireAdmin, asyncHandler(contentAdminController.updateRecipe));
router.delete('/admin/recipes/:id', auth, requireAdmin, asyncHandler(contentAdminController.deleteRecipe));

module.exports = router;
