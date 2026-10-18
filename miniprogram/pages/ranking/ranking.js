const { get } = require('../../utils/request');

Page({
  data: {
    id: null,
    challenge: null,
    list: [],
    type: 'personal',
    typeText: '个人',
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadData();
  },

  async loadData() {
    try {
      const [list, challenges] = await Promise.all([
        get(`/challenges/${this.data.id}/ranking`),
        get('/challenges'),
      ]);
      const challenge = challenges.find((c) => c.id == this.data.id) || null;
      const type = challenge ? challenge.type : 'personal';
      this.setData({
        list,
        challenge,
        type,
        typeText: { personal: '个人', class: '班级', dormitory: '宿舍' }[type],
      });
    } catch (e) {
      // 静默处理
    }
  },

  // 榜单名称字段：个人榜显示 nickname，班级/宿舍榜显示 name
  nameOf(item) {
    return item.nickname || item.name || '-';
  },

  medal(rank) {
    return rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}`;
  },
});
