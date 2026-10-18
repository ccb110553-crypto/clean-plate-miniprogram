<template>
  <div class="login-page">
    <div class="login-box">
      <h2 class="title">🥣 光盘行动管理端</h2>
      <p class="subtitle">餐食打卡积分系统</p>

      <el-form @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="密码" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleLogin">
          登 录
        </el-button>
      </el-form>

      <p class="hint">默认账号 admin / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login } from '../api';

const router = useRouter();
const username = ref('admin');
const password = ref('admin123');
const loading = ref(false);

async function handleLogin() {
  if (!username.value || !password.value) {
    return ElMessage.warning('请输入用户名和密码');
  }
  loading.value = true;
  try {
    const data = await login({ username: username.value, password: password.value });
    localStorage.setItem('token', data.token);
    localStorage.setItem('userInfo', JSON.stringify(data.user));
    ElMessage.success('登录成功');
    router.push('/dashboard');
  } catch (e) {
    // 错误已在拦截器提示
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2e7d32, #43a047);
}

.login-box {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.title {
  text-align: center;
  margin: 0 0 4px;
  color: #2e7d32;
}

.subtitle {
  text-align: center;
  color: #999;
  margin: 0 0 24px;
  font-size: 13px;
}

.hint {
  text-align: center;
  color: #bbb;
  font-size: 12px;
  margin-top: 16px;
}
</style>
