const { User, PointsLog } = require('../models');
const { ok } = require('../utils/response');

// 我的积分概览（余额 + 累计）
async function myPoints(req, res) {
  const user = await User.findByPk(req.user.id, {
    attributes: ['balancePoints', 'totalPoints'],
  });
  return ok(res, {
    balancePoints: user.balancePoints,
    totalPoints: user.totalPoints,
  });
}

// 积分流水
async function myLogs(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;

  const { rows, count } = await PointsLog.findAndCountAll({
    where: { userId: req.user.id },
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return ok(res, { list: rows, total: count, page, pageSize });
}

module.exports = { myPoints, myLogs };
