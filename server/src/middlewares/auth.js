const jwt = require('jsonwebtoken');
const env = require('../config/env');

// 用户认证：解析 JWT，注入 req.user
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录', data: null });
  }
  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = { id: payload.id, role: payload.role, username: payload.username };
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null });
  }
}

// 管理员权限校验（需在 auth 之后使用）
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ code: 403, message: '无操作权限', data: null });
}

module.exports = { auth, requireAdmin };
