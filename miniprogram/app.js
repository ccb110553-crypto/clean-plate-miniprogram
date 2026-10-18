App({
  globalData: {
    userInfo: null,
  },
  onLaunch() {
    // 从缓存恢复登录态
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },
});
