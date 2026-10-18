const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PointsLog = sequelize.define('PointsLog', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, field: 'user_id', allowNull: false },
  changeType: { type: DataTypes.ENUM('earn', 'spend'), field: 'change_type', allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false },
  balanceAfter: { type: DataTypes.INTEGER, field: 'balance_after', allowNull: false },
  source: { type: DataTypes.STRING(32), allowNull: false },
  refId: { type: DataTypes.INTEGER.UNSIGNED, field: 'ref_id', allowNull: true },
  remark: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'points_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = PointsLog;
