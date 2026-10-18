<template>
  <el-card>
    <div class="toolbar">
      <el-select v-model="role" placeholder="角色" clearable style="width: 130px" @change="() => load(1)">
        <el-option label="学生" value="student" />
        <el-option label="管理员" value="admin" />
      </el-select>
      <el-select
        v-model="className"
        placeholder="按班级筛选"
        clearable
        filterable
        style="width: 190px"
        @change="() => load(1)"
      >
        <el-option v-for="c in classes" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select
        v-model="dormitory"
        placeholder="按宿舍筛选"
        clearable
        filterable
        style="width: 160px"
        @change="() => load(1)"
      >
        <el-option v-for="d in dormitories" :key="d" :label="d" :value="d" />
      </el-select>
      <el-input
        v-model="keyword"
        placeholder="搜索用户名 / 昵称 / 学号"
        clearable
        style="width: 240px"
        @keyup.enter="() => load(1)"
        @clear="() => load(1)"
      />
      <el-button type="primary" @click="() => load(1)">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="studentNo" label="学号" width="110">
        <template #default="{ row }">{{ row.studentNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="className" label="班级" width="130">
        <template #default="{ row }">{{ row.className || '-' }}</template>
      </el-table-column>
      <el-table-column prop="dormitory" label="宿舍" width="110">
        <template #default="{ row }">{{ row.dormitory || '-' }}</template>
      </el-table-column>
      <el-table-column prop="balancePoints" label="可用积分" width="90" align="center" />
      <el-table-column prop="totalPoints" label="累计积分" width="90" align="center" />
      <el-table-column label="角色" width="90">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
            {{ row.role === 'admin' ? '管理员' : '学生' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.role !== 'admin'"
            :type="row.status === 1 ? 'danger' : 'success'"
            size="small"
            @click="toggle(row)"
          >
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listUsers, toggleUser, getUserFilters } from '../api';

const role = ref('');
const className = ref('');
const dormitory = ref('');
const keyword = ref('');
const classes = ref([]);
const dormitories = ref([]);
const list = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);

async function load(p = page.value) {
  page.value = p;
  loading.value = true;
  try {
    const data = await listUsers({
      role: role.value,
      className: className.value,
      dormitory: dormitory.value,
      keyword: keyword.value,
      page: p,
      pageSize: pageSize.value,
    });
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function loadFilters() {
  const data = await getUserFilters();
  classes.value = data.classes;
  dormitories.value = data.dormitories;
}

function toggle(row) {
  const action = row.status === 1 ? '禁用' : '启用';
  ElMessageBox.confirm(`确定${action}用户「${row.nickname}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await toggleUser(row.id);
      ElMessage.success(`已${action}`);
      load();
    })
    .catch(() => {});
}

onMounted(() => {
  load();
  loadFilters();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
