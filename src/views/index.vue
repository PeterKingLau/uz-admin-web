<template>
    <div class="audit-dashboard">
        <el-row :gutter="20" class="top-cards">
            <el-col :span="6" v-for="card in statCards" :key="card.key">
                <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0px' }">
                    <div class="stat-card-inner">
                        <div class="stat-content">
                            <div class="stat-title">{{ card.title }}</div>
                            <div class="stat-value">
                                <span class="number">{{ stats[card.key] }}</span>
                            </div>
                        </div>
                        <div class="stat-icon" :class="`icon-bg-${card.key}`">
                            <Icon :icon="card.icon" width="32" height="32" />
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="charts-row">
            <el-col :span="16">
                <el-card shadow="never" class="chart-card">
                    <template #header>
                        <div class="card-header">
                            <span class="header-title">近 7 天审核趋势</span>
                            <el-tag size="small" effect="plain">本周数据</el-tag>
                        </div>
                    </template>
                    <div ref="trendChartRef" class="chart-container"></div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card shadow="never" class="chart-card">
                    <template #header>
                        <div class="card-header">
                            <span class="header-title">审核状态占比</span>
                        </div>
                    </template>
                    <div ref="statusPieRef" class="chart-container"></div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="bottom-row">
            <el-col :span="14">
                <el-card shadow="never" class="table-card">
                    <template #header>
                        <div class="card-header">
                            <span class="header-title">趋势明细数据</span>
                        </div>
                    </template>
                    <el-table :data="trend" style="width: 100%" size="small" stripe>
                        <el-table-column prop="date" label="日期" min-width="100" />
                        <el-table-column prop="total" label="总数" width="80" align="center" />
                        <el-table-column prop="approved" label="通过" width="80" align="center">
                            <template #default="{ row }">
                                <span class="text-success">{{ row.approved }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="rejected" label="驳回" width="80" align="center">
                            <template #default="{ row }">
                                <span class="text-danger">{{ row.rejected }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="通过率" min-width="140">
                            <template #default="{ row }">
                                <el-progress :percentage="row.approvedRate" :stroke-width="8" :color="customColors" />
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>

            <el-col :span="10">
                <el-card shadow="never" class="table-card">
                    <template #header>
                        <div class="card-header">
                            <span class="header-title">最新审核动态</span>
                            <el-button link type="primary" size="small">更多</el-button>
                        </div>
                    </template>
                    <el-table :data="latest" style="width: 100%" size="small" :show-header="false">
                        <el-table-column min-width="200">
                            <template #default="{ row }">
                                <div class="latest-item">
                                    <div class="latest-title text-ellipsis">{{ row.title }}</div>
                                    <div class="latest-meta">{{ row.auditTime }}</div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column width="100" align="right">
                            <template #default="{ row }">
                                <el-tag size="small" :type="getStatusType(row.originStatus)" effect="light" round>
                                    {{ row.auditStatus }}
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { listContentAudit } from '@/api/audit/profile/content'
import { listUserAuditDetail } from '@/api/audit/person/person'
import { Icon } from '@iconify/vue'
import useSettingsStore from '@/store/modules/settings' // 引入设置Store以监听主题

const settingsStore = useSettingsStore()
const isDark = computed(() => settingsStore.isDark) // 假设您的 store 中有 isDark 状态

const contentList = ref([])

const stats = ref({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
})

const statCards = [
    { key: 'totalCount', title: '累计审核', icon: 'mdi:file-document-multiple-outline' },
    { key: 'pendingCount', title: '待处理', icon: 'mdi:clock-time-four-outline' },
    { key: 'approvedCount', title: '已通过', icon: 'mdi:check-circle-outline' },
    { key: 'rejectedCount', title: '已驳回', icon: 'mdi:close-circle-outline' }
]

const trend = ref([])
const latest = ref([])

const trendChartRef = ref(null)
const statusPieRef = ref(null)
let trendChart = null
let statusChart = null

const customColors = [
    { color: '#f56c6c', percentage: 20 },
    { color: '#e6a23c', percentage: 40 },
    { color: '#5cb87a', percentage: 60 },
    { color: '#1989fa', percentage: 80 },
    { color: '#6f7ad3', percentage: 100 }
]

function getStatusType(status) {
    if (status == 1) return 'success'
    if (status == 2) return 'danger'
    return 'warning'
}

// 监听主题变化，重绘图表
watch(isDark, () => {
    if (trendChart) {
        trendChart.dispose()
        trendChart = null
    }
    if (statusChart) {
        statusChart.dispose()
        statusChart = null
    }
    initCharts()
})

function initCharts() {
    // ECharts 支持 'dark' 主题，如果是暗黑模式则传入 'dark'
    const theme = isDark.value ? 'dark' : undefined
    const bgColor = isDark.value ? 'transparent' : undefined // 暗黑模式下图表背景透明，跟随卡片颜色

    if (trendChartRef.value && !trendChart) {
        trendChart = echarts.init(trendChartRef.value, theme)
    }
    if (statusPieRef.value && !statusChart) {
        statusChart = echarts.init(statusPieRef.value, theme)
    }
    renderTrendChart(bgColor)
    renderStatusPie(bgColor)
}

function renderTrendChart(bgColor) {
    if (!trendChart || !trend.value.length) return

    const dates = trend.value.map(x => x.date.slice(5))
    const totals = trend.value.map(x => x.total)
    const approved = trend.value.map(x => x.approved)
    const rejected = trend.value.map(x => x.rejected)

    // 根据主题定义文字颜色
    const textColor = isDark.value ? '#cfd3dc' : '#606266'
    const splitLineColor = isDark.value ? '#333' : '#ebeef5'

    trendChart.setOption({
        backgroundColor: bgColor,
        tooltip: {
            trigger: 'axis',
            // 暗黑模式下 Tooltip 的样式微调
            backgroundColor: isDark.value ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark.value ? '#333' : '#ccc',
            textStyle: { color: isDark.value ? '#fff' : '#333' }
        },
        legend: {
            data: ['总数', '通过', '驳回'],
            bottom: 0,
            icon: 'circle',
            textStyle: { color: textColor }
        },
        grid: {
            left: '3%',
            right: '4%',
            top: '10%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: textColor }
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: { type: 'dashed', color: splitLineColor }
            },
            axisLabel: { color: textColor }
        },
        series: [
            {
                name: '总数',
                type: 'bar',
                barWidth: 12,
                itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
                data: totals
            },
            {
                name: '通过',
                type: 'line',
                smooth: true,
                itemStyle: { color: '#67c23a' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
                        { offset: 1, color: 'rgba(103, 194, 58, 0.01)' }
                    ])
                },
                data: approved
            },
            {
                name: '驳回',
                type: 'line',
                smooth: true,
                itemStyle: { color: '#f56c6c' },
                data: rejected
            }
        ]
    })
}

