const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Checkin = sequelize.define('Checkin', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, field: 'user_id', allowNull: false },
  imageUrl: { type: DataTypes.STRING(255), field: 'image_url', allowNull: false },
  menuId: { type: DataTypes.INTEGER.UNSIGNED, field: 'menu_id', allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  aiResult: { type: DataTypes.JSON, field: 'ai_result', allowNull: true },
  aiScore: { type: DataTypes.DECIMAL(5, 2), field: 'ai_score', allowNull: true },
  aiLabel: { type: DataTypes.STRING(32), field: 'ai_label', allowNull: true },
  rejectReason: { type: DataTypes.STRING(255), field: 'reject_reason', allowNull: true },
  pointsAwarded: { type: DataTypes.INTEGER, field: 'points_awarded', allowNull: false, defaultValue: 0 },
  reviewerId: { type: DataTypes.INTEGER.UNSIGNED, field: 'reviewer_id', allowNull: true },
  reviewedAt: { type: DataTypes.DATE, field: 'reviewed_at', allowNull: true },
  checkinDate: { type: DataTypes.DATEONLY, field: 'checkin_date', allowNull: false },
  mealType: { type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'), field: 'meal_type', allowNull: false, defaultValue: 'lunch' },
}, {
  tableName: 'checkins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Checkin;
