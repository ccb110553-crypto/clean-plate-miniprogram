<template>
  <el-card>
    <div class="head">
      <div>
        <h3 class="page-title">挑战活动管理</h3>
        <p class="page-sub">创建个人 / 班级 / 宿舍三类光盘挑战赛，学生端实时展示与报名</p>
      </div>
      <el-button type="primary" @click="openCreate">➕ 创建挑战</el-button>
    </div>

    <el-table :data="list" v-loading="loading">
      <el-table-column prop="title" label="挑战名称" min-width="160" />
      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="typeMap[row.type]?.tag" size="small">{{ typeMap[row.type]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" width="170">
        <template #default="{ row }">{{ fmt(row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="结束时间" width="170">
        <template #default="{ row }">{{ fmt(row.endTime) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.tag" size="small">{{ statusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openParticipants(row)">报名</el-button>
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建 / 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑挑战' : '创建挑战'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="挑战名称"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="个人挑战" value="personal" />
            <el-option label="班级挑战" value="class" />
            <el-option label="宿舍挑战" value="dormitory" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="活动说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已结束" value="finished" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 报名管理对话框 -->
    <el-dialog v-model="ptVisible" :title="'报名管理 - ' + (ptChallenge?.title || '')" width="660px">
      <div class="pt-total">
        报名{{ ptData.type === 'personal' ? '人数' : '队伍' }}：<b>{{ ptData.total }}</b>
      </div>
      <el-table :data="ptData.participants" v-loading="ptLoading" max-height="440">
        <el-table-column prop="name" label="姓名 / 队伍" min-width="120" />
        <el-table-column v-if="ptData.type === 'personal'" prop="studentNo" label="学号" width="110" />
        <el-table-column v-if="ptData.type === 'personal'" prop="className" label="班级" min-width="120" />
        <el-table-column v-else label="人数" width="70" align="center">
          <template #default="{ row }">{{ row.memberCount }}</template>
        </el-table-column>
        <el-table-column v-if="ptData.type !== 'personal'" label="成员" min-width="180">
          <template #default="{ row }">
            <span class="members">{{ (row.members || []).join('、') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '可参加' : '已禁止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :type="row.status === 'active' ? 'danger' : 'success'" @click="togglePt(row)">
              {{ row.status === 'active' ? '禁止参加' : '允许参加' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listAdminChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  listChallengeParticipants,
  toggleChallengeParticipant,
} from '../api';

const typeMap = {
  personal: { label: '个人', tag: 'primary' },
  class: { label: '班级', tag: 'success' },
  dormitory: { label: '宿舍', tag: 'warning' },
};
const statusMap = {
  draft: { label: '草稿', tag: 'info' },
  ongoing: { label: '进行中', tag: 'success' },
  finished: { label: '已结束', tag: 'info' },
};

const list = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const editing = ref(null);
const form = reactive({ title: '', type: 'personal', description: '', startTime: '', endTime: '', status: 'draft' });

// 报名管理状态
const ptVisible = ref(false);
const ptLoading = ref(false);
const ptChallenge = ref(null);
const ptData = reactive({ type: 'personal', total: 0, participants: [] });

function fmt(v) {
  return v ? String(v).replace('T', ' ').slice(0, 16) : '—';
}

async function load() {
  loading.value = true;
  try {
    list.value = await listAdminChallenges();
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  Object.assign(form, { title: '', type: 'personal', description: '', startTime: '', endTime: '', status: 'draft' });
}

function openCreate() {
  editing.value = null;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row) {
  editing.value = row;
  Object.assign(form, {
    title: row.title,
    type: row.type,
    description: row.description || '',
    startTime: row.startTime ? String(row.startTime).replace('T', ' ').slice(0, 19) : '',
    endTime: row.endTime ? String(row.endTime).replace('T', ' ').slice(0, 19) : '',
    status: row.status,
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.title.trim()) return ElMessage.warning('请输入挑战名称');
  saving.value = true;
  try {
    if (editing.value) await updateChallenge(editing.value.id, { ...form });
    else await createChallenge({ ...form });
    ElMessage.success(editing.value ? '已更新' : '创建成功');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

function remove(row) {
  ElMessageBox.confirm(`确定删除「${row.title}」吗？`, '删除挑战', { type: 'warning' })
    .then(async () => {
      await deleteChallenge(row.id);
      ElMessage.success('已删除');
      load();
    })
    .catch(() => {});
}

async function openParticipants(row) {
  ptChallenge.value = row;
  ptVisible.value = true;
  await loadParticipants();
}

async function loadParticipants() {
  ptLoading.value = true;
  try {
    const data = await listChallengeParticipants(ptChallenge.value.id);
    ptData.type = data.type;
    ptData.total = data.total;
    ptData.participants = data.participants || [];
  } finally {
    ptLoading.value = false;
  }
}

async function togglePt(row) {
  await toggleChallengeParticipant(ptChallenge.value.id, row.id);
  ElMessage.success(row.status === 'active' ? '已禁止参加' : '已允许参加');
  loadParticipants();
}

onMounted(load);
</script>

<style scoped>
.page-title {
  margin: 0 0 4px;
}

.page-sub {
  color: #999;
  font-size: 13px;
  margin: 0 0 8px;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.pt-total {
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
}

.pt-total b {
  color: #409eff;
  font-size: 18px;
  margin: 0 2px;
}

.members {
  color: #666;
  font-size: 12px;
  line-height: 1.6;
}
</style>
