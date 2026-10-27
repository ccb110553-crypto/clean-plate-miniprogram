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

// 菜单管理
export const listAdminMenus = (params) => request.get('/api/admin/menus', { params });
export const createMenu = (formData) => request.post('/api/admin/menus', formData);
export const updateMenu = (id, formData) => request.put(`/api/admin/menus/${id}`, formData);
export const toggleMenu = (id) => request.post(`/api/admin/menus/${id}/toggle`);
export const deleteMenu = (id) => request.delete(`/api/admin/menus/${id}`);

// 挑战活动管理
export const listAdminChallenges = () => request.get('/api/admin/challenges');
export const createChallenge = (data) => request.post('/api/admin/challenges', data);
export const updateChallenge = (id, data) => request.put(`/api/admin/challenges/${id}`, data);
export const deleteChallenge = (id) => request.delete(`/api/admin/challenges/${id}`);
export const listChallengeParticipants = (id) => request.get(`/api/admin/challenges/${id}/participants`);
export const toggleChallengeParticipant = (id, participantId) => request.post(`/api/admin/challenges/${id}/participants/${participantId}/toggle`);

// 商城商品管理
export const listAdminProducts = () => request.get('/api/admin/products');
export const createProduct = (formData) => request.post('/api/admin/products', formData);
export const updateProduct = (id, formData) => request.put(`/api/admin/products/${id}`, formData);
export const toggleProduct = (id) => request.post(`/api/admin/products/${id}/toggle`);
export const deleteProduct = (id) => request.delete(`/api/admin/products/${id}`);

// 食谱推荐管理
export const listAdminRecipes = () => request.get('/api/admin/recipes');
export const createRecipe = (data) => request.post('/api/admin/recipes', data);
export const updateRecipe = (id, data) => request.put(`/api/admin/recipes/${id}`, data);
export const deleteRecipe = (id) => request.delete(`/api/admin/recipes/${id}`);
