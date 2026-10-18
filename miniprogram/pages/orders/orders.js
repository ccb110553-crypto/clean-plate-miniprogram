const { get, post } = require('../../utils/request');

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    total: 0,
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    try {
      const res = await get(`/orders?page=${this.data.page}&pageSize=${this.data.pageSize}`);
      this.setData({
        list: this.data.page === 1 ? res.list : this.data.list.concat(res.list),
        total: res.total,
      });
    } catch (e) {
      // 静默处理
    }
  },

  onReachBottom() {
    if (this.data.list.length < this.data.total) {
      this.setData({ page: this.data.page + 1 }, () => this.loadData());
    }
  },

  async cancel(e) {
    const { id } = e.currentTarget.dataset;
    const res = await wx.showModal({ title: '取消兑换', content: '取消后积分将原路退还，确定？' });
    if (!res.confirm) return;
    try {
      await post(`/orders/${id}/cancel`);
      wx.showToast({ title: '已取消', icon: 'success' });
      this.setData({ page: 1 });
      this.loadData();
    } catch (e) {}
  },

  statusMap(status) {
    return { pending: '待发放', fulfilled: '已发放', cancelled: '已取消' }[status] || status;
  },
});
