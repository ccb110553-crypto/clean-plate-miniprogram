const { get, fullImage } = require('../../utils/request');

const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
];

Page({
  data: {
    mealTypes: MEAL_TYPES,
    activeType: 'lunch',
    date: '',
    groupList: [],
  },

  onLoad() {
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.setData({ date });
    this.loadData();
  },

  switchType(e) {
    this.setData({ activeType: e.currentTarget.dataset.type }, () => this.loadData());
  },

  async loadData() {
    try {
      const menus = await get(`/menus?mealType=${this.data.activeType}&date=${this.data.date}`);
      const groups = {};
      menus.forEach((m) => {
        const cat = m.category || '其他';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ ...m, image: fullImage(m.image) });
      });
      const groupList = Object.keys(groups).map((k) => ({ category: k, items: groups[k] }));
      this.setData({ groupList });
    } catch (e) {
      // 静默处理
    }
  },

  // 点击菜品预览大图
  preview(e) {
    const { url, name } = e.currentTarget.dataset;
    if (!url) return;
    wx.previewImage({ current: url, urls: [url] });
  },
});
