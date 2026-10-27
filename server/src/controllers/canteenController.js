const { Menu, Recipe } = require('../models');
const { Op } = require('sequelize');
const { ok } = require('../utils/response');

// 菜单列表（统一每日菜单：返回所有上架菜品，可按餐次筛选）
async function listMenus(req, res) {
  const { mealType } = req.query;
  const where = { status: 1 };
  if (mealType) where.mealType = mealType;

  const menus = await Menu.findAll({
    where,
    order: [['mealType', 'ASC'], ['id', 'ASC']],
  });
  return ok(res, menus);
}

// 食谱推荐列表
async function listRecipes(req, res) {
  const recipes = await Recipe.findAll({ order: [['id', 'ASC']] });
  return ok(res, recipes);
}

module.exports = { listMenus, listRecipes };
