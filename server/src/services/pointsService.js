const { sequelize, User, PointsLog } = require('../models');

/**
 * 积分变动（事务保证一致性）
 * @param {number} userId 用户 id
 * @param {'earn'|'spend'} changeType 收入/支出
 * @param {number} points 正数积分
 * @param {string} source 来源: checkin/exchange/challenge/admin
 * @param {object} opts { refId, remark }
 * @returns {Promise<{balanceAfter:number}>}
 */
async function changePoints(userId, changeType, points, source, opts = {}) {
  if (!points || points <= 0) throw new Error('积分变动值必须为正数');
  const result = await sequelize.transaction(async (t) => {
    const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) throw new Error('用户不存在');

    if (changeType === 'spend') {
      if (user.balancePoints < points) throw new Error('积分余额不足');
      user.balancePoints -= points;
    } else {
      user.balancePoints += points;
      user.totalPoints += points;
    }
    await user.save({ transaction: t });

    const log = await PointsLog.create({
      userId,
      changeType,
      points,
      balanceAfter: user.balancePoints,
      source,
      refId: opts.refId || null,
      remark: opts.remark || null,
    }, { transaction: t });

    return { balanceAfter: user.balancePoints, log };
  });
  return result;
}

module.exports = { changePoints };
