const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RuleConfig = sequelize.define('RuleConfig', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  cfgKey: { type: DataTypes.STRING(64), field: 'cfg_key', allowNull: false, unique: true },
  cfgValue: { type: DataTypes.TEXT, field: 'cfg_value', allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'rule_configs',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports = RuleConfig;
