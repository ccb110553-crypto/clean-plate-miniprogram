// 包装 async 控制器，捕获异常交给全局错误处理
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
