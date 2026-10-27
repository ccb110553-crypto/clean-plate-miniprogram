/**
 * 数据初始化脚本：设置管理员密码 + 插入测试数据
 * 运行: npm run seed
 */
const bcrypt = require('bcryptjs');
const { sequelize, User, Menu, Recipe, Product, Challenge } = require('./src/models');
const { localDate } = require('./src/utils/date');

async function seed() {
  // 1. 管理员密码 admin123
  const adminHash = await bcrypt.hash('admin123', 10);
  await User.update({ password: adminHash, nickname: '系统管理员' }, { where: { username: 'admin' } });
  console.log('[√] 管理员账号: admin / admin123');

  // 2. 测试学生
  const studentHash = await bcrypt.hash('123456', 10);
  const students = [
    { username: 'student1', nickname: '张三', studentNo: '20220101', className: '计科2201班', dormitory: 'A-101' },
    { username: 'student2', nickname: '李四', studentNo: '20220102', className: '计科2201班', dormitory: 'A-102' },
    { username: 'student3', nickname: '王五', studentNo: '20220103', className: '软件2202班', dormitory: 'B-203' },
    { username: 'student4', nickname: '赵六', studentNo: '20220104', className: '软件2202班', dormitory: 'B-204' },
    { username: 'student5', nickname: '孙七', studentNo: '20220105', className: '网络2203班', dormitory: 'C-305' },
  ];
  for (const s of students) {
    const [user, created] = await User.findOrCreate({
      where: { username: s.username },
      defaults: { ...s, password: studentHash, role: 'student' },
    });
    if (created) console.log(`[√] 创建学生: ${s.username} / 123456 (${s.nickname})`);
  }

  // 3. 本周菜单（周一~周日午餐）
  const dishPool = [
    { name: '红烧肉', category: '荤菜', price: 8, small: 0 },
    { name: '宫保鸡丁', category: '荤菜', price: 7, small: 0 },
    { name: '鱼香肉丝', category: '荤菜', price: 7, small: 1 },
    { name: '糖醋排骨', category: '荤菜', price: 10, small: 0 },
    { name: '清炒时蔬', category: '素菜', price: 3, small: 1 },
    { name: '番茄炒蛋', category: '素菜', price: 4, small: 1 },
    { name: '麻婆豆腐', category: '素菜', price: 4, small: 1 },
    { name: '酸辣土豆丝', category: '素菜', price: 3, small: 1 },
    { name: '米饭', category: '主食', price: 1, small: 1 },
    { name: '紫菜蛋花汤', category: '汤', price: 2, small: 0 },
  ];

  const today = new Date();
  const existingMenuCount = await Menu.count();
  if (existingMenuCount === 0) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dateStr = localDate(date);
      for (let k = 0; k < dishPool.length; k++) {
        const dish = dishPool[(d + k) % dishPool.length];
        await Menu.create({
          menuDate: dateStr,
          week: 1,
          mealType: 'lunch',
          dishName: dish.name,
          category: dish.category,
          price: dish.price,
          isSmall: dish.small,
        });
      }
    }
    console.log('[√] 已生成本周 7 天午餐菜单');
  }

  // 4. 食谱推荐
  const recipes = [
    { title: '轻食半份套餐', description: '半份宫保鸡丁 + 小份米饭，荤素搭配不浪费', dishes: ['半份宫保鸡丁', '小份米饭'], pointsSaved: 5, tags: '轻食,实惠' },
    { title: '素食光盘套餐', description: '清炒时蔬 + 麻婆豆腐 + 小份米饭，低卡又光盘', dishes: ['清炒时蔬', '麻婆豆腐', '小份米饭'], pointsSaved: 4, tags: '素食,健康' },
    { title: '均衡营养套餐', description: '鱼香肉丝(半份) + 番茄炒蛋(半份) + 小份米饭', dishes: ['半份鱼香肉丝', '半份番茄炒蛋', '小份米饭'], pointsSaved: 3, tags: '均衡,推荐' },
  ];
  for (const r of recipes) {
    await Recipe.findOrCreate({ where: { title: r.title }, defaults: r });
  }
  console.log('[√] 食谱推荐数据就绪');

  // 5. 商城商品（代金券 + 公益捐赠）
  const products = [
    { name: '5 元代金券', type: 'voucher', description: '食堂通用 5 元代金券', pointsCost: 50, stock: 100 },
    { name: '10 元代金券', type: 'voucher', description: '食堂通用 10 元代金券', pointsCost: 90, stock: 100 },
    { name: '免费午餐券', type: 'voucher', description: '兑换一份免费午餐', pointsCost: 200, stock: 50 },
    { name: '公益捐赠 - 爱心午餐', type: 'donation', description: '用积分捐赠一份爱心午餐给山区儿童', pointsCost: 100, stock: -1 },
    { name: '公益捐赠 - 光盘公益金', type: 'donation', description: '积分折算为公益金，支持光盘行动宣传', pointsCost: 50, stock: -1 },
  ];
  for (const p of products) {
    await Product.findOrCreate({ where: { name: p.name }, defaults: p });
  }
  console.log('[√] 商城商品数据就绪');

  // 6. 挑战活动（个人 / 班级 / 宿舍）
  const challengeCount = await Challenge.count();
  if (challengeCount === 0) {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 3600 * 1000);
    const end = new Date(now.getTime() + 6 * 24 * 3600 * 1000);
    await Challenge.create({
      title: '本周个人光盘挑战',
      type: 'personal',
      description: '一周内完成 3 次光盘打卡即可上榜',
      startTime: start,
      endTime: end,
      status: 'ongoing',
    });
    await Challenge.create({
      title: '班级光盘争霸赛',
      type: 'class',
      description: '班级累计光盘积分比拼',
      startTime: start,
      endTime: end,
      status: 'ongoing',
    });
    await Challenge.create({
      title: '宿舍光盘擂台赛',
      type: 'dormitory',
      description: '宿舍楼光盘积分比拼',
      startTime: start,
      endTime: end,
      status: 'ongoing',
    });
    console.log('[√] 挑战活动数据就绪');
  }

  console.log('\n初始化完成！');
  await sequelize.close();
}

seed().catch((e) => {
  console.error('[×] 初始化失败:', e.message);
  process.exit(1);
});
