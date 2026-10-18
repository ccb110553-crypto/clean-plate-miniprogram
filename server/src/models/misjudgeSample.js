const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MisjudgeSample = sequelize.define('MisjudgeSample', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  checkinId: { type: DataTypes.INTEGER.UNSIGNED, field: 'checkin_id', allowNull: true },
  imageUrl: { type: DataTypes.STRING(255), field: 'image_url', allowNull: false },
  aiResult: { type: DataTypes.JSON, field: 'ai_result', allowNull: true },
  humanResult: { type: DataTypes.ENUM('empty', 'not_empty'), field: 'human_result', allowNull: false },
  isMisjudge: { type: DataTypes.TINYINT, field: 'is_misjudge', allowNull: false, defaultValue: 0 },
}, {
  tableName: 'misjudge_samples',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = MisjudgeSample;
