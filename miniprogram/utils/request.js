// 后端地址：云服务器公网 IP（走 Nginx 80 端口反向代理到后端）
const BASE_URL = 'http://60.205.107.11/api';
// 图片等静态资源基地址（不含 /api）
const IMG_BASE = 'http://60.205.107.11';

// 把后端返回的相对图片路径（如 /uploads/xxx.jpg）转为完整可访问地址
function fullImage(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return IMG_BASE + url;
}

function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? 'Bearer ' + token : '',
      },
      success(res) {
        const body = res.data || {};
        if (body.code === 0) {
          resolve(body.data);
        } else if (body.code === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({ url: '/pages/login/login' });
          reject(body);
        } else {
          wx.showToast({ title: body.message || '请求失败', icon: 'none' });
          reject(body);
        }
      },
      fail(err) {
        wx.showToast({ title: '网络异常，请检查后端服务', icon: 'none' });
        reject(err);
      },
    });
  });
}

// 上传文件（打卡照片）
function upload(url, filePath, formData = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.uploadFile({
      url: BASE_URL + url,
      filePath,
      name: 'image',
      formData,
      header: {
        Authorization: token ? 'Bearer ' + token : '',
      },
      success(res) {
        let body = {};
        try { body = JSON.parse(res.data); } catch (e) { /* ignore */ }
        if (body.code === 0) {
          resolve(body.data);
        } else {
          wx.showToast({ title: body.message || '上传失败', icon: 'none' });
          reject(body);
        }
      },
      fail(err) {
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
        reject(err);
      },
    });
  });
}

// GET 便捷方法
const get = (url, data) => request({ url, method: 'GET', data });
// POST 便捷方法
const post = (url, data) => request({ url, method: 'POST', data });

module.exports = { BASE_URL, IMG_BASE, fullImage, request, upload, get, post };
