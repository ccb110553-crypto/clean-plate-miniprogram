const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 上传图片静态访问
app.use('/uploads', express.static(env.uploadDir));

// 业务路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => res.json({ code: 0, message: 'ok', data: { time: new Date().toISOString() } }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
