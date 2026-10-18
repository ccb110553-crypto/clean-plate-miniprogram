const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  type: { type: DataTypes.ENUM('voucher', 'donation'), allowNull: false, defaultValue: 'voucher' },
  description: { type: DataTypes.TEXT, allowNull: true },
  image: { type: DataTypes.STRING(255), allowNull: true },
  pointsCost: { type: DataTypes.INTEGER, field: 'points_cost', allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: -1 },
  status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Product;
