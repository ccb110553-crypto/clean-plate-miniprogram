-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: clean_plate
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `clean_plate`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `clean_plate` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `clean_plate`;

--
-- Table structure for table `challenge_participants`
--

DROP TABLE IF EXISTS `challenge_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_participants` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `challenge_id` int unsigned NOT NULL,
  `user_id` int unsigned DEFAULT NULL COMMENT '个人挑战时为对应用户',
  `group_key` varchar(64) DEFAULT NULL COMMENT '班级/宿舍挑战时的队伍标识',
  `group_name` varchar(64) DEFAULT NULL COMMENT '队伍名称',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_challenge` (`challenge_id`),
  CONSTRAINT `fk_cp_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='挑战参与';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_participants`
--

LOCK TABLES `challenge_participants` WRITE;
/*!40000 ALTER TABLE `challenge_participants` DISABLE KEYS */;
INSERT INTO `challenge_participants` VALUES (1,1,2,NULL,NULL,'2026-10-18 17:56:46'),(2,3,2,'A-101','A-101','2026-10-18 17:56:58'),(3,2,2,'计科2201班','计科2201班','2026-10-18 17:56:59'),(4,1,3,NULL,NULL,'2026-10-18 18:14:52'),(5,1,4,NULL,NULL,'2026-10-18 18:14:52'),(6,1,5,NULL,NULL,'2026-10-18 18:14:53'),(7,1,6,NULL,NULL,'2026-10-18 18:14:53');
/*!40000 ALTER TABLE `challenge_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenges`
--

DROP TABLE IF EXISTS `challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenges` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(128) NOT NULL,
  `type` enum('personal','class','dormitory') NOT NULL COMMENT '个人/班级/宿舍',
  `description` text,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `rules` json DEFAULT NULL COMMENT '积分规则配置',
  `status` enum('draft','ongoing','finished') NOT NULL DEFAULT 'draft',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='挑战活动';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenges`
--

