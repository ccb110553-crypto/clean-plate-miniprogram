const { Checkin, Menu } = require('../models');
const { ok, fail } = require('../utils/response');
const { localDate } = require('../utils/date');
const env = require('../config/env');
const { analyzePlate } = require('../services/aiService');

// 提交光盘打卡（上传照片 + 选择菜品 + AI 预判 + 每日去重）
async function submit(req, res) {
  const userId = req.user.id;
  const file = req.file;
  const { menuId } = req.body;
  if (!file) return fail(res, '请上传餐盘照片');

  const checkinDate = localDate();
  const exists = await Checkin.findOne({ where: { userId, checkinDate } });
  if (exists) return fail(res, '今天已提交过打卡，请明天再来');

  // AI 预判（失败不阻塞提交流程）
  let ai = null;
  if (env.ai.enabled) {
    try {
      ai = await analyzePlate(file.path);
    } catch (e) {
      console.error('[AI] 预判失败:', e.message);
    }
  }

  const checkin = await Checkin.create({
    userId,
    imageUrl: '/uploads/' + file.filename,
    menuId: menuId || null,
    status: 'pending',
    aiScore: ai ? ai.score : null,
    aiLabel: ai ? ai.label : null,
    aiResult: ai,
    checkinDate,
  });

  const result = await Checkin.findByPk(checkin.id, {
    include: [{ model: Menu, as: 'menu', attributes: ['id', 'dishName', 'image', 'category'] }],
  });

  return ok(res, { checkin: result, aiPreview: ai }, '打卡已提交，等待管理员审核');
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
