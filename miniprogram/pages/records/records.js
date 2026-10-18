const { get, fullImage } = require('../../utils/request');

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    const { page, pageSize } = this.data;
    this.setData({ loading: true });
    try {
      const res = await get(`/checkins?page=${page}&pageSize=${pageSize}`);
      const items = res.list.map((c) => ({
        ...c,
        imageUrl: fullImage(c.imageUrl),
        menu: c.menu ? { ...c.menu, image: fullImage(c.menu.image) } : null,
      }));
      this.setData({
        list: page === 1 ? items : this.data.list.concat(items),
        total: res.total,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  onReachBottom() {
    if (this.data.list.length < this.data.total) {
      this.setData({ page: this.data.page + 1 }, () => this.loadData());
    }
  },

  statusMap(status) {
    return { pending: '待审核', approved: '已通过', rejected: '已驳回' }[status] || status;
  },

  tagClass(status) {
    return { pending: 'tag-orange', approved: 'tag-green', rejected: 'tag-red' }[status] || 'tag-gray';
  },
});
