const { get } = require('../../utils/request');

Page({
  data: {
    userInfo: null,
    points: { balancePoints: 0, totalPoints: 0 },
  },

  onShow() {
    if (!wx.getStorageSync('token')) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({ userInfo: wx.getStorageSync('userInfo') });
    this.loadPoints();
  },

  async loadPoints() {
    try {
      const points = await get('/points');
      this.setData({ points });
    } catch (e) {
      // 静默处理
    }
  },

  goRecords() {
    wx.navigateTo({ url: '/pages/records/records' });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          getApp().globalData.userInfo = null;
          wx.reLaunch({ url: '/pages/login/login' });
        }
      },
    });
  },
});
