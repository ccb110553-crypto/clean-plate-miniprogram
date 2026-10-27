const { get, fullImage } = require('../../utils/request');

Page({
  data: {
    userInfo: null,
    points: { balancePoints: 0, totalPoints: 0 },
    todayStatus: null,
    menus: [],
  },

  onShow() {
    if (!wx.getStorageSync('token')) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({ userInfo: wx.getStorageSync('userInfo') });
    this.loadData();
  },

  async loadData() {
    try {
      const today = this.todayStr();
      const [points, menus, records] = await Promise.all([
        get('/points'),
        get(`/menus?mealType=lunch&date=${today}`),
        get('/checkins?page=1&pageSize=10'),
      ]);
      const todayCheckin = records.list.find((c) => c.checkinDate === today) || null;
      const todayMenus = menus.slice(0, 8).map((m) => ({ ...m, image: fullImage(m.image) }));
      this.setData({ points, menus: todayMenus, todayStatus: todayCheckin });
    } catch (e) {
      // 静默处理
    }
  },

  todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  statusText(status) {
    return { pending: '待审核', approved: '已通过', rejected: '已驳回' }[status] || status;
  },

  goCheckin() {
    wx.navigateTo({ url: '/pages/checkin/checkin' });
  },
  goRecords() {
    wx.navigateTo({ url: '/pages/records/records' });
  },
  goShop() {
    wx.switchTab({ url: '/pages/shop/shop' });
  },
  goChallenge() {
    wx.switchTab({ url: '/pages/challenge/challenge' });
  },
  goRecipe() {
    wx.navigateTo({ url: '/pages/recipe/recipe' });
  },
  goMenu() {
    wx.navigateTo({ url: '/pages/menu/menu' });
  },

  // 预览菜品大图
  preview(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    wx.previewImage({ current: url, urls: [url] });
  },
});
