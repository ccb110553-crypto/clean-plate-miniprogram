const { get, post } = require('../../utils/request');

Page({
  data: {
    challenges: [],
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const list = await get('/challenges');
      const challenges = list.map((c) => ({
        ...c,
        startDate: (c.startTime || '').slice(0, 10),
        endDate: (c.endTime || '').slice(0, 10),
      }));
      this.setData({ challenges });
    } catch (e) {
      // 静默处理
    }
  },

  typeText(t) {
    return { personal: '个人', class: '班级', dormitory: '宿舍' }[t] || t;
  },

  statusText(s) {
    return { draft: '未开始', ongoing: '进行中', finished: '已结束' }[s] || s;
  },

  goRanking(e) {
    wx.navigateTo({ url: `/pages/ranking/ranking?id=${e.currentTarget.dataset.id}` });
  },

  async join(e) {
    const { id } = e.currentTarget.dataset;
    try {
      await post(`/challenges/${id}/join`);
      wx.showToast({ title: '报名成功', icon: 'success' });
    } catch (e) {
      // 错误已提示
    }
  },
});
