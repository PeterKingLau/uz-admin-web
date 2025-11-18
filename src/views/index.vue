<template>
    <div class="audit-dashboard">
        <!-- 顶部统计卡片 -->
        <el-row :gutter="16" class="top-cards">
            <el-col :span="6" v-for="card in statCards" :key="card.key">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-card__header">
                        <div class="stat-card__icon" :class="`icon-${card.key}`">
                            <Icon :icon="card.icon" width="24" height="24" />
                        </div>
                        <div class="stat-card__title">{{ card.title }}</div>
                    </div>
                    <div class="stat-card__value">
                        <span class="number">{{ stats[card.key] }}</span>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 图表区：左边折线图 + 右边饼图 -->
        <el-row :gutter="16" class="charts-row">
            <el-col :span="16">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">近 7 天审核趋势</div>
                    </template>
                    <div ref="trendChartRef" class="chart-container"></div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">审核状态占比</div>
                    </template>
                    <div ref="statusPieRef" class="chart-container"></div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 近 7 天审核趋势（表格版，辅助） -->
        <el-card shadow="hover">
            <template #header>
                <div class="card-header">近 7 天趋势（数据明细）</div>
            </template>

            <el-table :data="trend" size="small" border>
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="total" label="审核总数" width="120" />
                <el-table-column prop="approved" label="通过" width="120" />
                <el-table-column prop="rejected" label="未通过" width="120" />
                <el-table-column label="通过率">
                    <template #default="{ row }">
                        <el-progress :percentage="row.approvedRate" :stroke-width="14" :text-inside="true" />
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 最新审核记录 -->
        <el-card shadow="hover">
            <template #header>
                <div class="card-header">最新审核记录</div>
            </template>

            <el-table :data="latest" border size="small">
                <el-table-column prop="title" label="内容标题" min-width="160" />
                <el-table-column prop="auditStatus" label="审核状态" width="120" />
                <el-table-column prop="auditTime" label="审核时间" width="180" />
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { Icon } from '@iconify/vue'
import * as echarts from 'echarts'
import { listContentAudit } from '@/api/audit/content'
import { listUserAuditDetail } from '@/api/audit/person'

const contentList = ref([])
const userAuditList = ref([])

const stats = ref({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
})

const statCards = [
    { key: 'totalCount', title: '累计审核数', icon: 'ep:document' },
    { key: 'pendingCount', title: '待审核', icon: 'ep:timer' },
    { key: 'approvedCount', title: '已通过', icon: 'ep:circle-check' },
    { key: 'rejectedCount', title: '未通过', icon: 'ep:circle-close' }
]

// ----------------------
// 近 7 天趋势
// ----------------------
const trend = ref([])

// ----------------------
// 最新审核记录
// ----------------------
const latest = ref([])

// ----------------------
// ECharts 相关
// ----------------------
const trendChartRef = ref(null)
const statusPieRef = ref(null)
let trendChart = null
let statusChart = null

function initCharts() {
    if (trendChartRef.value && !trendChart) {
        trendChart = echarts.init(trendChartRef.value)
    }
    if (statusPieRef.value && !statusChart) {
        statusChart = echarts.init(statusPieRef.value)
    }
    renderTrendChart()
    renderStatusPie()
}

function renderTrendChart() {
    if (!trendChart || !trend.value.length) return

    const dates = trend.value.map(x => x.date)
    const totals = trend.value.map(x => x.total)
    const approved = trend.value.map(x => x.approved)
    const rejected = trend.value.map(x => x.rejected)

    trendChart.setOption({
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['审核总数', '通过', '未通过']
        },
        grid: {
            left: 40,
            right: 20,
            top: 40,
            bottom: 30
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisTick: { alignWithLabel: true }
        },
        yAxis: {
            type: 'value',
            minInterval: 1
        },
        series: [
            {
                name: '审核总数',
                type: 'line',
                smooth: true,
                data: totals
            },
            {
                name: '通过',
                type: 'line',
                smooth: true,
                data: approved
            },
            {
                name: '未通过',
                type: 'line',
                smooth: true,
                data: rejected
            }
        ]
    })
}

