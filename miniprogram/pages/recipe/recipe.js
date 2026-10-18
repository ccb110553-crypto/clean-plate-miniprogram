const { get } = require('../../utils/request');

Page({
  data: {
    recipes: [],
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    try {
      const recipes = await get('/recipes');
      this.setData({ recipes });
    } catch (e) {
      // 静默处理
    }
  },
});
