<template>
  <el-card>
    <el-tabs v-model="status" @tab-change="() => load(1)">
      <el-tab-pane label="待发放" name="pending" />
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="已发放" name="fulfilled" />
      <el-tab-pane label="已取消" name="cancelled" />
    </el-tabs>

    <el-table :data="list" v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" width="200" />
      <el-table-column label="用户" width="130">
        <template #default="{ row }">
          <div>{{ row.user?.nickname || '-' }}</div>
          <div class="sub">{{ row.user?.studentNo || '' }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="productName" label="商品" width="160" />
      <el-table-column prop="pointsCost" label="消耗积分" width="100" align="center" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="券码" width="140">
        <template #default="{ row }">
          <span v-if="row.voucherCode" class="voucher">{{ row.voucherCode }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="下单时间" min-width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" size="small" @click="fulfill(row)">发放</el-button>
            <el-button type="danger" size="small" @click="cancel(row)">取消</el-button>
          </template>
          <span v-else class="sub">已处理</span>
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
import { listOrders, handleOrder } from '../api';

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
    const data = await listOrders({ status: status.value, page: p, pageSize: pageSize.value });
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function fulfill(row) {
  const data = await handleOrder(row.id, { action: 'fulfill' });
  ElMessage.success(`已发放，券码：${data.voucherCode}`);
  load();
}

function cancel(row) {
  ElMessageBox.confirm('取消后积分将原路退还给用户，确定？', '取消订单', { type: 'warning' })
    .then(async () => {
      await handleOrder(row.id, { action: 'cancel' });
      ElMessage.success('已取消并退还积分');
      load();
    })
    .catch(() => {});
}

function statusType(s) {
  return { pending: 'warning', fulfilled: 'success', cancelled: 'info' }[s] || 'info';
}

function statusText(s) {
  return { pending: '待发放', fulfilled: '已发放', cancelled: '已取消' }[s] || s;
}

function formatTime(t) {
  return t ? String(t).replace('T', ' ').slice(0, 19) : '-';
}

onMounted(() => load());
</script>

<style scoped>
.sub {
  color: #999;
  font-size: 12px;
}

.voucher {
  color: #43a047;
  font-weight: 600;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
