const { get, post } = require('../../utils/request');

Page({
  data: {
    products: [],
    points: 0,
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const [products, points] = await Promise.all([
        get('/products'),
        get('/points'),
      ]);
      this.setData({ products, points: points.balancePoints });
    } catch (e) {
      // 静默处理
    }
  },

  async exchange(e) {
    const { id, cost, name } = e.currentTarget.dataset;
    if (this.data.points < cost) {
      return wx.showToast({ title: '积分不足', icon: 'none' });
    }
    const res = await wx.showModal({
      title: '确认兑换',
      content: `消耗 ${cost} 积分兑换「${name}」？`,
      confirmText: '确认兑换',
    });
    if (!res.confirm) return;
    try {
      await post('/orders', { productId: id });
      wx.showToast({ title: '兑换成功', icon: 'success' });
      this.loadData();
    } catch (e) {
      // 错误已提示
    }
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
  },
});
