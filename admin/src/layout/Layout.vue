<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">🥣 光盘行动管理端</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">📊 数据大屏</el-menu-item>
        <el-menu-item index="/checkins">✅ 打卡审核</el-menu-item>
        <el-menu-item index="/orders">🎫 订单管理</el-menu-item>
        <el-menu-item index="/rules">⚙️ 规则配置</el-menu-item>
        <el-menu-item index="/users">👥 用户管理</el-menu-item>
        <el-menu-item index="/menus">🍚 菜单管理</el-menu-item>
        <el-menu-item index="/challenges">🏆 挑战管理</el-menu-item>
        <el-menu-item index="/products">🛍️ 商品管理</el-menu-item>
        <el-menu-item index="/recipes">🥗 食谱管理</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span class="title">{{ pageTitle }}</span>
        <div class="user-box">
          <span class="username">{{ userInfo?.nickname || '管理员' }}</span>
          <el-button link type="danger" @click="logout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const activeMenu = computed(() => route.path);
const pageTitle = computed(() => route.meta.title || '');
const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  router.push('/login');
}
</script>

<style scoped>
.layout {
  height: 100vh;
}

.aside {
  background: #1f2d3d;
}

.logo {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  padding: 20px 0;
}

.aside :deep(.el-menu) {
  border-right: none;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  color: #666;
}

.main {
  background: #f5f6f8;
  padding: 20px;
}
</style>
