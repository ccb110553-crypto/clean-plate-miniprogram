import request from './request';

// 认证
export const login = (data) => request.post('/api/auth/login', data);
export const getMe = () => request.get('/api/auth/me');

// 打卡审核
export const listCheckins = (params) => request.get('/api/admin/checkins', { params });
export const reviewCheckin = (id, data) => request.post(`/api/admin/checkins/${id}/review`, data);

// 订单管理
export const listOrders = (params) => request.get('/api/admin/orders', { params });
export const handleOrder = (id, data) => request.post(`/api/admin/orders/${id}/handle`, data);

// 规则配置
export const getRuleConfigs = () => request.get('/api/admin/rule-configs');
export const updateRuleConfigs = (data) => request.put('/api/admin/rule-configs', data);

// 用户管理
export const listUsers = (params) => request.get('/api/admin/users', { params });
export const toggleUser = (id) => request.post(`/api/admin/users/${id}/toggle`);
export const getUserFilters = () => request.get('/api/admin/user-filters');

// 数据大屏
export const getDashboard = () => request.get('/api/admin/dashboard');
