<template>
  <el-card>
    <div class="head">
      <div>
        <h3 class="page-title">食谱推荐管理</h3>
        <p class="page-sub">维护小份菜 / 半份菜搭配方案，学生端可浏览推荐</p>
      </div>
      <el-button type="primary" @click="openCreate">➕ 新增方案</el-button>
    </div>

    <el-table :data="list" v-loading="loading">
      <el-table-column prop="title" label="方案名称" min-width="150" />
      <el-table-column label="搭配菜品" min-width="220">
        <template #default="{ row }">
          <el-tag v-for="(d, i) in row.dishes" :key="i" size="small" class="dish-tag">{{ d }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="省积分" width="90" align="center">
        <template #default="{ row }"><span class="points">{{ row.pointsSaved }}</span></template>
      </el-table-column>
      <el-table-column prop="tags" label="标签" min-width="120" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑方案' : '新增方案'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="方案名称"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="搭配菜品">
          <el-input
            v-model="form.dishesText"
            type="textarea"
            :rows="2"
            placeholder="用逗号分隔，如：半份宫保鸡丁,小份米饭"
          />
        </el-form-item>
        <el-form-item label="方案说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="省积分">
          <el-input-number v-model="form.pointsSaved" :min="0" :max="999" :step="1" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="如：轻食,实惠" />
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
import { listAdminRecipes, createRecipe, updateRecipe, deleteRecipe } from '../api';

const list = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const editing = ref(null);
const form = reactive({ title: '', dishesText: '', description: '', pointsSaved: 0, tags: '' });

async function load() {
  loading.value = true;
  try {
    list.value = await listAdminRecipes();
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  Object.assign(form, { title: '', dishesText: '', description: '', pointsSaved: 0, tags: '' });
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
    dishesText: (row.dishes || []).join(','),
    description: row.description || '',
    pointsSaved: Number(row.pointsSaved) || 0,
    tags: row.tags || '',
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.title.trim()) return ElMessage.warning('请输入方案名称');
  if (!form.dishesText.trim()) return ElMessage.warning('请填写搭配菜品');
  saving.value = true;
  try {
    const data = {
      title: form.title,
      description: form.description,
      dishes: form.dishesText.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
      pointsSaved: form.pointsSaved,
      tags: form.tags,
    };
    if (editing.value) await updateRecipe(editing.value.id, data);
    else await createRecipe(data);
    ElMessage.success(editing.value ? '已更新' : '新增成功');
    dialogVisible.value = false;
    load();
  } finally {
    saving.value = false;
  }
}

function remove(row) {
  ElMessageBox.confirm(`确定删除「${row.title}」吗？`, '删除方案', { type: 'warning' })
    .then(async () => {
      await deleteRecipe(row.id);
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

.dish-tag {
  margin: 2px 4px 2px 0;
}
</style>
