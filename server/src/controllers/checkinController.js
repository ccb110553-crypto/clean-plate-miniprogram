const { Checkin, Menu } = require('../models');
const { ok, fail } = require('../utils/response');
const { localDate } = require('../utils/date');
const env = require('../config/env');
const { analyzePlate } = require('../services/aiService');
const { getRuleConfigs } = require('../services/ruleService');
const { changePoints } = require('../services/pointsService');

// 提交光盘打卡（上传照片 + 选择菜品 + AI 预判 + 每日去重 + 防刷限次）
async function submit(req, res) {
  const userId = req.user.id;
  const file = req.file;
  const { menuId, mealType } = req.body;
  if (!file) return fail(res, '请上传餐盘照片');

  const meal = ['breakfast', 'lunch', 'dinner'].includes(mealType) ? mealType : 'lunch';
  const checkinDate = localDate();

  // 读取判定规则（管理端实时可改，改完即生效）
  const configs = await getRuleConfigs();
  const aiEnabled = configs.ai_enabled === undefined ? env.ai.enabled : configs.ai_enabled === 'true';
  const reviewMode = configs.checkin_review_mode || 'manual_with_ai';
  const dailyLimit = parseInt(configs.daily_checkin_limit || '1') || 1;
  const threshold = configs.ai_threshold === undefined ? env.ai.threshold : parseFloat(configs.ai_threshold);

  // 同一餐次去重
  const exists = await Checkin.findOne({ where: { userId, checkinDate, mealType: meal } });
  if (exists) return fail(res, '今天该餐次已提交过打卡，请更换餐次');

  // 每日打卡上限（防刷）
  const todayCount = await Checkin.count({ where: { userId, checkinDate } });
  if (todayCount >= dailyLimit) return fail(res, `今日打卡次数已达上限（${dailyLimit} 次）`);

  // AI 预判（审核模式非纯人工且开关开启时；失败不阻塞提交流程）
  let ai = null;
  if (reviewMode !== 'manual' && aiEnabled) {
    try {
      ai = await analyzePlate(file.path, threshold);
    } catch (e) {
      console.error('[AI] 预判失败:', e.message);
    }
  }

  // 方案3：仅 AI 判为「干净(pass)」自动通过，其余进入人工审核
  const autoApproved = ai && ai.label === 'pass';
  const checkin = await Checkin.create({
    userId,
    imageUrl: '/uploads/' + file.filename,
    menuId: menuId || null,
    mealType: meal,
    status: autoApproved ? 'approved' : 'pending',
    aiScore: ai ? ai.score : null,
    aiLabel: ai ? ai.label : null,
    aiResult: ai,
    checkinDate,
  });

  if (autoApproved) {
    const points = parseInt(configs.points_per_checkin || '10') || 10;
    await changePoints(userId, 'earn', points, 'checkin', { refId: checkin.id, remark: '光盘打卡奖励（AI 自动判定）' });
    await checkin.update({ pointsAwarded: points, reviewedAt: new Date() });
  }

  const result = await Checkin.findByPk(checkin.id, {
    include: [{ model: Menu, as: 'menu', attributes: ['id', 'dishName', 'image', 'category'] }],
  });

  return ok(res, { checkin: result, aiPreview: ai }, autoApproved ? '打卡通过，积分已发放' : '打卡已提交，等待管理员审核');
}

// 我的打卡记录
async function myCheckins(req, res) {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const { rows, count } = await Checkin.findAndCountAll({
    where: { userId },
    include: [{ model: Menu, as: 'menu', attributes: ['id', 'dishName', 'image', 'category'] }],
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return ok(res, { list: rows, total: count, page, pageSize });
}

// 打卡详情
async function detail(req, res) {
  const { id } = req.params;
  const checkin = await Checkin.findOne({ where: { id, userId: req.user.id } });
  if (!checkin) return fail(res, '打卡记录不存在', 1, 404);
  return ok(res, checkin);
}

module.exports = { submit, myCheckins, detail };
