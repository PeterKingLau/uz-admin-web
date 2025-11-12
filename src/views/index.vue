<template>
  <div class="app-container">
    <el-row :gutter="16">
      <el-col :xs="24" :md="16">
        <el-card shadow="never" class="card">
          <template #header>
            <div class="card-header">
              <span>销售额趋势</span>
              <div>
                <el-button size="small" @click="refreshAll"
                  >刷新假数据</el-button
                >
              </div>
            </div>
          </template>
          <div ref="lineRef" class="chart"></div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="card">
          <template #header> 各品类占比 </template>
          <div ref="pieRef" class="chart"></div>
        </el-card>
      </el-col>

      <el-col :xs="24">
        <el-card shadow="never" class="card">
          <template #header> 区域业绩 </template>
          <div ref="barRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useDark } from "@vueuse/core";
import * as echarts from "echarts";

// 深色模式：跟随站点/系统
const isDark = useDark();

// DOM 引用 & 实例
const lineRef = ref(null);
const pieRef = ref(null);
const barRef = ref(null);
let lineChart, pieChart, barChart;

// ---- 假数据生成 ----
const months = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];
function rand(n, m) {
  return Math.round(n + Math.random() * (m - n));
}

function generateFakeData() {
  // 折线：今年/去年
  const lastYear = months.map(() => rand(80, 220));
  const thisYear = lastYear.map((v) =>
    Math.max(60, Math.round(v * (0.9 + Math.random() * 0.4)))
  );
  // 饼图：品类占比
  const cats = ["电子", "家居", "服饰", "生鲜", "美妆", "运动"];
  const catData = cats.map((c) => ({ name: c, value: rand(50, 300) }));
  // 柱状：区域业绩
  const regions = ["华北", "华东", "华南", "西南", "西北", "东北"];
  const regionData = regions.map(() => rand(200, 900));

  return { lastYear, thisYear, catData, regions, regionData };
}

let data = generateFakeData();

// ---- 初始化与配置 ----
function initCharts() {
  const theme = isDark.value ? "dark" : undefined;

  // 初始化（如已存在则先销毁）
  disposeCharts();
  lineChart = echarts.init(lineRef.value, theme);
  pieChart = echarts.init(pieRef.value, theme);
  barChart = echarts.init(barRef.value, theme);

  // loading 效果（演示）
  [lineChart, pieChart, barChart].forEach((ch) =>
    ch.showLoading({ text: "加载中..." })
  );
  setTimeout(() => {
    setLineOption();
    setPieOption();
    setBarOption();
    [lineChart, pieChart, barChart].forEach((ch) => ch.hideLoading());
  }, 300);

  // 自适应
  window.addEventListener("resize", resizeAll);
}

function disposeCharts() {
  if (lineChart) {
    lineChart.dispose();
    lineChart = null;
  }
  if (pieChart) {
    pieChart.dispose();
    pieChart = null;
  }
  if (barChart) {
    barChart.dispose();
    barChart = null;
  }
}

function resizeAll() {
  lineChart && lineChart.resize();
  pieChart && pieChart.resize();
  barChart && barChart.resize();
}

function setLineOption() {
  lineChart.setOption({
    title: {
      text: "销售额（万元）",
      left: 10,
      top: 6,
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: "axis" },
    legend: { top: 6, right: 10 },
    grid: { left: 12, right: 12, bottom: 12, top: 48, containLabel: true },
    dataset: {
      source: [
        ["月份", ...months],
        ["去年", ...data.lastYear],
        ["今年", ...data.thisYear],
      ],
    },
    xAxis: { type: "category" },
    yAxis: { type: "value" },
    series: [
      { type: "line", smooth: true, seriesLayoutBy: "row" },
      { type: "line", smooth: true, seriesLayoutBy: "row" },
    ],
  });
}

function setPieOption() {
  pieChart.setOption({
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["30%", "65%"],
        center: ["50%", "48%"],
        avoidLabelOverlap: true,
        label: { formatter: "{b}\n{d}%" },
        data: data.catData,
      },
    ],
  });
}

function setBarOption() {
  barChart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 12, right: 12, bottom: 40, top: 24, containLabel: true },
    xAxis: { type: "category", data: data.regions },
    yAxis: { type: "value" },
    dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 8 }],
    series: [{ type: "bar", data: data.regionData, barWidth: 24 }],
  });
}

// ---- 交互：刷新假数据 ----
function refreshAll() {
  data = generateFakeData();
  setLineOption();
  setPieOption();
  setBarOption();
}

// ---- 生命周期 ----
onMounted(() => {
  initCharts();
});

// 跟随深色模式切换自动重建图表主题
watch(isDark, () => {
  initCharts();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeAll);
  disposeCharts();
});
</script>

<style scoped>
.app-container {
  padding: 16px;
}
.card {
  margin-bottom: 16px;
}
.chart {
  width: 100%;
  height: 360px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
@media (max-width: 768px) {
  .chart {
    height: 300px;
  }
}
</style>
