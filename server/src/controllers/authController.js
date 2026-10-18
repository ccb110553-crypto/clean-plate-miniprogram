const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');
const { ok, fail } = require('../utils/response');

// 去除敏感字段
function sanitize(user) {
  const u = user.toJSON();
  delete u.password;
  return u;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

// 登录（学生 + 管理员通用）
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return fail(res, '请输入用户名和密码');

  const user = await User.findOne({ where: { username } });
  if (!user) return fail(res, '用户名或密码错误');
  if (user.status !== 1) return fail(res, '账号已被禁用');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return fail(res, '用户名或密码错误');

  return ok(res, { token: signToken(user), user: sanitize(user) }, '登录成功');
}

// 学生注册
async function register(req, res) {
  const { username, password, nickname, studentNo, className, dormitory } = req.body;
  if (!username || !password) return fail(res, '用户名和密码不能为空');
  if (password.length < 6) return fail(res, '密码长度至少 6 位');

  const exists = await User.findOne({ where: { username } });
  if (exists) return fail(res, '用户名已存在');

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    password: hash,
    nickname: nickname || username,
    studentNo: studentNo || null,
    className: className || null,
    dormitory: dormitory || null,
    role: 'student',
  });

  return ok(res, { token: signToken(user), user: sanitize(user) }, '注册成功');
}

// 当前登录用户信息
async function me(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) return fail(res, '用户不存在', 1, 404);
  return ok(res, sanitize(user));
}

module.exports = { login, register, me };
