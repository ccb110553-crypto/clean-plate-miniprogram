// 统一错误处理中间件
// eslint-disable-next-line no-unused-vars
function notFound(req, res) {
  return res.status(404).json({ code: 404, message: '接口不存在', data: null });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  return res.status(500).json({ code: 500, message: err.message || '服务器内部错误', data: null });
}

module.exports = { notFound, errorHandler };
