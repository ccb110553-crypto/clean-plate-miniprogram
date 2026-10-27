import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../layout/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '数据大屏' } },
      { path: 'checkins', component: () => import('../views/Checkins.vue'), meta: { title: '打卡审核' } },
      { path: 'orders', component: () => import('../views/Orders.vue'), meta: { title: '订单管理' } },
      { path: 'rules', component: () => import('../views/Rules.vue'), meta: { title: '规则配置' } },
      { path: 'users', component: () => import('../views/Users.vue'), meta: { title: '用户管理' } },
      { path: 'menus', component: () => import('../views/Menus.vue'), meta: { title: '菜单管理' } },
      { path: 'challenges', component: () => import('../views/Challenges.vue'), meta: { title: '挑战管理' } },
      { path: 'products', component: () => import('../views/Products.vue'), meta: { title: '商品管理' } },
      { path: 'recipes', component: () => import('../views/Recipes.vue'), meta: { title: '食谱管理' } },
    ],
  },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) return next('/login');
  if (to.path === '/login' && token) return next('/');
  next();
});

export default router;
