<template>
  <el-card style="max-width: 680px">
    <h3 class="page-title">判定规则配置</h3>
    <p class="page-sub">调整餐盘判定阈值、积分规则，实时生效</p>

    <el-form label-width="170px">
      <el-form-item label="AI 预判开关">
        <el-switch v-model="form.ai_enabled" active-value="true" inactive-value="false" />
        <span class="tip">开启后学生打卡会先经过 AI 预判，结果供审核参考</span>
      </el-form-item>

      <el-form-item label="AI 光盘判定阈值">
        <el-input-number v-model="threshold" :min="0" :max="1" :step="0.05" :precision="2" />
        <span class="tip">置信度达到该值判为「疑似光盘」</span>
      </el-form-item>

      <el-form-item label="每次打卡奖励积分">
        <el-input-number v-model="pointsPerCheckin" :min="1" :max="1000" :step="1" />
      </el-form-item>

      <el-form-item label="每日打卡上限">
        <el-input-number v-model="dailyLimit" :min="1" :max="10" :step="1" />
        <span class="tip">同一学生每天最多可提交的打卡次数</span>
      </el-form-item>

      <el-form-item label="审核模式">
        <el-radio-group v-model="form.checkin_review_mode">
          <el-radio value="manual">纯人工审核</el-radio>
          <el-radio value="manual_with_ai">人工 + AI 预判</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="save" :loading="saving">保存配置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getRuleConfigs, updateRuleConfigs } from '../api';

const form = reactive({
  ai_enabled: 'true',
  checkin_review_mode: 'manual_with_ai',
});
const threshold = ref(0.6);
const pointsPerCheckin = ref(10);
const dailyLimit = ref(1);
const saving = ref(false);

async function load() {
  const configs = await getRuleConfigs();
  form.ai_enabled = configs.ai_enabled || 'true';
  form.checkin_review_mode = configs.checkin_review_mode || 'manual_with_ai';
  threshold.value = Number(configs.ai_threshold || '0.6');
  pointsPerCheckin.value = Number(configs.points_per_checkin || '10');
  dailyLimit.value = Number(configs.daily_checkin_limit || '1');
}

async function save() {
  saving.value = true;
  try {
    await updateRuleConfigs({
      ai_enabled: form.ai_enabled,
      ai_threshold: String(threshold.value),
      points_per_checkin: String(pointsPerCheckin.value),
      daily_checkin_limit: String(dailyLimit.value),
      checkin_review_mode: form.checkin_review_mode,
    });
    ElMessage.success('配置已保存并生效');
  } finally {
    saving.value = false;
  }
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
  margin: 0 0 24px;
}

.tip {
  color: #999;
  font-size: 12px;
  margin-left: 12px;
}
</style>
