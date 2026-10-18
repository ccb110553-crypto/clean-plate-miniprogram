const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Recipe = sequelize.define('Recipe', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(128), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  dishes: { type: DataTypes.JSON, allowNull: false },
  pointsSaved: { type: DataTypes.INTEGER, field: 'points_saved', allowNull: true, defaultValue: 0 },
  tags: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'recipes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Recipe;
