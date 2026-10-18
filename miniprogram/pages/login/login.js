const { post } = require('../../utils/request');

Page({
  data: {
    mode: 'login',
    username: '',
    password: '',
    nickname: '',
    studentNo: '',
    className: '',
    dormitory: '',
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  switchMode() {
    this.setData({ mode: this.data.mode === 'login' ? 'register' : 'login' });
  },

  async submit() {
    const { mode, username, password, nickname, studentNo, className, dormitory } = this.data;
    if (!username || !password) {
      return wx.showToast({ title: '请输入用户名和密码', icon: 'none' });
    }
    if (mode === 'register' && password.length < 6) {
      return wx.showToast({ title: '密码至少 6 位', icon: 'none' });
    }

    const url = mode === 'login' ? '/auth/login' : '/auth/register';
    const data = mode === 'login'
      ? { username, password }
      : { username, password, nickname, studentNo, className, dormitory };

    try {
      const res = await post(url, data);
      wx.setStorageSync('token', res.token);
      wx.setStorageSync('userInfo', res.user);
      getApp().globalData.userInfo = res.user;
      wx.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500);
    } catch (e) {
      // 错误提示已在 request 封装中弹出
    }
  },
});
