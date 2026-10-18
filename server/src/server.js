const fs = require('fs');
const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

// 确保上传目录存在
fs.mkdirSync(env.uploadDir, { recursive: true });

async function start() {
  try {
    await sequelize.authenticate();
    console.log('[√] MySQL 连接成功:', env.db.host + ':' + env.db.port + '/' + env.db.name);
    app.listen(env.port, () => {
      console.log(`[√] 后端服务已启动: http://localhost:${env.port}`);
      console.log(`[√] 健康检查: http://localhost:${env.port}/health`);
    });
  } catch (e) {
    console.error('[×] 启动失败:', e.message);
    process.exit(1);
  }
}

start();
