<template>
  <el-card>
    <div class="head">
      <div>
        <h3 class="page-title">菜单管理</h3>
        <p class="page-sub">维护每日固定菜单（早/午/晚），上新、下架实时生效到学生端</p>
      </div>
      <el-button type="primary" @click="openCreate">➕ 上新菜品</el-button>
    </div>

    <el-tabs v-model="activeType" @tab-change="load">
      <el-tab-pane label="早餐" name="breakfast" />
      <el-tab-pane label="午餐" name="lunch" />
      <el-tab-pane label="晚餐" name="dinner" />
    </el-tabs>

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

      <el-table-column prop="dishName" label="菜名" min-width="130" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column label="价格" width="90">
        <template #default="{ row }">￥{{ Number(row.price).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="小份" width="80" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isSmall" type="warning" size="small">小份</el-tag>
          <span v-else class="sub">—</span>
        </template>
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

    <!-- 上新 / 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑菜品' : '上新菜品'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="菜名">
          <el-input v-model="form.dishName" placeholder="请输入菜名" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="form.category"
            allow-create
            filterable
            default-first-option
            placeholder="选择或输入分类"
            style="width: 100%"
          >
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :max="999" :step="1" :precision="2" />
        </el-form-item>
        <el-form-item label="小份">
          <el-switch v-model="form.isSmall" :active-value="1" :inactive-value="0" />
          <span class="tip">开启表示提供小份 / 半份</span>
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
import { listAdminMenus, createMenu, updateMenu, toggleMenu, deleteMenu } from '../api';

const activeType = ref('lunch');
const list = ref([]);
const loading = ref(false);

const categories = ['荤菜', '素菜', '主食', '汤', '饮品', '早餐', '其他'];

const dialogVisible = ref(false);
const saving = ref(false);
const editing = ref(null);
const file = ref(null);
const fileList = ref([]);
const form = reactive({ dishName: '', category: '素菜', price: 0, isSmall: 0, image: '' });

async function load() {
  loading.value = true;
  try {
    list.value = await listAdminMenus({ mealType: activeType.value });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  Object.assign(form, { dishName: '', category: '素菜', price: 0, isSmall: 0, image: '' });
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
    dishName: row.dishName,
    category: row.category || '素菜',
    price: Number(row.price),
    isSmall: row.isSmall,
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
  if (!form.dishName.trim()) return ElMessage.warning('请输入菜名');
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append('mealType', activeType.value);
    fd.append('dishName', form.dishName);
    fd.append('category', form.category || '其他');
    fd.append('price', form.price);
    fd.append('isSmall', form.isSmall);
    if (file.value) fd.append('image', file.value);

    if (editing.value) await updateMenu(editing.value.id, fd);
    else await createMenu(fd);

    ElMessage.success(editing.value ? '已更新' : '上新成功');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

async function toggle(row) {
  await toggleMenu(row.id);
  ElMessage.success(row.status === 1 ? '已下架' : '已上架');
  load();
}

function remove(row) {
  ElMessageBox.confirm(`确定删除「${row.dishName}」吗？删除后不可恢复`, '删除菜品', { type: 'warning' })
    .then(async () => {
      await deleteMenu(row.id);
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
