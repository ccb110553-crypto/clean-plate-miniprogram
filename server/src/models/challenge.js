const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Challenge = sequelize.define('Challenge', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(128), allowNull: false },
  type: { type: DataTypes.ENUM('personal', 'class', 'dormitory'), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  startTime: { type: DataTypes.DATE, field: 'start_time', allowNull: false },
  endTime: { type: DataTypes.DATE, field: 'end_time', allowNull: false },
  rules: { type: DataTypes.JSON, allowNull: true },
  status: { type: DataTypes.ENUM('draft', 'ongoing', 'finished'), allowNull: false, defaultValue: 'draft' },
}, {
  tableName: 'challenges',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Challenge;
