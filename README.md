# 光盘行动 · 餐食打卡积分系统

> 基于 Node.js 与微信小程序的"光盘行动"餐食打卡积分系统设计与实现（毕业设计项目）

学生用餐后对餐盘拍照上传打卡，系统调用 **百度 EasyDL 自训练三分类模型**（干净 / 需要审核 / 不干净）进行 AI 预判：判为「干净」自动通过并发放积分，其余进入管理员人工审核。积分可在商城兑换代金券或参与公益捐赠，并支持个人/班级/宿舍多维度的光盘挑战赛与实时榜单，配套食堂菜单与食谱推荐。

## 一、技术栈

| 模块 | 技术 |
|------|------|
| 小程序端 | 微信小程序原生（WXML / WXSS / JS） |
| 后端 | Node.js + Express + Sequelize ORM |
| 数据库 | MySQL 8.0 |
| 管理端 | Vue 3 + Vite + Element Plus + ECharts |
| 认证 | JWT（jsonwebtoken） |
| 图片上传 | multer |
| AI 识别 | 百度 EasyDL 三分类模型 → 通用物体识别 → 本地启发式（三级降级） |

## 二、目录结构

```
├── server/          # 后端服务 (Express + Sequelize)
│   ├── src/
│   │   ├── models/       # 数据模型
│   │   ├── controllers/  # 业务控制器
│   │   ├── routes/       # 路由
│   │   ├── services/     # 积分事务 + AI 识别 + 规则配置
│   │   └── middlewares/  # JWT 认证等
│   ├── seed.js           # 数据初始化脚本
│   └── .env              # 环境配置（密钥，不入仓库）
├── admin/           # 管理端 (Vue3 + Element Plus + ECharts)
│   └── src/views/        # 大屏/审核/订单/规则/用户/菜单/挑战/商品/食谱
├── miniprogram/     # 微信小程序
│   └── pages/            # 首页/打卡/商城/挑战/榜单/食谱/菜单/我的
└── docs/
    ├── schema.sql        # 数据库建表脚本
    └── ...
```

## 三、环境要求

- Node.js ≥ 18（本项目使用全局 `fetch`，需 18+）
- MySQL ≥ 8.0
- 微信开发者工具（运行小程序）
- 百度智能云账号（EasyDL 模型，可选，未配置时回退本地算法）

## 四、快速开始

### 1. 数据库（MySQL）

建库建表：

```bash
mysql -u root -p --default-character-set=utf8mb4 < docs/schema.sql
```

### 2. 后端

```bash
cd server
npm install
cp .env.example .env   # 按需修改数据库密码、AI 密钥等
npm run seed           # 初始化管理员 + 测试数据
npm start              # 启动，端口 3000
```

### 3. 管理端

```bash
cd admin
npm install
npm run dev            # 启动，访问 http://localhost:5173
```

### 4. 小程序

1. 打开微信开发者工具，导入 `miniprogram` 目录
2. `project.config.json` 中的 `appid` 改为你自己的 AppID（或用测试号）
3. 后端地址在 `miniprogram/utils/request.js` 的 `BASE_URL`（开发者工具中用 `http://localhost:3000/api`）
4. 开发者工具需勾选「不校验合法域名」（详情 → 本地设置）

## 五、AI 识别说明

三级降级策略（`server/src/services/aiService.js`）：

1. **EasyDL 自训练三分类模型**（配置 `BAIDU_MODEL_ID` 后启用，最准）
2. 百度「通用物体和场景识别」（次级方案）
3. 本地图像启发式算法（无外部依赖兜底）

三类判定与打卡流转（方案：仅「干净」自动通过）：

| AI 判定 | 含义 | 打卡状态 |
|---------|------|----------|
| `pass`（干净） | 只剩一点或无残渣 | ✅ 自动通过，发放积分 |
| `review`（需要审核） | 吃一半，不确定 | ⏳ 进入人工审核 |
| `dirty`（不干净） | 大量剩菜 | ⏳ 进入人工审核 |

> EasyDL 模型的三个类名需与 `aiService.js` 中 `EASYDL_CLASS_MAP` 一致：`干净`、`需要审核`、`不干净`。

## 六、测试账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | admin123 |
| 学生 | student1 ~ student5 | 123456 |

## 七、核心功能

**学生端（小程序）**
- 光盘打卡：拍照上传 → AI 三分类预判 → 自动通过或人工审核 → 发放积分
- 积分商城：兑换代金券 / 公益捐赠
- 光盘挑战：个人/班级/宿舍挑战赛 + 实时榜单
- 食谱推荐 + 食堂菜单

**管理端（Web）**
- 数据大屏：光盘率、参与人数、减少浪费量等可视化
- 打卡审核：查看照片 + AI 三分类预判，通过/驳回（自动收集误判样本）
- 规则配置：AI 开关、判定阈值、每日上限、积分规则、审核模式（实时生效）
- 挑战管理：创建挑战 + 查看报名名单 + 禁止/允许参加
- 商品管理 / 食谱管理 / 菜单管理 / 订单管理 / 用户管理

## 八、主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 学生注册 |
| POST | /api/checkins | 提交打卡（上传图片 + AI 预判） |
| GET | /api/checkins | 我的打卡记录 |
| GET | /api/products | 商品列表 |
| POST | /api/orders | 兑换下单（事务） |
| GET | /api/challenges/:id/ranking | 挑战榜单 |
| GET | /api/admin/dashboard | 数据大屏统计 |
| GET/PUT | /api/admin/rule-configs | 规则配置 |
| GET/POST/PUT/DELETE | /api/admin/challenges | 挑战管理 |
| GET/POST | /api/admin/challenges/:id/participants | 报名管理 |

完整接口见 `server/src/routes/index.js`。

## 九、安全说明

- **密钥只放 `.env`**，该文件已被 `.gitignore` 忽略，不会进入版本库。仓库内只有 `.env.example`（占位符）。
- 上线前请务必修改：数据库密码、`JWT_SECRET`、默认管理员密码。
- `env.js` 中的 `JWT_SECRET` 回退值是**开发用默认值**，生产环境必须通过 `.env` 设置强随机密钥。

## 十、部署

生产环境部署（云服务器 + PM2 + Nginx + HTTPS）见 [DEPLOY.md](DEPLOY.md)。

## 十一、许可证

[MIT License](LICENSE)

## 免责声明

本项目为毕业设计/学习用途，AI 预判结果仅供参考，最终以管理员人工审核为准。请勿将其直接用于未经备案和内容安全审查的生产环境。