LOCK TABLES `challenges` WRITE;
/*!40000 ALTER TABLE `challenges` DISABLE KEYS */;
INSERT INTO `challenges` VALUES (1,'个人光盘挑战赛','personal','连续打卡，争做光盘达人','2026-10-18 12:47:58','2026-11-17 12:47:58',NULL,'ongoing','2026-10-18 12:47:58'),(2,'班级光盘争霸赛','class','以班级为单位累计积分，决出最光盘班级','2026-10-18 12:47:58','2026-11-17 12:47:58',NULL,'ongoing','2026-10-18 12:47:58'),(3,'宿舍光盘挑战赛','dormitory','宿舍之间比拼光盘率','2026-10-18 12:47:58','2026-11-17 12:47:58',NULL,'ongoing','2026-10-18 12:47:58');
/*!40000 ALTER TABLE `challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkins`
--

DROP TABLE IF EXISTS `checkins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkins` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `image_url` varchar(255) NOT NULL COMMENT '餐盘照片地址',
  `menu_id` int unsigned DEFAULT NULL COMMENT '关联菜品',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '待审核/通过/驳回',
  `ai_result` json DEFAULT NULL COMMENT 'AI 识别原始结果',
  `ai_score` decimal(5,2) DEFAULT NULL COMMENT 'AI 判定为光盘的置信度 0-1',
  `ai_label` varchar(32) DEFAULT NULL COMMENT 'AI 预判标签 empty/not_empty',
  `reject_reason` varchar(255) DEFAULT NULL COMMENT '驳回原因',
  `points_awarded` int NOT NULL DEFAULT '0' COMMENT '通过后发放的积分',
  `reviewer_id` int unsigned DEFAULT NULL COMMENT '审核管理员 id',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `checkin_date` date NOT NULL COMMENT '打卡日期(用于每日去重)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`,`checkin_date`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`checkin_date`),
  KEY `fk_checkin_menu` (`menu_id`),
  CONSTRAINT `fk_checkin_menu` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_checkin_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='光盘打卡记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkins`
--

LOCK TABLES `checkins` WRITE;
/*!40000 ALTER TABLE `checkins` DISABLE KEYS */;
INSERT INTO `checkins` VALUES (7,2,'/uploads/plate_dirty_1.jpg',1,'approved','{\"label\": \"not_empty\", \"score\": 0.428, \"features\": {\"whiteRatio\": 0.003, \"avgLuminance\": 165.8, \"luminanceStd\": 29.5}}',0.43,'not_empty',NULL,10,1,'2026-10-18 14:32:18','2026-10-16','2026-10-18 14:32:18'),(8,2,'/uploads/plate_dirty_2.jpg',2,'approved','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}',0.20,'not_empty',NULL,10,1,'2026-10-18 14:54:40','2026-10-17','2026-10-18 14:32:18'),(9,2,'/uploads/plate_dirty_3.jpg',21,'rejected','{\"label\": \"not_empty\", \"score\": 0.387, \"features\": {\"whiteRatio\": 0.021, \"avgLuminance\": 175.8, \"luminanceStd\": 49.3}}',0.39,'not_empty','餐盘未光盘，请继续努力',0,1,'2026-10-18 14:32:18','2026-10-18','2026-10-18 14:32:18'),(10,3,'/uploads/plate_dirty_1.jpg',12,'approved','{\"label\": \"not_empty\", \"score\": 0.428, \"features\": {\"whiteRatio\": 0.003, \"avgLuminance\": 165.8, \"luminanceStd\": 29.5}}',0.43,'not_empty',NULL,10,1,'2026-10-18 14:32:18','2026-10-16','2026-10-18 14:32:18'),(11,3,'/uploads/plate_dirty_2.jpg',11,'approved','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}',0.20,'not_empty',NULL,10,1,'2026-10-18 18:26:46','2026-10-17','2026-10-18 14:32:18'),(12,3,'/uploads/plate_dirty_3.jpg',10,'rejected','{\"label\": \"not_empty\", \"score\": 0.387, \"features\": {\"whiteRatio\": 0.021, \"avgLuminance\": 175.8, \"luminanceStd\": 49.3}}',0.39,'not_empty','餐盘未光盘，请继续努力',0,1,'2026-10-18 14:32:18','2026-10-18','2026-10-18 14:32:18'),(13,4,'/uploads/plate_dirty_1.jpg',3,'approved','{\"label\": \"not_empty\", \"score\": 0.428, \"features\": {\"whiteRatio\": 0.003, \"avgLuminance\": 165.8, \"luminanceStd\": 29.5}}',0.43,'not_empty',NULL,10,1,'2026-10-18 14:32:18','2026-10-16','2026-10-18 14:32:18'),(14,4,'/uploads/plate_dirty_2.jpg',4,'rejected','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}',0.20,'not_empty','餐盘未光盘，请继续努力',0,1,'2026-10-18 18:26:48','2026-10-17','2026-10-18 14:32:18'),(15,4,'/uploads/plate_dirty_3.jpg',24,'rejected','{\"label\": \"not_empty\", \"score\": 0.387, \"features\": {\"whiteRatio\": 0.021, \"avgLuminance\": 175.8, \"luminanceStd\": 49.3}}',0.39,'not_empty','餐盘未光盘，请继续努力',0,1,'2026-10-18 14:32:18','2026-10-18','2026-10-18 14:32:18'),(16,2,'/uploads/plate_dirty_1.jpg',5,'approved','{\"label\": \"not_empty\", \"score\": 0.428, \"features\": {\"whiteRatio\": 0.003, \"avgLuminance\": 165.8, \"luminanceStd\": 29.5}}',0.43,'not_empty',NULL,10,1,'2026-10-18 17:54:48','2026-10-15','2026-10-18 17:54:48'),(17,2,'/uploads/plate_dirty_2.jpg',6,'approved','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}',0.20,'not_empty',NULL,10,1,'2026-10-18 17:54:48','2026-10-14','2026-10-18 17:54:48'),(18,2,'/uploads/plate_dirty_3.jpg',8,'approved','{\"label\": \"not_empty\", \"score\": 0.387, \"features\": {\"whiteRatio\": 0.021, \"avgLuminance\": 175.8, \"luminanceStd\": 49.3}}',0.39,'not_empty',NULL,10,1,'2026-10-18 17:54:48','2026-10-13','2026-10-18 17:54:48'),(19,2,'/uploads/plate_dirty_1.jpg',9,'approved','{\"label\": \"not_empty\", \"score\": 0.428, \"features\": {\"whiteRatio\": 0.003, \"avgLuminance\": 165.8, \"luminanceStd\": 29.5}}',0.43,'not_empty',NULL,10,1,'2026-10-18 17:54:48','2026-10-12','2026-10-18 17:54:48'),(20,2,'/uploads/plate_dirty_2.jpg',14,'approved','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}',0.20,'not_empty',NULL,10,1,'2026-10-18 17:54:48','2026-10-11','2026-10-18 17:54:48'),(21,2,'/uploads/plate_dirty_3.jpg',16,'approved','{\"label\": \"not_empty\", \"score\": 0.387, \"features\": {\"whiteRatio\": 0.021, \"avgLuminance\": 175.8, \"luminanceStd\": 49.3}}',0.39,'not_empty',NULL,10,1,'2026-10-18 17:54:48','2026-10-10','2026-10-18 17:54:48'),(22,2,'/uploads/plate_dirty_1.jpg',17,'approved','{\"label\": \"not_empty\", \"score\": 0.428, \"features\": {\"whiteRatio\": 0.003, \"avgLuminance\": 165.8, \"luminanceStd\": 29.5}}',0.43,'not_empty',NULL,10,1,'2026-10-18 17:54:48','2026-10-09','2026-10-18 17:54:48'),(23,2,'/uploads/plate_dirty_2.jpg',22,'approved','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}',0.20,'not_empty',NULL,10,1,'2026-10-18 17:54:48','2026-10-08','2026-10-18 17:54:48');
/*!40000 ALTER TABLE `checkins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menus`
--

DROP TABLE IF EXISTS `menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menus` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `menu_date` date NOT NULL,
  `week` int NOT NULL COMMENT '第几周',
  `meal_type` enum('breakfast','lunch','dinner') NOT NULL DEFAULT 'lunch',
  `dish_name` varchar(64) NOT NULL,
  `category` varchar(32) DEFAULT '素菜' COMMENT '荤菜/素菜/主食/汤',
  `price` decimal(6,2) NOT NULL DEFAULT '0.00',
  `is_small` tinyint NOT NULL DEFAULT '0' COMMENT '1为小份/半份菜',
  `image` varchar(255) DEFAULT NULL COMMENT '菜品图片',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`menu_date`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='食堂菜单';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menus`
--

LOCK TABLES `menus` WRITE;
/*!40000 ALTER TABLE `menus` DISABLE KEYS */;
INSERT INTO `menus` VALUES (1,'2026-10-18',1,'lunch','红烧肉','荤菜',10.00,1,'/uploads/dishes/dish_01.jpg','2026-10-18 14:13:16'),(2,'2026-10-18',1,'lunch','宫保鸡丁','荤菜',8.00,1,'/uploads/dishes/dish_02.jpg','2026-10-18 14:13:16'),(3,'2026-10-18',1,'lunch','鱼香肉丝','荤菜',7.00,1,'/uploads/dishes/dish_03.jpg','2026-10-18 14:13:16'),(4,'2026-10-18',1,'lunch','糖醋排骨','荤菜',12.00,0,'/uploads/dishes/dish_04.jpg','2026-10-18 14:13:16'),(5,'2026-10-18',1,'lunch','回锅肉','荤菜',9.00,1,'/uploads/dishes/dish_05.jpg','2026-10-18 14:13:16'),(6,'2026-10-18',1,'lunch','辣子鸡','荤菜',11.00,0,'/uploads/dishes/dish_06.jpg','2026-10-18 14:13:16'),(7,'2026-10-18',1,'lunch','红烧排骨','荤菜',12.00,0,'/uploads/dishes/dish_07.jpg','2026-10-18 14:13:16'),(8,'2026-10-18',1,'lunch','可乐鸡翅','荤菜',10.00,0,'/uploads/dishes/dish_08.jpg','2026-10-18 14:13:16'),(9,'2026-10-18',1,'lunch','木须肉','荤菜',8.00,1,'/uploads/dishes/dish_09.jpg','2026-10-18 14:13:16'),(10,'2026-10-18',1,'lunch','清蒸鱼','荤菜',13.00,0,'/uploads/dishes/dish_10.jpg','2026-10-18 14:13:16'),(11,'2026-10-18',1,'lunch','番茄炒蛋','素菜',5.00,1,'/uploads/dishes/dish_11.jpg','2026-10-18 14:13:16'),(12,'2026-10-18',1,'lunch','麻婆豆腐','素菜',5.00,1,'/uploads/dishes/dish_12.jpg','2026-10-18 14:13:16'),(13,'2026-10-18',1,'lunch','酸辣土豆丝','素菜',4.00,1,'/uploads/dishes/dish_13.jpg','2026-10-18 14:13:16'),(14,'2026-10-18',1,'lunch','清炒时蔬','素菜',4.00,1,'/uploads/dishes/dish_14.jpg','2026-10-18 14:13:16'),(15,'2026-10-18',1,'lunch','干煸四季豆','素菜',6.00,1,'/uploads/dishes/dish_15.jpg','2026-10-18 14:13:16'),(16,'2026-10-18',1,'lunch','地三鲜','素菜',7.00,1,'/uploads/dishes/dish_16.jpg','2026-10-18 14:13:16'),(17,'2026-10-18',1,'lunch','蒜蓉西兰花','素菜',6.00,1,'/uploads/dishes/dish_17.jpg','2026-10-18 14:13:16'),(18,'2026-10-18',1,'lunch','醋溜白菜','素菜',4.00,1,'/uploads/dishes/dish_18.jpg','2026-10-18 14:13:16'),(19,'2026-10-18',1,'lunch','韭菜炒鸡蛋','素菜',5.00,1,'/uploads/dishes/dish_19.jpg','2026-10-18 14:13:16'),(20,'2026-10-18',1,'lunch','凉拌黄瓜','素菜',4.00,1,'/uploads/dishes/dish_20.jpg','2026-10-18 14:13:16'),(21,'2026-10-18',1,'lunch','米饭','主食',1.00,1,'/uploads/dishes/dish_21.jpg','2026-10-18 14:13:16'),(22,'2026-10-18',1,'lunch','蛋炒饭','主食',5.00,1,'/uploads/dishes/dish_22.jpg','2026-10-18 14:13:16'),(23,'2026-10-18',1,'lunch','馒头','主食',1.00,0,'/uploads/dishes/dish_23.jpg','2026-10-18 14:13:16'),(24,'2026-10-18',1,'lunch','紫菜蛋花汤','汤',3.00,1,'/uploads/dishes/dish_24.jpg','2026-10-18 14:13:16'),(25,'2026-10-18',1,'lunch','番茄蛋汤','汤',3.00,1,'/uploads/dishes/dish_25.jpg','2026-10-18 14:13:16'),(26,'2026-10-18',1,'lunch','玉米排骨汤','汤',6.00,0,'/uploads/dishes/dish_26.jpg','2026-10-18 14:13:16'),(27,'2026-10-18',1,'lunch','酸辣汤','汤',4.00,1,'/uploads/dishes/dish_27.jpg','2026-10-18 14:13:16');
/*!40000 ALTER TABLE `menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `misjudge_samples`
--

DROP TABLE IF EXISTS `misjudge_samples`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `misjudge_samples` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `checkin_id` int unsigned DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `ai_result` json DEFAULT NULL,
  `human_result` enum('empty','not_empty') NOT NULL COMMENT '人工判定结果',
  `is_misjudge` tinyint NOT NULL DEFAULT '0' COMMENT 'AI 是否误判',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='误判样本';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `misjudge_samples`
--

LOCK TABLES `misjudge_samples` WRITE;
/*!40000 ALTER TABLE `misjudge_samples` DISABLE KEYS */;
INSERT INTO `misjudge_samples` VALUES (2,8,'/uploads/plate_dirty_2.jpg','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}','empty',1,'2026-10-18 14:54:40'),(3,11,'/uploads/plate_dirty_2.jpg','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}','empty',1,'2026-10-18 18:26:46'),(4,14,'/uploads/plate_dirty_2.jpg','{\"label\": \"not_empty\", \"score\": 0.2, \"features\": {\"whiteRatio\": 0.019, \"avgLuminance\": 99.3, \"luminanceStd\": 86.4}}','not_empty',0,'2026-10-18 18:26:48');
/*!40000 ALTER TABLE `misjudge_samples` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `product_name` varchar(64) NOT NULL COMMENT '商品名快照',
  `points_cost` int NOT NULL,
  `status` enum('pending','fulfilled','cancelled') NOT NULL DEFAULT 'pending' COMMENT '待发放/已发放/已取消',
  `voucher_code` varchar(64) DEFAULT NULL COMMENT '代金券码(发放后生成)',
  `admin_id` int unsigned DEFAULT NULL,
  `handled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='兑换订单';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (2,'CD1792317383630234',2,3,'公益捐赠·爱心午餐',30,'pending',NULL,NULL,NULL,'2026-10-18 17:56:23');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `points_logs`
--

DROP TABLE IF EXISTS `points_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `points_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `change_type` enum('earn','spend') NOT NULL COMMENT '收入/支出',
  `points` int NOT NULL COMMENT '变动积分(正数,类型决定方向)',
  `balance_after` int NOT NULL COMMENT '变动后余额',
  `source` varchar(32) NOT NULL COMMENT '来源: checkin/exchange/challenge/admin',
  `ref_id` int unsigned DEFAULT NULL COMMENT '关联记录 id',
  `remark` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_points_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='积分流水';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `points_logs`
--

LOCK TABLES `points_logs` WRITE;
/*!40000 ALTER TABLE `points_logs` DISABLE KEYS */;
INSERT INTO `points_logs` VALUES (3,2,'earn',10,10,'checkin',7,'光盘打卡奖励','2026-10-18 14:32:18'),(4,3,'earn',10,10,'checkin',10,'光盘打卡奖励','2026-10-18 14:32:18'),(5,4,'earn',10,10,'checkin',13,'光盘打卡奖励','2026-10-18 14:32:18'),(6,2,'earn',10,20,'checkin',8,'光盘打卡奖励','2026-10-18 14:54:40'),(7,2,'earn',10,30,'checkin',16,'光盘打卡奖励','2026-10-18 17:54:48'),(8,2,'earn',10,40,'checkin',17,'光盘打卡奖励','2026-10-18 17:54:48'),(9,2,'earn',10,50,'checkin',18,'光盘打卡奖励','2026-10-18 17:54:48'),(10,2,'earn',10,60,'checkin',19,'光盘打卡奖励','2026-10-18 17:54:48'),(11,2,'earn',10,70,'checkin',20,'光盘打卡奖励','2026-10-18 17:54:48'),(12,2,'earn',10,80,'checkin',21,'光盘打卡奖励','2026-10-18 17:54:48'),(13,2,'earn',10,90,'checkin',22,'光盘打卡奖励','2026-10-18 17:54:48'),(14,2,'earn',10,100,'checkin',23,'光盘打卡奖励','2026-10-18 17:54:48'),(15,2,'spend',30,70,'exchange',NULL,NULL,'2026-10-18 17:56:23'),(16,3,'earn',10,20,'checkin',11,'光盘打卡奖励','2026-10-18 18:26:46');
/*!40000 ALTER TABLE `points_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `type` enum('voucher','donation') NOT NULL DEFAULT 'voucher' COMMENT '代金券/公益捐赠',
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `points_cost` int NOT NULL COMMENT '兑换所需积分',
  `stock` int NOT NULL DEFAULT '-1' COMMENT '库存, -1 表示不限',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1上架 0下架',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='商城商品';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'5元代金券','voucher','食堂通用代金券 5 元',NULL,50,100,1,'2026-10-18 12:47:58'),(2,'10元代金券','voucher','食堂通用代金券 10 元',NULL,90,100,1,'2026-10-18 12:47:58'),(3,'公益捐赠·爱心午餐','donation','积分捐赠，为山区儿童提供一份午餐',NULL,30,-1,1,'2026-10-18 12:47:58');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipes`
--

DROP TABLE IF EXISTS `recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(128) NOT NULL,
  `description` text,
  `dishes` json NOT NULL COMMENT '搭配菜品列表',
  `points_saved` int DEFAULT '0' COMMENT '预计节省/积分数',
  `tags` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='食谱推荐';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipes`
--

LOCK TABLES `recipes` WRITE;
/*!40000 ALTER TABLE `recipes` DISABLE KEYS */;
INSERT INTO `recipes` VALUES (1,'轻食半份套餐','半份宫保鸡丁 + 小份米饭，荤素搭配不浪费','[\"半份宫保鸡丁\", \"小份米饭\"]',5,'轻食,实惠','2026-10-18 12:52:45'),(2,'素食光盘套餐','清炒时蔬 + 麻婆豆腐 + 小份米饭，低卡又光盘','[\"清炒时蔬\", \"麻婆豆腐\", \"小份米饭\"]',4,'素食,健康','2026-10-18 12:52:45'),(3,'均衡营养套餐','鱼香肉丝(半份) + 番茄炒蛋(半份) + 小份米饭','[\"半份鱼香肉丝\", \"半份番茄炒蛋\", \"小份米饭\"]',3,'均衡,推荐','2026-10-18 12:52:45');
/*!40000 ALTER TABLE `recipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rule_configs`
--

DROP TABLE IF EXISTS `rule_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_configs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `cfg_key` varchar(64) NOT NULL,
  `cfg_value` text NOT NULL COMMENT 'JSON 值',
  `description` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`cfg_key`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='判定规则配置';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rule_configs`
--

LOCK TABLES `rule_configs` WRITE;
/*!40000 ALTER TABLE `rule_configs` DISABLE KEYS */;
INSERT INTO `rule_configs` VALUES (1,'ai_enabled','true','是否启用 AI 预判','2026-10-18 12:47:58'),(2,'ai_threshold','0.6','AI 判定为光盘的置信度阈值','2026-10-18 12:47:58'),(3,'points_per_checkin','10','每次打卡通过发放的积分','2026-10-18 12:47:58'),(4,'daily_checkin_limit','1','每日打卡次数上限','2026-10-18 12:47:58'),(5,'checkin_review_mode','manual_with_ai','审核模式: manual/manual_with_ai/auto','2026-10-18 12:47:58');
/*!40000 ALTER TABLE `rule_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `openid` varchar(64) DEFAULT NULL COMMENT '微信小程序 openid，模拟登录可为空',
  `username` varchar(64) NOT NULL COMMENT '登录账号',
  `password` varchar(255) NOT NULL COMMENT '密码(bcrypt 哈希)',
  `nickname` varchar(64) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像地址',
  `role` enum('student','admin') NOT NULL DEFAULT 'student',
  `student_no` varchar(32) DEFAULT NULL COMMENT '学号',
  `class_name` varchar(64) DEFAULT NULL COMMENT '班级',
  `dormitory` varchar(64) DEFAULT NULL COMMENT '宿舍号',
  `total_points` int NOT NULL DEFAULT '0' COMMENT '累计获得积分',
  `balance_points` int NOT NULL DEFAULT '0' COMMENT '当前可用积分',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1正常 0禁用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_openid` (`openid`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'admin','$2a$10$NMPRDgQdUM1XDYieOn7zkOdb3mrrOJ6BoEWRCSOQYLlyrp6cE3/36','系统管理员',NULL,'admin',NULL,NULL,NULL,0,0,1,'2026-10-18 12:47:58','2026-10-18 12:52:45'),(2,NULL,'student1','$2a$10$7SxWCTYcq2b8dilE3NXJ5eXTPqPwJnXUCAYX3LV1YUapLM3DiA4pi','张三',NULL,'student','20220101','计科2201班','A-101',100,70,1,'2026-10-18 12:52:45','2026-10-18 17:56:23'),(3,NULL,'student2','$2a$10$7SxWCTYcq2b8dilE3NXJ5eXTPqPwJnXUCAYX3LV1YUapLM3DiA4pi','李四',NULL,'student','20220102','计科2201班','A-102',20,20,1,'2026-10-18 12:52:45','2026-10-18 18:26:46'),(4,NULL,'student3','$2a$10$7SxWCTYcq2b8dilE3NXJ5eXTPqPwJnXUCAYX3LV1YUapLM3DiA4pi','王五',NULL,'student','20220103','软件2202班','B-203',10,10,1,'2026-10-18 12:52:45','2026-10-18 14:32:18'),(5,NULL,'student4','$2a$10$7SxWCTYcq2b8dilE3NXJ5eXTPqPwJnXUCAYX3LV1YUapLM3DiA4pi','赵六',NULL,'student','20220104','软件2202班','B-204',0,0,1,'2026-10-18 12:52:45','2026-10-18 14:32:18'),(6,NULL,'student5','$2a$10$7SxWCTYcq2b8dilE3NXJ5eXTPqPwJnXUCAYX3LV1YUapLM3DiA4pi','孙七',NULL,'student','20220105','网络2203班','C-305',0,0,1,'2026-10-18 12:52:45','2026-10-18 14:32:18'),(7,NULL,'student6','$2a$10$pI0pL1Hmbar8xktjDRgVMOnApoC4NeCDHmYkOx99TY2QFEPWRr7SO','钱八',NULL,'student','20220106','计科2201班','A-103',0,0,1,'2026-10-18 18:00:29','2026-10-18 18:00:29'),(8,NULL,'student7','$2a$10$pI0pL1Hmbar8xktjDRgVMOnApoC4NeCDHmYkOx99TY2QFEPWRr7SO','周九',NULL,'student','20220107','计科2202班','A-201',0,0,1,'2026-10-18 18:00:29','2026-10-18 18:00:29'),(9,NULL,'student8','$2a$10$pI0pL1Hmbar8xktjDRgVMOnApoC4NeCDHmYkOx99TY2QFEPWRr7SO','吴十',NULL,'student','20220108','软件2202班','B-205',0,0,1,'2026-10-18 18:00:29','2026-10-18 18:00:29'),(10,NULL,'student9','$2a$10$pI0pL1Hmbar8xktjDRgVMOnApoC4NeCDHmYkOx99TY2QFEPWRr7SO','郑十一',NULL,'student','20220109','网络2203班','C-306',0,0,1,'2026-10-18 18:00:29','2026-10-18 18:00:29'),(11,NULL,'student10','$2a$10$pI0pL1Hmbar8xktjDRgVMOnApoC4NeCDHmYkOx99TY2QFEPWRr7SO','冯十二',NULL,'student','20220110','计科2202班','A-202',0,0,1,'2026-10-18 18:00:29','2026-10-18 18:00:29');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'clean_plate'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-18 18:42:38
