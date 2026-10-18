const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  orderNo: { type: DataTypes.STRING(32), field: 'order_no', allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, field: 'user_id', allowNull: false },
  productId: { type: DataTypes.INTEGER.UNSIGNED, field: 'product_id', allowNull: false },
  productName: { type: DataTypes.STRING(64), field: 'product_name', allowNull: false },
  pointsCost: { type: DataTypes.INTEGER, field: 'points_cost', allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'fulfilled', 'cancelled'), allowNull: false, defaultValue: 'pending' },
  voucherCode: { type: DataTypes.STRING(64), field: 'voucher_code', allowNull: true },
  adminId: { type: DataTypes.INTEGER.UNSIGNED, field: 'admin_id', allowNull: true },
  handledAt: { type: DataTypes.DATE, field: 'handled_at', allowNull: true },
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Order;