function renderStatusPie(bgColor) {
    if (!statusChart) return

    const { approvedCount, rejectedCount, pendingCount } = stats.value
    const data = [
        { name: '通过', value: approvedCount, itemStyle: { color: '#67c23a' } },
        { name: '驳回', value: rejectedCount, itemStyle: { color: '#f56c6c' } },
        { name: '待审', value: pendingCount, itemStyle: { color: '#e6a23c' } }
    ]

    statusChart.setOption({
        backgroundColor: bgColor,
        tooltip: { trigger: 'item' },
        series: [
            {
                name: '状态分布',
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '50%'],
                itemStyle: {
                    borderRadius: 5,
                    borderColor: isDark.value ? '#1d1e1f' : '#fff', // 饼图间隙颜色跟随背景
                    borderWidth: 2
                },
                label: { show: false },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: isDark.value ? '#fff' : '#333'
                    }
                },
                data
            }
        ]
    })
}

const handleResize = () => {
    trendChart && trendChart.resize()
    statusChart && statusChart.resize()
}

async function loadData() {
    try {
        const [contentRes, userRes] = await Promise.all([listContentAudit({ pageNum: 1, pageSize: 9999 }), listUserAuditDetail({ pageNum: 1, pageSize: 9999 })])

        const contentData = contentRes.rows || contentRes.data || []
        const userData = userRes.rows || userRes.data || []
        const merged = [...contentData, ...userData]

        contentList.value = merged
        calcStats(merged)
        calcTrend(merged)
        calcLatest(merged)

        await nextTick()
        initCharts()
    } catch (e) {
        console.error('加载数据失败', e)
    }
}

