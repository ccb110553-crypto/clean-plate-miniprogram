# 部署指南（云服务器）

> 适用场景：毕业设计答辩演示，把后端 + 管理端部署到一台云服务器，评委/自己随时通过浏览器和微信开发者工具访问。
> 操作系统以 **Ubuntu 22.04** 为例（阿里云/腾讯云学生机均可）。

## 一、前置准备

1. 一台云服务器（最低 2 核 2G 即可），获取公网 IP。
2. 一个能 SSH 登录的账号（root 或普通用户）。

## 二、安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 1. Node.js 18+（用 NodeSource 源）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # 确认 ≥ 18

# 2. MySQL 8
sudo apt install -y mysql-server
sudo systemctl start mysql

# 3. Nginx
sudo apt install -y nginx

# 4. PM2（Node 进程守护）
sudo npm install -g pm2
```

## 三、上传代码

```bash
# 方式一：git 克隆（推荐，开源后直接 clone）
git clone <你的仓库地址> /var/www/clean-plate
cd /var/www/clean-plate

# 方式二：本地压缩上传
# 本地执行：scp -r ./server ./admin ./docs 用户名@服务器IP:/var/www/clean-plate/
```

## 四、配置数据库

```bash
# 设置 MySQL root 密码（首次）
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的强密码';
FLUSH PRIVILEGES;
EXIT;

# 建库建表
mysql -u root -p --default-character-set=utf8mb4 < docs/schema.sql
```

## 五、配置并启动后端

```bash
cd /var/www/clean-plate/server
npm install

# 创建生产环境配置
cp .env.example .env
nano .env
```

`.env` 里**必改**这几项：

```ini
PORT=3000
DB_HOST=127.0.0.1
DB_NAME=clean_plate
DB_USER=root
DB_PASSWORD=你的强密码
JWT_SECRET=一段足够长的随机字符串
BAIDU_API_KEY=你的APIKey
BAIDU_SECRET_KEY=你的SecretKey
BAIDU_MODEL_ID=food_recognition_cd
```

初始化数据并用 PM2 启动：

```bash
npm run seed
pm2 start src/server.js --name clean-plate-server
pm2 save
pm2 startup   # 开机自启（按提示执行输出命令）
```

验证：`curl http://localhost:3000/health` 应返回 200。

## 六、构建并部署管理端

```bash
cd /var/www/clean-plate/admin
npm install
npm run build        # 生成 dist/ 静态文件
```

配置 Nginx（反向代理后端 + 托管管理端）：

```bash
sudo nano /etc/nginx/sites-available/clean-plate
```

写入：

```nginx
server {
    listen 80;
    server_name 你的服务器IP;

    # 管理端静态页面
    root /var/www/clean-plate/admin/dist;
    index index.html;

    # 前端路由（Vue history 模式）回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传的图片
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

启用并重载：

```bash
sudo ln -s /etc/nginx/sites-available/clean-plate /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

现在浏览器访问 `http://服务器IP` 即可打开管理端。

## 七、开放端口（云服务器安全组）

在云厂商控制台的**安全组/防火墙**里放行：

- `80`（管理端 HTTP）
- `3000`（后端 API，供小程序开发工具直连）

## 八、小程序连接

开发者工具里改 `miniprogram/utils/request.js`：

```js
const BASE_URL = 'http://你的服务器IP:3000/api';
const IMG_BASE = 'http://你的服务器IP:3000';
```

并在开发者工具勾选「不校验合法域名」。

## 九、（可选）HTTPS + 域名

若要上 HTTPS（微信正式上线才需要）：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

之后把 `request.js` 的地址改成 `https://你的域名/api`，并在微信公众平台配置合法域名。

## 十、常用运维命令

```bash
pm2 status              # 查看后端状态
pm2 logs clean-plate-server   # 看日志
pm2 restart clean-plate-server  # 重启后端
sudo systemctl status nginx    # 查看 Nginx
```

> 提示：`.env` 已被 gitignore，部署时在服务器上单独创建，不要提交到仓库。
