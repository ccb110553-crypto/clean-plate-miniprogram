const express = require('express');
const multer = require('multer');
const path = require('path');
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

module.exports = router;
