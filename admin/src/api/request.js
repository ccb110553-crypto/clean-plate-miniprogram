import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

const request = axios.create({ baseURL: '', timeout: 15000 });

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (body.code === 0) return body.data;
    if (body.code === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      router.push('/login');
    }
    ElMessage.error(body.message || '请求失败');
    return Promise.reject(body);
  },
  (err) => {
    ElMessage.error(err.message || '网络异常，请检查后端服务');
    return Promise.reject(err);
  }
);

export default request;
