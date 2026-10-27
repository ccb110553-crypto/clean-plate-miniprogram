const { Challenge, ChallengeParticipant, User, Checkin, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { ok, fail } = require('../utils/response');

// 挑战活动列表
async function listChallenges(req, res) {
  const challenges = await Challenge.findAll({
    order: [['status', 'ASC'], ['created_at', 'DESC']],
  });
  return ok(res, challenges);
}

// 报名参与挑战
async function join(req, res) {
  const { id } = req.params;
  const challenge = await Challenge.findByPk(id);
  if (!challenge) return fail(res, '挑战不存在', 1, 404);

  const user = await User.findByPk(req.user.id);

  if (challenge.type === 'personal') {
    const exists = await ChallengeParticipant.findOne({ where: { challengeId: id, userId: user.id } });
    if (exists) {
      if (exists.status === 'blocked') return fail(res, '你已被管理员禁止参加该活动');
      return fail(res, '你已参与该挑战');
    }
    await ChallengeParticipant.create({ challengeId: id, userId: user.id });
    return ok(res, null, '报名成功');
  }

  // 班级 / 宿舍挑战：以班级或宿舍为队伍
  const groupKey = challenge.type === 'class' ? user.className : user.dormitory;
  if (!groupKey) return fail(res, challenge.type === 'class' ? '请先在个人资料中完善班级信息' : '请先在个人资料中完善宿舍信息');

  const exists = await ChallengeParticipant.findOne({ where: { challengeId: id, groupKey } });
  if (exists) {
    if (exists.status === 'blocked') return fail(res, '你的队伍已被管理员禁止参加该活动');
    return ok(res, null, '报名成功');
  }
  await ChallengeParticipant.create({
    challengeId: id,
    userId: user.id,
    groupKey,
    groupName: groupKey,
  });
  return ok(res, null, '报名成功');
}

// 实时榜单：以报名记录为准，积分取用户累计总积分（不受商城消费影响）
async function ranking(req, res) {
  const { id } = req.params;
  const challenge = await Challenge.findByPk(id);
  if (!challenge) return fail(res, '挑战不存在', 1, 404);

  let sql;
  if (challenge.type === 'personal') {
    // 报名的人按总积分排序（报名即出现，积分用累计 total_points）
    sql = `
      SELECT u.id, u.nickname, u.avatar, u.class_name AS className, u.dormitory,
             u.total_points AS totalPoints,
             (SELECT COUNT(*) FROM checkins c WHERE c.user_id = u.id AND c.status='approved') AS times
      FROM challenge_participants cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.challenge_id = :id AND cp.status = 'active'
      ORDER BY u.total_points DESC, u.id ASC
      LIMIT 50`;
  } else if (challenge.type === 'class') {
    // 已报名的班级，成员累计总积分之和
    sql = `
      SELECT u.class_name AS name, SUM(u.total_points) AS totalPoints, COUNT(u.id) AS members
      FROM users u
      WHERE u.role='student' AND u.class_name IS NOT NULL AND u.class_name != ''
        AND u.class_name IN (SELECT DISTINCT group_key FROM challenge_participants WHERE challenge_id = :id AND status='active')
      GROUP BY u.class_name
      ORDER BY totalPoints DESC
      LIMIT 50`;
  } else {
    // 已报名的宿舍，成员累计总积分之和
    sql = `
      SELECT u.dormitory AS name, SUM(u.total_points) AS totalPoints, COUNT(u.id) AS members
      FROM users u
      WHERE u.role='student' AND u.dormitory IS NOT NULL AND u.dormitory != ''
        AND u.dormitory IN (SELECT DISTINCT group_key FROM challenge_participants WHERE challenge_id = :id AND status='active')
      GROUP BY u.dormitory
      ORDER BY totalPoints DESC
      LIMIT 50`;
  }

  const rows = await sequelize.query(sql, { replacements: { id }, type: QueryTypes.SELECT });
  return ok(res, rows);
}

// 我的挑战参与状态 + 排名
async function myStatus(req, res) {
  const { id } = req.params;
  const challenge = await Challenge.findByPk(id);
  if (!challenge) return fail(res, '挑战不存在', 1, 404);

  const user = await User.findByPk(req.user.id);
  let joined = false;
  if (challenge.type === 'personal') {
    joined = !!(await ChallengeParticipant.findOne({ where: { challengeId: id, userId: user.id, status: 'active' } }));
  } else {
    const groupKey = challenge.type === 'class' ? user.className : user.dormitory;
    joined = !!(groupKey && await ChallengeParticipant.findOne({ where: { challengeId: id, groupKey, status: 'active' } }));
  }

  let myPoints = 0;
  let myTimes = 0;
  if (challenge.type === 'personal') {
    // 个人总积分（累计获得，不受商城消费影响）+ 打卡次数
    myPoints = user.totalPoints;
    myTimes = await Checkin.count({ where: { userId: user.id, status: 'approved' } });
  } else {
    const field = challenge.type === 'class' ? 'class_name' : 'dormitory';
    const val = challenge.type === 'class' ? user.className : user.dormitory;
    if (val) {
      const agg = await sequelize.query(
        `SELECT SUM(total_points) AS totalPoints, COUNT(*) AS members
         FROM users WHERE role='student' AND ${field} = :val`,
        { replacements: { val }, type: QueryTypes.SELECT }
      );
      myPoints = Number(agg[0].totalPoints) || 0;
      myTimes = Number(agg[0].members) || 0;
    }
  }

  return ok(res, { joined, myPoints, myTimes });
}

module.exports = { listChallenges, join, ranking, myStatus };
