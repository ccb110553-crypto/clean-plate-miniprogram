const { upload, get, fullImage } = require('../../utils/request');

Page({
  data: {
    menus: [],
    selectedMenuId: null,
    imagePath: '',
    submitting: false,
    result: null,
  },

  onLoad() {
    this.loadMenus();
  },

  async loadMenus() {
    try {
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const menus = await get(`/menus?mealType=lunch&date=${date}`);
      this.setData({ menus: menus.map((m) => ({ ...m, image: fullImage(m.image) })) });
    } catch (e) {
      // 静默处理
    }
  },

  selectMenu(e) {
    this.setData({ selectedMenuId: e.currentTarget.dataset.id });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        this.setData({ imagePath: res.tempFiles[0].tempFilePath, result: null });
      },
    });
  },

  async submit() {
    if (!this.data.selectedMenuId) {
      return wx.showToast({ title: '请先选择今天吃的菜品', icon: 'none' });
    }
    if (!this.data.imagePath) {
      return wx.showToast({ title: '请先拍摄/选择餐盘照片', icon: 'none' });
    }
    this.setData({ submitting: true });
    try {
      const data = await upload('/checkins', this.data.imagePath, {
        menuId: String(this.data.selectedMenuId),
      });
      // 关联菜品图片转完整 URL
      if (data.checkin && data.checkin.menu) {
        data.checkin.menu.image = fullImage(data.checkin.menu.image);
      }
      this.setData({ result: data, submitting: false });
    } catch (e) {
      this.setData({ submitting: false });
    }
  },

  goRecords() {
    wx.redirectTo({ url: '/pages/records/records' });
  },

  backHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
