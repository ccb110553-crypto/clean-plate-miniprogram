const { Product, Order, sequelize } = require('../models');
const { Op } = require('sequelize');
const { ok, fail } = require('../utils/response');
const { changePoints } = require('../services/pointsService');

// 商品列表（上架中）
async function listProducts(req, res) {
  const products = await Product.findAll({
    where: { status: 1 },
    order: [['pointsCost', 'ASC']],
  });
  return ok(res, products);
}

// 兑换下单（扣积分 + 扣库存 + 生成订单，事务保证原子性）
async function createOrder(req, res) {
  const userId = req.user.id;
  const { productId } = req.body;
  if (!productId) return fail(res, '请选择要兑换的商品');

  const product = await Product.findByPk(productId);
  if (!product || product.status !== 1) return fail(res, '商品不存在或已下架');
  if (product.stock === 0) return fail(res, '商品库存不足');

  const t = await sequelize.transaction();
  try {
    // 扣积分（余额不足会抛错）
    await changePoints(userId, 'spend', product.pointsCost, 'exchange', { transaction: t });

    // 扣库存（带条件防并发超卖）
    if (product.stock > 0) {
      const [affected] = await Product.update(
        { stock: sequelize.literal('stock - 1') },
        { where: { id: product.id, stock: { [Op.gt]: 0 } }, transaction: t }
      );
      if (affected === 0) throw new Error('商品库存不足');
    }

    const orderNo = 'CD' + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const order = await Order.create({
      orderNo,
      userId,
      productId,
      productName: product.name,
      pointsCost: product.pointsCost,
      status: 'pending',
    }, { transaction: t });

    await t.commit();
    return ok(res, order, '兑换成功，等待管理员发放');
  } catch (e) {
    await t.rollback();
    return fail(res, e.message || '兑换失败');
  }
}

// 我的订单
async function myOrders(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const { rows, count } = await Order.findAndCountAll({
    where: { userId: req.user.id },
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return ok(res, { list: rows, total: count, page, pageSize });
}

// 取消订单（退还积分）
async function cancelOrder(req, res) {
  const { id } = req.params;
  const order = await Order.findOne({ where: { id, userId: req.user.id } });
  if (!order) return fail(res, '订单不存在', 1, 404);
  if (order.status !== 'pending') return fail(res, '当前状态不可取消');

  await changePoints(req.user.id, 'earn', order.pointsCost, 'exchange', {
    refId: order.id,
    remark: '取消兑换退还积分',
  });
  await order.update({ status: 'cancelled' });

  return ok(res, null, '已取消，积分已退还');
}

module.exports = { listProducts, createOrder, myOrders, cancelOrder };
