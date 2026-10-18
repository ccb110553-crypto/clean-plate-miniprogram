const { Menu, Recipe } = require('../models');
const { Op } = require('sequelize');
const { ok } = require('../utils/response');

// 菜单列表（可按日期/周次/餐次筛选）
async function listMenus(req, res) {
  const { date, week, mealType } = req.query;
  const where = {};
  if (date) where.menuDate = date;
  if (week) where.week = parseInt(week);
  if (mealType) where.mealType = mealType;

  const menus = await Menu.findAll({
    where,
    order: [['menuDate', 'ASC'], ['mealType', 'ASC'], ['id', 'ASC']],
  });
  return ok(res, menus);
}

// 食谱推荐列表
async function listRecipes(req, res) {
  const recipes = await Recipe.findAll({ order: [['id', 'ASC']] });
  return ok(res, recipes);
}

module.exports = { listMenus, listRecipes };