function calcStats(list) {
    stats.value.totalCount = list.length
    stats.value.pendingCount = list.filter(x => x.auditStatus == 0).length
    stats.value.approvedCount = list.filter(x => x.auditStatus == 1).length
    stats.value.rejectedCount = list.filter(x => x.auditStatus == 2).length
}

function calcTrend(list) {
    const map = {}
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
        map[d] = { date: d, total: 0, approved: 0, rejected: 0 }
    }

    list.forEach(item => {
        const day = (item.auditTime || '').slice(0, 10)
        if (map[day]) {
            map[day].total++
            if (item.auditStatus == 1) map[day].approved++
            if (item.auditStatus == 2) map[day].rejected++
        }
    })

    trend.value = Object.values(map).map(x => ({
        ...x,
        approvedRate: x.total ? Math.round((x.approved / x.total) * 100) : 0
    }))
}

function calcLatest(list) {
    latest.value = [...list]
        .sort((a, b) => new Date(b.auditTime) - new Date(a.auditTime))
        .slice(0, 8)
        .map(x => ({
            title: x.title || x.postTitle || '(无标题)',
            originStatus: x.auditStatus,
            auditStatus: x.auditStatus == 1 ? '已通过' : x.auditStatus == 2 ? '已驳回' : '待审核',
            auditTime: x.auditTime ? x.auditTime.slice(5, 16) : '-'
        }))
}

watch(
    [() => trend.value, () => stats.value],
    () => {
        nextTick(() => {
            renderTrendChart()
            renderStatusPie()
        })
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
    padding: 10px;
    // 使用变量替代硬编码背景色
    background-color: var(--el-bg-color-page);
    min-height: 100vh;

    .top-cards {
        margin-bottom: 20px;

        .stat-card {
            border: none;
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s;
            // 使用变量替代卡片背景色
            background: var(--el-bg-color-overlay);

            &:hover {
                transform: translateY(-4px);
                box-shadow: var(--el-box-shadow-light); // 使用变量
            }

            .stat-card-inner {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 24px;
                position: relative;

                .stat-content {
                    z-index: 2;
                    .stat-title {
                        font-size: 14px;
                        // 使用变量替代文字颜色
                        color: var(--el-text-color-secondary);
                        margin-bottom: 8px;
                    }
                    .stat-value {
                        font-size: 28px;
                        font-weight: 700;
                        // 使用变量替代文字颜色
                        color: var(--el-text-color-primary);
                        font-family: 'DIN Alternate', sans-serif;
                    }
                }

                .stat-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;

                    // 这些背景色保持半透明，在暗黑模式下也比较协调
                    &.icon-bg-totalCount {
                        background: rgba(64, 158, 255, 0.1);
                        color: #409eff;
                    }
                    &.icon-bg-pendingCount {
                        background: rgba(230, 162, 60, 0.1);
                        color: #e6a23c;
                    }
                    &.icon-bg-approvedCount {
                        background: rgba(103, 194, 58, 0.1);
                        color: #67c23a;
                    }
                    &.icon-bg-rejectedCount {
                        background: rgba(245, 108, 108, 0.1);
                        color: #f56c6c;
                    }
                }
            }
        }
    }

    .chart-card,
    .table-card {
        border-radius: 12px;
        border: none;
        margin-bottom: 20px;
        background: var(--el-bg-color-overlay); // 使用变量

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .header-title {
                font-size: 16px;
                font-weight: 600;
                // 使用变量替代文字颜色
                color: var(--el-text-color-primary);
                position: relative;
                padding-left: 12px;

                &::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 4px;
                    height: 16px;
                    background: #409eff;
                    border-radius: 2px;
                }
            }
        }
    }

    .chart-container {
        height: 320px;
        width: 100%;
    }

    .text-success {
        color: #67c23a;
    }
    .text-danger {
        color: #f56c6c;
    }
    .text-ellipsis {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .latest-item {
        padding: 4px 0;

        .latest-title {
            font-size: 14px;
            color: var(--el-text-color-regular); // 使用变量
            margin-bottom: 4px;
        }
        .latest-meta {
            font-size: 12px;
            color: var(--el-text-color-secondary); // 使用变量
        }
    }
}
</style>
