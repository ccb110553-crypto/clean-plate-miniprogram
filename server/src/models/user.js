const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  openid: { type: DataTypes.STRING(64), allowNull: true, unique: true },
  username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  nickname: { type: DataTypes.STRING(64), allowNull: true },
  avatar: { type: DataTypes.STRING(255), allowNull: true },
  role: { type: DataTypes.ENUM('student', 'admin'), allowNull: false, defaultValue: 'student' },
  studentNo: { type: DataTypes.STRING(32), field: 'student_no', allowNull: true },
  className: { type: DataTypes.STRING(64), field: 'class_name', allowNull: true },
  dormitory: { type: DataTypes.STRING(64), allowNull: true },
  totalPoints: { type: DataTypes.INTEGER, field: 'total_points', allowNull: false, defaultValue: 0 },
  balancePoints: { type: DataTypes.INTEGER, field: 'balance_points', allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
