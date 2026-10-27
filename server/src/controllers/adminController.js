const { sequelize, User, Checkin, PointsLog, Order, RuleConfig, MisjudgeSample, Menu } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { ok, fail } = require('../utils/response');
const { changePoints } = require('../services/pointsService');
const { localDate } = require('../utils/date');

// ============ 打卡审核 ============

// 打卡列表（可按状态筛选，含用户信息）
async function listCheckins(req, res) {
  const { status, page = 1, pageSize = 10 } = req.query;
  const where = {};
  if (status) where.status = status;

  const { rows, count } = await Checkin.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'nickname', 'studentNo', 'className', 'dormitory'] },
      { model: Menu, as: 'menu', attributes: ['id', 'dishName', 'image', 'category'] },
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize),
  });

  return ok(res, { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) });
}

// 审核打卡：通过发放积分 / 驳回说明原因
async function reviewCheckin(req, res) {
  const { id } = req.params;
  const { action, reason } = req.body;
  if (!['approve', 'reject'].includes(action)) return fail(res, '无效的审核操作');

  const checkin = await Checkin.findByPk(id);
  if (!checkin) return fail(res, '打卡记录不存在', 1, 404);
  if (checkin.status !== 'pending') return fail(res, '该记录已审核，请勿重复操作');

  let humanResult;
  if (action === 'approve') {
    const cfg = await RuleConfig.findOne({ where: { cfgKey: 'points_per_checkin' } });
    const points = parseInt(cfg ? cfg.cfgValue : '10') || 10;
    await changePoints(checkin.userId, 'earn', points, 'checkin', {
      refId: checkin.id,
      remark: '光盘打卡奖励',
    });
    await checkin.update({
      status: 'approved',
      pointsAwarded: points,
      reviewerId: req.user.id,
      reviewedAt: new Date(),
    });
    humanResult = 'pass';
  } else {
    await checkin.update({
      status: 'rejected',
      rejectReason: reason || '餐盘未光盘，未通过审核',
      reviewerId: req.user.id,
      reviewedAt: new Date(),
    });
    humanResult = 'dirty';
  }

  // 收集误判样本：AI 给出明确结论（非 review）却与人工结果不一致时记录
  if (checkin.aiLabel && checkin.aiLabel !== 'review') {
    await MisjudgeSample.create({
      checkinId: checkin.id,
      imageUrl: checkin.imageUrl,
      aiResult: checkin.aiResult,
      humanResult,
      isMisjudge: checkin.aiLabel !== humanResult ? 1 : 0,
    });
  }

  return ok(res, null, action === 'approve' ? '已通过，积分已发放' : '已驳回');
}

// ============ 兑换订单 ============

async function listOrders(req, res) {
  const { status, page = 1, pageSize = 10 } = req.query;
  const where = {};
  if (status) where.status = status;

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'studentNo', 'className'] }],
    order: [['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize),
  });

  return ok(res, { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) });
}

// 处理订单：发放（生成券码）/ 取消（退还积分）
async function handleOrder(req, res) {
  const { id } = req.params;
  const { action } = req.body;
  const order = await Order.findByPk(id);
  if (!order) return fail(res, '订单不存在', 1, 404);
  if (order.status !== 'pending') return fail(res, '该订单已处理');

  if (action === 'fulfill') {
    const voucherCode = 'V' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    await order.update({
      status: 'fulfilled',
      voucherCode,
      adminId: req.user.id,
      handledAt: new Date(),
    });
    return ok(res, { voucherCode }, '已发放');
  }

  if (action === 'cancel') {
    await changePoints(order.userId, 'earn', order.pointsCost, 'exchange', {
      refId: order.id,
      remark: '管理员取消订单退还积分',
    });
    await order.update({ status: 'cancelled', adminId: req.user.id, handledAt: new Date() });
    return ok(res, null, '已取消并退还积分');
  }

  return fail(res, '无效操作');
}

// ============ 判定规则配置 ============

async function getRuleConfigs(req, res) {
  const configs = await RuleConfig.findAll({ order: [['id', 'ASC']] });
  const map = {};
  configs.forEach((c) => { map[c.cfgKey] = c.cfgValue; });
  return ok(res, map);
}

