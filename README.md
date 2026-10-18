# 光盘行动 · 餐食打卡积分系统

> 基于 Node.js 与微信小程序的"光盘行动"餐食打卡积分系统设计与实现（毕业设计项目）

## 一、项目简介

学生用餐后对餐盘拍照上传打卡，系统结合 AI 图像预判与管理员人工审核判定是否"光盘"，通过后发放"光盘积分"。积分可在商城兑换食堂代金券或参与公益捐赠，并支持个人/班级/宿舍多维度的光盘挑战赛与实时榜单，配套食堂菜单与食谱推荐。

## 二、技术栈

| 模块 | 技术 |
|------|------|
| 小程序端 | 微信小程序原生（WXML / WXSS / JS） |
| 后端 | Node.js + Express + Sequelize ORM |
| 数据库 | MySQL 8.0 |
| 管理端 | Vue 3 + Vite + Element Plus + ECharts |
| 认证 | JWT（jsonwebtoken） |
| 图片上传 | multer |
| AI 预判 | sharp 图像特征分析（亮度/白色占比/纹理复杂度），可扩展云端 API |

## 三、目录结构

```
├── server/          # 后端服务 (Express + Sequelize)
│   ├── src/
│   │   ├── models/       # 数据模型
│   │   ├── controllers/  # 业务控制器
│   │   ├── routes/       # 路由
│   │   ├── services/     # 积分事务 + AI 识别
│   │   └── middlewares/  # JWT 认证等
│   ├── seed.js           # 数据初始化脚本
│   └── .env              # 环境配置（数据库、密钥）
├── admin/           # 管理端 (Vue3 + Element Plus + ECharts)
│   └── src/views/        # 登录/大屏/审核/订单/规则/用户
├── miniprogram/     # 微信小程序
│   └── pages/            # 首页/打卡/商城/挑战/榜单/食谱/菜单/我的
└── docs/
    └── schema.sql        # 数据库建表脚本
```

## 四、快速开始

### 1. 数据库（MySQL）

已安装 MySQL 8.0，默认账号 `root / Mysql123456!`。建库建表：

```bash
"D:\MySQL\Server\8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4 < docs/schema.sql
```

### 2. 后端

```bash
cd server
npm install
npm run seed        # 初始化管理员 + 测试数据
npm start           # 启动，端口 3000
```

### 3. 管理端

```bash
cd admin
npm install
npm run dev         # 启动，访问 http://localhost:5173
```

### 4. 小程序

1. 打开微信开发者工具，导入 `miniprogram` 目录
2. `project.config.json` 中的 `appid` 改为你自己的小程序 AppID（或用测试号）
3. 后端地址在 `miniprogram/utils/request.js` 的 `BASE_URL`（开发者工具中用 `http://localhost:3000/api`；真机预览改为电脑局域网 IP）
4. 开发者工具需勾选「不校验合法域名」（详情 → 本地设置）

## 五、测试账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | admin123 |
| 学生 | student1 ~ student5 | 123456 |

## 六、核心功能

**学生端（小程序）**
- 光盘打卡：拍照上传 → AI 预判 → 管理员审核 → 发放积分
- 积分商城：兑换代金券 / 公益捐赠
- 光盘挑战：个人/班级/宿舍挑战赛 + 实时榜单
- 食谱推荐 + 食堂菜单

**管理端（Web）**
- 打卡审核：查看照片 + AI 预判参考，通过/驳回
- 订单管理：发放代金券 / 取消退款
- 规则配置：AI 阈值、积分规则、审核模式
- 用户管理：查询、禁用/启用
- 数据大屏：光盘率、参与人数、减少浪费量等可视化

## 七、主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 学生注册 |
| POST | /api/checkins | 提交打卡（上传图片） |
| GET | /api/checkins | 我的打卡记录 |
| GET | /api/points | 我的积分 |
| GET | /api/products | 商品列表 |
| POST | /api/orders | 兑换下单 |
| GET | /api/challenges/:id/ranking | 挑战榜单 |
| GET | /api/menus | 食堂菜单 |
| POST | /api/admin/checkins/:id/review | 审核打卡 |
| GET | /api/admin/dashboard | 数据大屏统计 |
| GET/PUT | /api/admin/rule-configs | 规则配置 |

完整接口见 `server/src/routes/index.js`。
