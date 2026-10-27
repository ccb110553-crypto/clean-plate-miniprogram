const { Challenge, Product, Recipe, ChallengeParticipant, User, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { ok, fail } = require('../utils/response');

// ============ 挑战活动管理 ============

const CHALLENGE_TYPES = ['personal', 'class', 'dormitory'];
const CHALLENGE_STATUS = ['draft', 'ongoing', 'finished'];

async function listChallenges(req, res) {
  const list = await Challenge.findAll({ order: [['created_at', 'DESC']] });
  return ok(res, list);
}

async function createChallenge(req, res) {
  const { title, type, description, startTime, endTime, status } = req.body;
  if (!title) return fail(res, '请输入挑战名称');
  if (!CHALLENGE_TYPES.includes(type)) return fail(res, '挑战类型不合法');

  const challenge = await Challenge.create({
    title,
    type,
    description: description || '',
    startTime: startTime || null,
    endTime: endTime || null,
    status: CHALLENGE_STATUS.includes(status) ? status : 'draft',
  });
  return ok(res, challenge, '创建成功');
}

async function updateChallenge(req, res) {
  const { id } = req.params;
  const challenge = await Challenge.findByPk(id);
  if (!challenge) return fail(res, '挑战不存在', 1, 404);

  const { title, type, description, startTime, endTime, status } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title;
  if (type !== undefined) {
    if (!CHALLENGE_TYPES.includes(type)) return fail(res, '挑战类型不合法');
    patch.type = type;
  }
  if (description !== undefined) patch.description = description;
  if (startTime !== undefined) patch.startTime = startTime || null;
  if (endTime !== undefined) patch.endTime = endTime || null;
  if (status !== undefined) {
    if (!CHALLENGE_STATUS.includes(status)) return fail(res, '挑战状态不合法');
    patch.status = status;
  }

  await challenge.update(patch);
  return ok(res, challenge, '已更新');
}

async function deleteChallenge(req, res) {
  const { id } = req.params;
  const challenge = await Challenge.findByPk(id);
  if (!challenge) return fail(res, '挑战不存在', 1, 404);
  await challenge.destroy();
  return ok(res, null, '已删除');
}

// ============ 商城商品管理 ============

const PRODUCT_TYPES = ['voucher', 'donation'];

async function listProducts(req, res) {
  const list = await Product.findAll({ order: [['created_at', 'DESC']] });
  return ok(res, list);
}

async function createProduct(req, res) {
  const { name, type, description, pointsCost, stock } = req.body;
  if (!name) return fail(res, '请输入商品名称');
  if (!PRODUCT_TYPES.includes(type)) return fail(res, '商品类型不合法');
  if (pointsCost === undefined || pointsCost === '' || Number(pointsCost) < 0) return fail(res, '积分价格不合法');

  const image = req.file ? '/uploads/products/' + req.file.filename : (req.body.image || null);
  const product = await Product.create({
    name,
    type,
    description: description || '',
    image,
    pointsCost: parseInt(pointsCost),
    stock: stock === undefined || stock === '' ? -1 : parseInt(stock),
    status: 1,
  });
  return ok(res, product, '新增成功');
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const product = await Product.findByPk(id);
  if (!product) return fail(res, '商品不存在', 1, 404);

  const { name, type, description, pointsCost, stock } = req.body;
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (type !== undefined) {
    if (!PRODUCT_TYPES.includes(type)) return fail(res, '商品类型不合法');
    patch.type = type;
  }
  if (description !== undefined) patch.description = description;
  if (pointsCost !== undefined && pointsCost !== '') patch.pointsCost = parseInt(pointsCost);
  if (stock !== undefined && stock !== '') patch.stock = parseInt(stock);
  if (req.file) patch.image = '/uploads/products/' + req.file.filename;
  else if (req.body.image !== undefined) patch.image = req.body.image;

  await product.update(patch);
  return ok(res, product, '已更新');
}

async function toggleProduct(req, res) {
  const { id } = req.params;
  const product = await Product.findByPk(id);
  if (!product) return fail(res, '商品不存在', 1, 404);
  const next = product.status === 1 ? 0 : 1;
  await product.update({ status: next });
  return ok(res, { id: product.id, status: next }, next === 1 ? '已上架' : '已下架');
}

async function deleteProduct(req, res) {
  const { id } = req.params;
  const product = await Product.findByPk(id);
  if (!product) return fail(res, '商品不存在', 1, 404);
  await product.destroy();
  return ok(res, null, '已删除');
}

// ============ 食谱推荐管理 ============

function parseDishes(dishes) {
  if (Array.isArray(dishes)) return dishes;
  return String(dishes || '').split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
}

async function listRecipes(req, res) {
  const list = await Recipe.findAll({ order: [['id', 'ASC']] });
  return ok(res, list);
}

async function createRecipe(req, res) {
  const { title, description, dishes, pointsSaved, tags } = req.body;
  if (!title) return fail(res, '请输入方案名称');
  const dishArr = parseDishes(dishes);
  if (dishArr.length === 0) return fail(res, '请填写搭配菜品');

  const recipe = await Recipe.create({
    title,
    description: description || '',
    dishes: dishArr,
    pointsSaved: pointsSaved === undefined || pointsSaved === '' ? 0 : parseInt(pointsSaved),
    tags: tags || '',
  });
  return ok(res, recipe, '创建成功');
}

async function updateRecipe(req, res) {
  const { id } = req.params;
  const recipe = await Recipe.findByPk(id);
  if (!recipe) return fail(res, '方案不存在', 1, 404);

  const { title, description, dishes, pointsSaved, tags } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;
  if (dishes !== undefined) patch.dishes = parseDishes(dishes);
  if (pointsSaved !== undefined && pointsSaved !== '') patch.pointsSaved = parseInt(pointsSaved);
  if (tags !== undefined) patch.tags = tags;

  await recipe.update(patch);
  return ok(res, recipe, '已更新');
}

async function deleteRecipe(req, res) {
  const { id } = req.params;
  const recipe = await Recipe.findByPk(id);
  if (!recipe) return fail(res, '方案不存在', 1, 404);
  await recipe.destroy();
  return ok(res, null, '已删除');
}

// ============ 挑战报名管理 ============

// 查看某挑战的报名情况：个人挑战返回报名者，班级/宿舍挑战返回报名队伍及成员
async function listChallengeParticipants(req, res) {
  const { id } = req.params;
  const challenge = await Challenge.findByPk(id);
  if (!challenge) return fail(res, '挑战不存在', 1, 404);

  if (challenge.type === 'personal') {
    const rows = await ChallengeParticipant.findAll({
      where: { challengeId: id },
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'studentNo', 'className', 'dormitory'] }],
      order: [['created_at', 'ASC']],
    });
    const participants = rows.map((p) => ({
      id: p.id,
      name: p.user ? p.user.nickname : '(已注销用户)',
      studentNo: p.user ? p.user.studentNo : '',
      className: p.user ? p.user.className : '',
      status: p.status,
    }));
    return ok(res, { type: 'personal', total: participants.length, participants });
  }

  // 班级 / 宿舍挑战：按队伍聚合，成员从用户表实时统计
  const field = challenge.type === 'class' ? 'class_name' : 'dormitory';
  const groups = await ChallengeParticipant.findAll({ where: { challengeId: id }, order: [['created_at', 'ASC']] });
  const participants = [];
  for (const g of groups) {
    const members = await sequelize.query(
      `SELECT nickname, student_no AS studentNo FROM users WHERE role='student' AND ${field} = :val ORDER BY student_no`,
      { replacements: { val: g.groupKey }, type: QueryTypes.SELECT }
    );
    participants.push({
      id: g.id,
      name: g.groupName || g.groupKey,
      status: g.status,
      memberCount: members.length,
      members: members.map((m) => m.nickname),
    });
  }
  return ok(res, { type: challenge.type, total: participants.length, participants });
}

// 切换某报名记录能否参加（active / blocked）
async function toggleChallengeParticipant(req, res) {
  const { id, participantId } = req.params;
  const challenge = await Challenge.findByPk(id);
  if (!challenge) return fail(res, '挑战不存在', 1, 404);

  const participant = await ChallengeParticipant.findByPk(participantId);
  if (!participant || participant.challengeId !== parseInt(id)) return fail(res, '报名记录不存在', 1, 404);

  const next = participant.status === 'active' ? 'blocked' : 'active';
  await participant.update({ status: next });
  return ok(res, { id: participant.id, status: next }, next === 'active' ? '已允许参加' : '已禁止参加');
}

module.exports = {
  listChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  listChallengeParticipants,
  toggleChallengeParticipant,
  listProducts,
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
  listRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
