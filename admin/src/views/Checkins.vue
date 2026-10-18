<template>
  <el-card>
    <el-tabs v-model="status" @tab-change="() => load(1)">
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="已通过" name="approved" />
      <el-tab-pane label="已驳回" name="rejected" />
    </el-tabs>

    <el-table :data="list" v-loading="loading" size="default">
      <el-table-column label="餐盘照片" width="100">
        <template #default="{ row }">
          <el-image
            :src="row.imageUrl"
            :preview-src-list="[row.imageUrl]"
            fit="cover"
            preview-teleported
            style="width: 70px; height: 70px; border-radius: 6px"
          />
        </template>
      </el-table-column>

      <el-table-column label="关联菜品" width="110">
        <template #default="{ row }">
          <template v-if="row.menu">
            <el-image
              :src="row.menu.image"
              :preview-src-list="[row.menu.image]"
              fit="cover"
              preview-teleported
              style="width: 60px; height: 60px; border-radius: 6px"
            />
            <div class="sub">{{ row.menu.dishName }}</div>
          </template>
          <span v-else class="sub">未选择</span>
        </template>
      </el-table-column>

      <el-table-column label="用户" width="130">
        <template #default="{ row }">
          <div>{{ row.user?.nickname || '-' }}</div>
          <div class="sub">{{ row.user?.className || '' }}</div>
        </template>
      </el-table-column>

      <el-table-column label="AI 预判" width="130">
        <template #default="{ row }">
          <span v-if="row.aiLabel" class="ai-tag" :class="row.aiLabel === 'empty' ? 'ai-empty' : 'ai-not'">
            {{ row.aiLabel === 'empty' ? '疑似光盘' : '疑似未光盘' }}
          </span>
          <span v-else class="sub">未启用</span>
          <div class="sub" v-if="row.aiScore != null">
            置信度 {{ (Number(row.aiScore) * 100).toFixed(0) }}%
          </div>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="checkinDate" label="打卡日期" width="115" />
      <el-table-column label="发放积分" width="90" align="center">
        <template #default="{ row }">{{ row.pointsAwarded || '-' }}</template>
      </el-table-column>

      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" size="small" @click="approve(row)">通过</el-button>
            <el-button type="danger" size="small" @click="reject(row)">驳回</el-button>
          </template>
          <span v-else-if="row.status === 'rejected'" class="sub">原因：{{ row.rejectReason }}</span>
          <span v-else class="sub">已通过</span>
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
import { listCheckins, reviewCheckin } from '../api';

const status = ref('pending');
const list = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);

async function load(p = page.value) {
  page.value = p;
  loading.value = true;
  try {
    const data = await listCheckins({ status: status.value, page: p, pageSize: pageSize.value });
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function approve(row) {
  await reviewCheckin(row.id, { action: 'approve' });
  ElMessage.success('已通过，积分已发放');
  load();
}

function reject(row) {
  ElMessageBox.prompt('请输入驳回原因', '驳回打卡', {
    inputValue: '餐盘未光盘，请继续努力',
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消',
  })
    .then(async ({ value }) => {
      await reviewCheckin(row.id, { action: 'reject', reason: value });
      ElMessage.success('已驳回');
      load();
    })
    .catch(() => {});
}

function statusType(s) {
  return { pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'info';
}

function statusText(s) {
  return { pending: '待审核', approved: '已通过', rejected: '已驳回' }[s] || s;
}

onMounted(() => load());
</script>

<style scoped>
.sub {
  color: #999;
  font-size: 12px;
}

.ai-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.ai-empty {
  background: #e8f5e9;
  color: #43a047;
}

.ai-not {
  background: #ffebee;
  color: #e53935;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
