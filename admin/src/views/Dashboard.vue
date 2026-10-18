<template>
  <div>
    <!-- 核心指标 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="4" v-for="s in stats" :key="s.label">
        <div class="stat-card">
          <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 趋势 + Top 榜 -->
    <el-row :gutter="16">
      <el-col :span="16">
        <div class="chart-card">
          <h3 class="chart-title">近 7 日打卡趋势</h3>
          <div ref="trendRef" class="chart"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <h3 class="chart-title">积分 TOP 榜</h3>
          <el-table :data="topUsers" size="small" height="320">
            <el-table-column type="index" label="排名" width="70" align="center" />
            <el-table-column prop="nickname" label="昵称" />
            <el-table-column prop="totalPoints" label="积分" width="80" align="center">
              <template #default="{ row }">
                <span class="points">{{ row.totalPoints }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <!-- 班级 + 宿舍楼统计 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">各班级统计（人数 / 总积分）</h3>
          <div ref="classRef" class="chart"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <h3 class="chart-title">各宿舍楼统计</h3>
          <div ref="dormRef" class="chart"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';
import { getDashboard } from '../api';

const trendRef = ref(null);
const classRef = ref(null);
const dormRef = ref(null);
let trendChart = null;
let classChart = null;
let dormChart = null;

const stats = ref([]);
const topUsers = ref([]);

async function load() {
  const data = await getDashboard();
  stats.value = [
    { label: '参与人数', value: data.totalStudents, color: '#409eff' },
    { label: '今日打卡', value: data.todayCheckins, color: '#43a047' },
    { label: '累计打卡', value: data.totalCheckins, color: '#fb8c00' },
    { label: '光盘通过率', value: (Number(data.approveRate) * 100).toFixed(1) + '%', color: '#e53935' },
    { label: '发放积分', value: data.totalPointsAwarded, color: '#8e24aa' },
    { label: '减少浪费(kg)', value: data.wasteSaved, color: '#00897b' },
  ];
  topUsers.value = data.topUsers;
  renderTrend(data.trend);
  renderClass(data.classStats);
  renderDorm(data.dormStats);
}

function renderTrend(trend) {
  trendChart = echarts.init(trendRef.value);
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['打卡总数', '通过数'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: trend.map((t) => t.date.slice(5)) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '打卡总数',
        type: 'line',
        smooth: true,
        data: trend.map((t) => Number(t.total)),
        itemStyle: { color: '#409eff' },
        areaStyle: { opacity: 0.15 },
      },
      {
        name: '通过数',
        type: 'line',
        smooth: true,
        data: trend.map((t) => Number(t.approved)),
        itemStyle: { color: '#43a047' },
      },
    ],
  });
}

function renderClass(classStats) {
  classChart = echarts.init(classRef.value);
  classChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['人数', '总积分'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: classStats.map((c) => c.name) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '人数',
        type: 'bar',
        data: classStats.map((c) => Number(c.students)),
        barWidth: 20,
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '总积分',
        type: 'bar',
        data: classStats.map((c) => Number(c.totalPoints)),
        barWidth: 20,
        itemStyle: { color: '#43a047', borderRadius: [4, 4, 0, 0] },
      },
    ],
  });
}

function renderDorm(dormStats) {
  dormChart = echarts.init(dormRef.value);
  dormChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dormStats.map((d) => d.name + '楼') },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        type: 'bar',
        data: dormStats.map((d) => Number(d.students)),
        barWidth: 40,
        itemStyle: { color: '#fb8c00', borderRadius: [6, 6, 0, 0] },
      },
    ],
  });
}

function resize() {
  trendChart?.resize();
  classChart?.resize();
  dormChart?.resize();
}

onMounted(() => {
  load();
  window.addEventListener('resize', resize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  trendChart?.dispose();
  classChart?.dispose();
  dormChart?.dispose();
});
</script>

<style scoped>
.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  color: #999;
  font-size: 13px;
  margin-top: 6px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.chart-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}

.chart {
  width: 100%;
  height: 320px;
}

.points {
  color: #fb8c00;
  font-weight: 700;
}
</style>
