/**
 * 统一响应格式: { code, message, data }
 * code: 0 成功, 非 0 失败
 */
function ok(res, data = null, message = 'success') {
  return res.json({ code: 0, message, data });
}

function fail(res, message = '操作失败', code = 1, httpStatus = 200) {
  return res.status(httpStatus).json({ code, message, data: null });
}

module.exports = { ok, fail };