async function updateRuleConfigs(req, res) {
  const entries = Object.entries(req.body || {});
  for (const [key, value] of entries) {
    const cfg = await RuleConfig.findOne({ where: { cfgKey: key } });
    if (cfg) {
      await cfg.update({ cfgValue: String(value) });
    } else {
      await RuleConfig.create({ cfgKey: key, cfgValue: String(value), description: '' });
    }
  }
  return ok(res, null, '规则配置已更新');
}

// ============ 用户管理 ============

async function listUsers(req, res) {
  const { role, keyword, className, dormitory, page = 1, pageSize = 10 } = req.query;
  const where = {};
  if (role) where.role = role;
  if (className) where.className = className;
  if (dormitory) where.dormitory = dormitory;
  if (keyword) {
    where[Op.or] = [
      { username: { [Op.like]: `%${keyword}%` } },
      { nickname: { [Op.like]: `%${keyword}%` } },
      { studentNo: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    order: [['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize),
  });

  return ok(res, { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) });
}

// 启用/禁用用户
async function toggleUserStatus(req, res) {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) return fail(res, '用户不存在', 1, 404);
  await user.update({ status: user.status === 1 ? 0 : 1 });
  return ok(res, null, user.status === 1 ? '已禁用' : '已启用');
}

// 班级 / 宿舍筛选选项（去重）
async function userFilters(req, res) {
  const classes = await sequelize.query(
    "SELECT DISTINCT class_name AS name FROM users WHERE role='student' AND class_name IS NOT NULL AND class_name != '' ORDER BY class_name",
    { type: QueryTypes.SELECT }
  );
  const dormitories = await sequelize.query(
    "SELECT DISTINCT dormitory AS name FROM users WHERE role='student' AND dormitory IS NOT NULL AND dormitory != '' ORDER BY dormitory",
    { type: QueryTypes.SELECT }
  );
  return ok(res, {
    classes: classes.map((c) => c.name),
    dormitories: dormitories.map((d) => d.name),
  });
}

// ============ 数据大屏统计 ============

async function statsDashboard(req, res) {
  const today = localDate();

  const totalStudents = await User.count({ where: { role: 'student' } });
  const todayCheckins = await Checkin.count({ where: { checkinDate: today } });
  const totalCheckins = await Checkin.count();
  const approvedCheckins = await Checkin.count({ where: { status: 'approved' } });
  const pendingCheckins = await Checkin.count({ where: { status: 'pending' } });
  const approveRate = totalCheckins ? +(approvedCheckins / totalCheckins).toFixed(3) : 0;

  const pointsAgg = await PointsLog.findOne({
    where: { changeType: 'earn', source: 'checkin' },
    attributes: [[sequelize.fn('SUM', sequelize.col('points')), 'total']],
    raw: true,
  });
  const totalPointsAwarded = Number(pointsAgg ? pointsAgg.total : 0) || 0;

  // 减少浪费估算：每次光盘约节省 0.15kg 食物
  const wasteSaved = +(approvedCheckins * 0.15).toFixed(1);

  // 近 7 日打卡趋势
  const trend = await sequelize.query(
    `SELECT checkin_date AS date, COUNT(*) AS total,
            SUM(status='approved') AS approved
     FROM checkins
     WHERE checkin_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY checkin_date ORDER BY checkin_date ASC`,
    { type: QueryTypes.SELECT }
  );

  // 班级统计（学生人数 + 总积分）
  const classStats = await sequelize.query(
    `SELECT class_name AS name, COUNT(*) AS students, SUM(total_points) AS totalPoints
     FROM users WHERE role='student' AND class_name IS NOT NULL AND class_name != ''
     GROUP BY class_name ORDER BY students DESC`,
    { type: QueryTypes.SELECT }
  );

  // 宿舍楼统计（按宿舍号前缀，如 A/B/C 楼）
  const dormStats = await sequelize.query(
    `SELECT LEFT(dormitory, 1) AS name, COUNT(*) AS students, SUM(total_points) AS totalPoints
     FROM users WHERE role='student' AND dormitory IS NOT NULL AND dormitory != ''
     GROUP BY LEFT(dormitory, 1) ORDER BY students DESC`,
    { type: QueryTypes.SELECT }
  );

  // 积分 Top 榜
  const topUsers = await sequelize.query(
    `SELECT id, nickname, balance_points AS balancePoints, total_points AS totalPoints
     FROM users WHERE role='student' ORDER BY total_points DESC LIMIT 10`,
    { type: QueryTypes.SELECT }
  );

  return ok(res, {
    totalStudents,
    todayCheckins,
    totalCheckins,
    approvedCheckins,
    pendingCheckins,
    approveRate,
    totalPointsAwarded,
    wasteSaved,
    trend,
    classStats,
    dormStats,
    topUsers,
  });
}

// ============ 菜单管理 ============

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

// 管理端菜单列表（含下架，按餐次/编号排序）
async function listAdminMenus(req, res) {
  const { mealType, status } = req.query;
  const where = {};
  if (mealType) where.mealType = mealType;
  if (status !== undefined && status !== '') where.status = parseInt(status);

  const menus = await Menu.findAll({ where, order: [['mealType', 'ASC'], ['id', 'ASC']] });
  return ok(res, menus);
}

// 上新菜品（带图片上传）
async function createMenu(req, res) {
  const { mealType, dishName, category, price, isSmall } = req.body;
  if (!VALID_MEAL_TYPES.includes(mealType)) return fail(res, '餐次不合法');
  if (!dishName) return fail(res, '请输入菜名');

  const image = req.file ? '/uploads/dishes/' + req.file.filename : (req.body.image || null);
  const menu = await Menu.create({
    menuDate: localDate(),
    week: 1,
    mealType,
    dishName,
    category: category || '素菜',
    price: price === undefined || price === '' ? 0 : parseFloat(price),
    isSmall: isSmall === '1' || isSmall === 1 || isSmall === 'true' ? 1 : 0,
    image,
    status: 1,
  });
  return ok(res, menu, '上新成功');
}

// 编辑菜品
async function updateMenu(req, res) {
  const { id } = req.params;
  const menu = await Menu.findByPk(id);
  if (!menu) return fail(res, '菜品不存在', 1, 404);

  const { mealType, dishName, category, price, isSmall } = req.body;
  const patch = {};
  if (mealType !== undefined) {
    if (!VALID_MEAL_TYPES.includes(mealType)) return fail(res, '餐次不合法');
    patch.mealType = mealType;
  }
  if (dishName !== undefined) patch.dishName = dishName;
  if (category !== undefined) patch.category = category;
  if (price !== undefined && price !== '') patch.price = parseFloat(price);
  if (isSmall !== undefined) patch.isSmall = (isSmall === '1' || isSmall === 1 || isSmall === 'true') ? 1 : 0;
  if (req.file) patch.image = '/uploads/dishes/' + req.file.filename;
  else if (req.body.image !== undefined) patch.image = req.body.image;

  await menu.update(patch);
  return ok(res, menu, '已更新');
}

// 上架/下架切换
async function toggleMenuStatus(req, res) {
  const { id } = req.params;
  const menu = await Menu.findByPk(id);
  if (!menu) return fail(res, '菜品不存在', 1, 404);

  const next = menu.status === 1 ? 0 : 1;
  await menu.update({ status: next });
  return ok(res, { id: menu.id, status: next }, next === 1 ? '已上架' : '已下架');
}

// 删除菜品
async function deleteMenu(req, res) {
  const { id } = req.params;
  const menu = await Menu.findByPk(id);
  if (!menu) return fail(res, '菜品不存在', 1, 404);
  await menu.destroy();
  return ok(res, null, '已删除');
}

module.exports = {
  listCheckins,
  reviewCheckin,
  listOrders,
  handleOrder,
  getRuleConfigs,
  updateRuleConfigs,
  listUsers,
  toggleUserStatus,
  userFilters,
  statsDashboard,
  listAdminMenus,
  createMenu,
  updateMenu,
  toggleMenuStatus,
  deleteMenu,
};
