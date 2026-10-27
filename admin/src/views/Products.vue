<template>
  <el-card>
    <div class="head">
      <div>
        <h3 class="page-title">商城商品管理</h3>
        <p class="page-sub">维护可兑换的代金券与公益捐赠项目，积分价格实时生效到学生端</p>
      </div>
      <el-button type="primary" @click="openCreate">➕ 新增商品</el-button>
    </div>

    <el-table :data="list" v-loading="loading">
      <el-table-column label="图片" width="90">
        <template #default="{ row }">
          <el-image
            v-if="row.image"
            :src="row.image"
            :preview-src-list="[row.image]"
            fit="cover"
            preview-teleported
            style="width: 60px; height: 60px; border-radius: 6px"
          />
          <div v-else class="img-empty">无图</div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="150" />
      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.type === 'voucher' ? 'success' : 'warning'" size="small">
            {{ row.type === 'voucher' ? '代金券' : '公益捐赠' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="积分" width="90" align="center">
        <template #default="{ row }"><span class="points">{{ row.pointsCost }}</span></template>
      </el-table-column>
      <el-table-column label="库存" width="90" align="center">
        <template #default="{ row }">{{ row.stock === -1 ? '不限' : row.stock }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="210" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row)">
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑商品' : '新增商品'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="代金券" value="voucher" />
            <el-option label="公益捐赠" value="donation" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分价格">
          <el-input-number v-model="form.pointsCost" :min="0" :max="99999" :step="10" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="-1" :max="99999" :step="1" />
          <span class="tip">-1 表示不限量</span>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            list-type="picture-card"
            :file-list="fileList"
            :on-change="onFileChange"
            :on-remove="onFileRemove"
          >
            <div class="upload-plus">+</div>
          </el-upload>
          <div v-if="form.image && !file" class="sub">不选图则保留原图</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listAdminProducts, createProduct, updateProduct, toggleProduct, deleteProduct } from '../api';

const list = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const editing = ref(null);
const file = ref(null);
const fileList = ref([]);
const form = reactive({ name: '', type: 'voucher', pointsCost: 50, stock: -1, description: '', image: '' });

async function load() {
  loading.value = true;
  try {
    list.value = await listAdminProducts();
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  Object.assign(form, { name: '', type: 'voucher', pointsCost: 50, stock: -1, description: '', image: '' });
  file.value = null;
  fileList.value = [];
}

function openCreate() {
  editing.value = null;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row) {
  editing.value = row;
  Object.assign(form, {
    name: row.name,
    type: row.type,
    pointsCost: Number(row.pointsCost),
    stock: Number(row.stock),
    description: row.description || '',
    image: row.image || '',
  });
  file.value = null;
  fileList.value = [];
  dialogVisible.value = true;
}

function onFileChange(uploadFile) {
  file.value = uploadFile.raw;
}

function onFileRemove() {
  file.value = null;
}

async function submit() {
  if (!form.name.trim()) return ElMessage.warning('请输入商品名称');
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('type', form.type);
    fd.append('pointsCost', form.pointsCost);
    fd.append('stock', form.stock);
    fd.append('description', form.description || '');
    if (file.value) fd.append('image', file.value);

    if (editing.value) await updateProduct(editing.value.id, fd);
    else await createProduct(fd);

    ElMessage.success(editing.value ? '已更新' : '新增成功');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

async function toggle(row) {
  await toggleProduct(row.id);
  ElMessage.success(row.status === 1 ? '已下架' : '已上架');
  load();
}

function remove(row) {
  ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除商品', { type: 'warning' })
    .then(async () => {
      await deleteProduct(row.id);
      ElMessage.success('已删除');
      load();
    })
    .catch(() => {});
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

.points {
  color: #fb8c00;
  font-weight: 700;
}

.sub {
  color: #999;
  font-size: 12px;
}

.tip {
  color: #999;
  font-size: 12px;
  margin-left: 12px;
}

.img-empty {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background: #f0f0f0;
  color: #bbb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.upload-plus {
  font-size: 26px;
  color: #8c939d;
}
</style>
