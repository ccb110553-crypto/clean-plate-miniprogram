const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Menu = sequelize.define('Menu', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  menuDate: { type: DataTypes.DATEONLY, field: 'menu_date', allowNull: false },
  week: { type: DataTypes.INTEGER, allowNull: false },
  mealType: { type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'), field: 'meal_type', allowNull: false, defaultValue: 'lunch' },
  dishName: { type: DataTypes.STRING(64), field: 'dish_name', allowNull: false },
  category: { type: DataTypes.STRING(32), allowNull: true, defaultValue: '素菜' },
  price: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
  isSmall: { type: DataTypes.TINYINT, field: 'is_small', allowNull: false, defaultValue: 0 },
  image: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'menus',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Menu;
