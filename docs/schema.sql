-- ============================================================
-- 基于 Node.js 与微信小程序的"光盘行动"餐食打卡积分系统
-- 数据库设计 (MySQL 8.0)
-- 数据库名: clean_plate
-- ============================================================

CREATE DATABASE IF NOT EXISTS clean_plate DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clean_plate;

-- ------------------------------------------------------------
-- 1. 用户表 (学生 + 管理员)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  openid        VARCHAR(64)   DEFAULT NULL COMMENT '微信小程序 openid，模拟登录可为空',
  username      VARCHAR(64)   NOT NULL COMMENT '登录账号',
  password      VARCHAR(255)  NOT NULL COMMENT '密码(bcrypt 哈希)',
  nickname      VARCHAR(64)   DEFAULT NULL COMMENT '昵称',
  avatar        VARCHAR(255)  DEFAULT NULL COMMENT '头像地址',
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  student_no    VARCHAR(32)   DEFAULT NULL COMMENT '学号',
  class_name    VARCHAR(64)   DEFAULT NULL COMMENT '班级',
  dormitory     VARCHAR(64)   DEFAULT NULL COMMENT '宿舍号',
  total_points  INT           NOT NULL DEFAULT 0 COMMENT '累计获得积分',
  balance_points INT          NOT NULL DEFAULT 0 COMMENT '当前可用积分',
  status        TINYINT       NOT NULL DEFAULT 1 COMMENT '1正常 0禁用',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ------------------------------------------------------------
