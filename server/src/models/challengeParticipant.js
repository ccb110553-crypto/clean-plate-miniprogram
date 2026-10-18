const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChallengeParticipant = sequelize.define('ChallengeParticipant', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  challengeId: { type: DataTypes.INTEGER.UNSIGNED, field: 'challenge_id', allowNull: false },
  userId: { type: DataTypes.INTEGER.UNSIGNED, field: 'user_id', allowNull: true },
  groupKey: { type: DataTypes.STRING(64), field: 'group_key', allowNull: true },
  groupName: { type: DataTypes.STRING(64), field: 'group_name', allowNull: true },
}, {
  tableName: 'challenge_participants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = ChallengeParticipant;