function renderStatusPie() {
    if (!statusChart) return

    const { approvedCount, rejectedCount, pendingCount } = stats.value
    const total = approvedCount + rejectedCount + pendingCount
    if (!total) {
        statusChart.clear()
        return
    }

    statusChart.setOption({
        tooltip: {
            trigger: 'item'
        },
        legend: {
            orient: 'vertical',
            left: 'left'
        },
        series: [
            {
                name: '审核状态',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    formatter: '{b}: {c} ({d}%)'
                },
                data: [
                    { name: '待审核', value: pendingCount },
                    { name: '已通过', value: approvedCount },
                    { name: '未通过', value: rejectedCount }
                ]
            }
        ]
    })
}

const handleResize = () => {
    trendChart && trendChart.resize()
    statusChart && statusChart.resize()
}

// ----------------------
// 加载数据
// ----------------------
async function loadData() {
    const [contentRes, userRes] = await Promise.all([listContentAudit({ pageNum: 1, pageSize: 9999 }), listUserAuditDetail({ pageNum: 1, pageSize: 9999 })])

    const contentData = contentRes.rows || contentRes.data || []
    const userData = userRes.rows || userRes.data || []

    // 合并：内容审核 + 个人资料审核
    const merged = [...contentData, ...userData]

    contentList.value = merged

    calcStats(merged)
    calcTrend(merged)
    calcLatest(merged)

    // 数据准备好后再初始化 / 更新图表
    await nextTick()
    initCharts()
}

// ----------------------
// 顶部统计
// ----------------------
function calcStats(list) {
    stats.value.totalCount = list.length
    stats.value.pendingCount = list.filter(x => x.auditStatus == 0).length
    stats.value.approvedCount = list.filter(x => x.auditStatus == 1).length
    stats.value.rejectedCount = list.filter(x => x.auditStatus == 2).length
}

// ----------------------
// 近 7 天趋势统计
// ----------------------
function calcTrend(list) {
    const map = {}

    for (let i = 0; i < 7; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
        map[d] = { date: d, total: 0, approved: 0, rejected: 0 }
    }

    list.forEach(item => {
        const day = (item.auditTime || '').slice(0, 10)
        if (!map[day]) return
        map[day].total++
        if (item.auditStatus == 1) map[day].approved++
        if (item.auditStatus == 2) map[day].rejected++
    })

    trend.value = Object.values(map)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(x => ({
            ...x,
            approvedRate: x.total ? Math.round((x.approved / x.total) * 100) : 0
        }))
}

// ----------------------
// 最新审核
// ----------------------
function calcLatest(list) {
    latest.value = [...list]
        .sort((a, b) => new Date(b.auditTime) - new Date(a.auditTime))
        .slice(0, 10)
        .map(x => ({
            title: x.title || x.postTitle || '(无标题)',
            auditStatus: x.auditStatus == 1 ? '已通过' : x.auditStatus == 2 ? '未通过' : '待审核',
            auditTime: x.auditTime || '-'
        }))
}

// stats / trend 变化时，自动刷新图表（避免手动调用）
watch(
    () => trend.value,
    () => {
        nextTick(() => renderTrendChart())
    },
    { deep: true }
)

watch(
    () => stats.value,
    () => {
        nextTick(() => renderStatusPie())
    },
    { deep: true }
)

onMounted(() => {
    loadData()
    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    trendChart && trendChart.dispose()
    statusChart && statusChart.dispose()
})
</script>

<style lang="scss" scoped>
.audit-dashboard {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .top-cards {
        margin-bottom: 8px;

        :deep(.el-card) {
            border-radius: 10px;
            overflow: hidden;
            transition:
                transform 0.18s ease,
                box-shadow 0.18s ease;
        }

        :deep(.el-card__body) {
            padding: 14px 16px;
        }

        :deep(.el-card:hover) {
            transform: translateY(-2px);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        }
    }

    .stat-card {
        cursor: pointer;

        .stat-card__header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-bottom: 10px;
        }

        .stat-card__icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            margin-right: 10px;
            flex-shrink: 0;
        }

        .stat-card__title {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            letter-spacing: 1px;
        }

        .stat-card__value {
            margin-left: 44px; // 和图标对齐一点
            font-size: 24px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            line-height: 1;
        }
    }
}

/* 图标色块 */
.icon-totalCount {
    background: #409eff;
}
.icon-pendingCount {
    background: #e6a23c;
}
.icon-approvedCount {
    background: #67c23a;
}
.icon-rejectedCount {
    background: #f56c6c;
}

/* 下面原来的样式保持即可 */
.charts-row {
    margin-bottom: 8px;
}
.chart-container {
    width: 100%;
    height: 260px;
}
</style>