-- 2. 打卡记录表 (核心业务)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkins (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  image_url      VARCHAR(255) NOT NULL COMMENT '餐盘照片地址',
  menu_id        INT UNSIGNED  DEFAULT NULL COMMENT '关联菜品 id',
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '待审核/通过/驳回',
  ai_result      JSON          DEFAULT NULL COMMENT 'AI 识别原始结果',
  ai_score       DECIMAL(5,2)  DEFAULT NULL COMMENT 'AI 判定为光盘的置信度 0-1',
  ai_label       VARCHAR(32)   DEFAULT NULL COMMENT 'AI 预判标签 empty/not_empty',
  reject_reason  VARCHAR(255)  DEFAULT NULL COMMENT '驳回原因',
  points_awarded INT           NOT NULL DEFAULT 0 COMMENT '通过后发放的积分',
  reviewer_id    INT UNSIGNED  DEFAULT NULL COMMENT '审核管理员 id',
  reviewed_at    DATETIME      DEFAULT NULL COMMENT '审核时间',
  checkin_date   DATE          NOT NULL COMMENT '打卡日期',
  meal_type      ENUM('breakfast','lunch','dinner') NOT NULL DEFAULT 'lunch' COMMENT '餐次',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  KEY idx_status (status),
  KEY idx_date (checkin_date),
  UNIQUE KEY uk_user_date_meal (user_id, checkin_date, meal_type),
  KEY idx_menu (menu_id),
  CONSTRAINT fk_checkin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_checkin_menu FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='光盘打卡记录';

-- ------------------------------------------------------------
-- 3. 积分流水表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS points_logs (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  change_type   ENUM('earn','spend') NOT NULL COMMENT '收入/支出',
  points        INT           NOT NULL COMMENT '变动积分(正数,类型决定方向)',
  balance_after INT           NOT NULL COMMENT '变动后余额',
  source        VARCHAR(32)   NOT NULL COMMENT '来源: checkin/exchange/challenge/admin',
  ref_id        INT UNSIGNED  DEFAULT NULL COMMENT '关联记录 id',
  remark        VARCHAR(255)  DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水';

-- ------------------------------------------------------------
-- 4. 积分商城商品表 (代金券 / 公益捐赠)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(64)  NOT NULL,
  type        ENUM('voucher','donation') NOT NULL DEFAULT 'voucher' COMMENT '代金券/公益捐赠',
  description TEXT,
  image       VARCHAR(255) DEFAULT NULL,
  points_cost INT          NOT NULL COMMENT '兑换所需积分',
  stock       INT          NOT NULL DEFAULT -1 COMMENT '库存, -1 表示不限',
  status      TINYINT      NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商城商品';

-- ------------------------------------------------------------
-- 5. 兑换订单表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no     VARCHAR(32)  NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NOT NULL,
  product_name VARCHAR(64)  NOT NULL COMMENT '商品名快照',
  points_cost  INT          NOT NULL,
  status       ENUM('pending','fulfilled','cancelled') NOT NULL DEFAULT 'pending' COMMENT '待发放/已发放/已取消',
  voucher_code VARCHAR(64)  DEFAULT NULL COMMENT '代金券码(发放后生成)',
  admin_id     INT UNSIGNED DEFAULT NULL,
  handled_at   DATETIME     DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_user (user_id),
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='兑换订单';

-- ------------------------------------------------------------
-- 6. 光盘挑战活动表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(128) NOT NULL,
  type        ENUM('personal','class','dormitory') NOT NULL COMMENT '个人/班级/宿舍',
  description TEXT,
  start_time  DATETIME NOT NULL,
  end_time    DATETIME NOT NULL,
  rules       JSON DEFAULT NULL COMMENT '积分规则配置',
  status      ENUM('draft','ongoing','finished') NOT NULL DEFAULT 'draft',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挑战活动';

-- ------------------------------------------------------------
-- 7. 挑战参与表 (个人用户 或 班级/宿舍队伍)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenge_participants (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  challenge_id INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED DEFAULT NULL COMMENT '个人挑战时为对应用户',
  group_key    VARCHAR(64)  DEFAULT NULL COMMENT '班级/宿舍挑战时的队伍标识',
  group_name   VARCHAR(64)  DEFAULT NULL COMMENT '队伍名称',
  status       ENUM('active','blocked') NOT NULL DEFAULT 'active' COMMENT '参与状态',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_challenge (challenge_id),
  CONSTRAINT fk_cp_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挑战参与';

-- ------------------------------------------------------------
-- 8. 食堂菜单表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menus (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_date DATE NOT NULL,
  week      INT  NOT NULL COMMENT '第几周',
  meal_type ENUM('breakfast','lunch','dinner') NOT NULL DEFAULT 'lunch',
  dish_name VARCHAR(64) NOT NULL,
  category  VARCHAR(32) DEFAULT '素菜' COMMENT '荤菜/素菜/主食/汤',
  price     DECIMAL(6,2) NOT NULL DEFAULT 0,
  is_small  TINYINT NOT NULL DEFAULT 0 COMMENT '1为小份/半份菜',
  image     VARCHAR(255) DEFAULT NULL COMMENT '菜品图片地址',
  status    TINYINT NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_date (menu_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='食堂菜单';

-- ------------------------------------------------------------
-- 9. 食谱推荐表 (小份菜/半份菜搭配方案)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title        VARCHAR(128) NOT NULL,
  description  TEXT,
  dishes       JSON NOT NULL COMMENT '搭配菜品列表',
  points_saved INT DEFAULT 0 COMMENT '预计节省/积分数',
  tags         VARCHAR(255) DEFAULT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='食谱推荐';

-- ------------------------------------------------------------
-- 10. 判定规则配置表 (餐盘剩余量阈值 / AI 开关等)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rule_configs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cfg_key     VARCHAR(64) NOT NULL,
  cfg_value   TEXT NOT NULL COMMENT 'JSON 值',
  description VARCHAR(255) DEFAULT NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_key (cfg_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='判定规则配置';

-- ------------------------------------------------------------
-- 11. 误判样本表 (用于优化判定规则)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS misjudge_samples (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  checkin_id   INT UNSIGNED DEFAULT NULL,
  image_url    VARCHAR(255) NOT NULL,
  ai_result    JSON DEFAULT NULL,
  human_result ENUM('empty','not_empty') NOT NULL COMMENT '人工判定结果',
  is_misjudge  TINYINT NOT NULL DEFAULT 0 COMMENT 'AI 是否误判',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='误判样本';

-- ============================================================
-- 初始数据
-- ============================================================

-- 默认管理员账号: admin / admin123 (bcrypt 哈希见后端 seed 脚本，此处用占位)
INSERT INTO users (username, password, nickname, role) VALUES
('admin', '$2b$10$placeholder_admin_password_hash', '系统管理员', 'admin');

-- 判定规则默认配置
INSERT INTO rule_configs (cfg_key, cfg_value, description) VALUES
('ai_enabled', 'true', '是否启用 AI 预判'),
('ai_threshold', '0.6', 'AI 判定为光盘的置信度阈值'),
('points_per_checkin', '10', '每次打卡通过发放的积分'),
('daily_checkin_limit', '1', '每日打卡次数上限'),
('checkin_review_mode', 'manual_with_ai', '审核模式: manual/manual_with_ai/auto');

-- 示例商城商品
INSERT INTO products (name, type, description, points_cost, stock) VALUES
('5元代金券', 'voucher', '食堂通用代金券 5 元', 50, 100),
('10元代金券', 'voucher', '食堂通用代金券 10 元', 90, 100),
('公益捐赠·爱心午餐', 'donation', '积分捐赠，为山区儿童提供一份午餐', 30, -1);

-- 示例挑战活动
INSERT INTO challenges (title, type, description, start_time, end_time, status) VALUES
('个人光盘挑战赛', 'personal', '连续打卡，争做光盘达人', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'ongoing'),
('班级光盘争霸赛', 'class', '以班级为单位累计积分，决出最光盘班级', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'ongoing'),
('宿舍光盘挑战赛', 'dormitory', '宿舍之间比拼光盘率', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'ongoing');
