<template>
    <div class="audit-dashboard" v-loading="loading">
        <el-alert :title="isAdmin ? '管理员视图：全局审核看板' : '用户视图：个人提审看板'" type="info" :closable="false" class="dashboard-alert" />
        <el-row :gutter="20" class="card-row">
            <el-col :span="6" v-for="card in statCards" :key="card.key">
                <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0px' }">
                    <div class="stat-card-inner">
                        <div class="stat-content">
                            <div class="stat-title">{{ card.title }}</div>
                            <div class="stat-value">
                                <span class="number">{{ formatCardValue(stats[card.key], card) }}</span>
                            </div>
                        </div>
                        <div class="stat-icon" :style="getCardIconStyle(card)">
                            <Icon :icon="card.icon" width="32" height="32" />
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="card-row">
            <el-col :span="6" v-for="card in extraCards" :key="card.key">
                <el-card shadow="hover" class="stat-card" :body-style="{ padding: '0px' }">
                    <div class="stat-card-inner">
                        <div class="stat-content">
                            <div class="stat-title">{{ card.title }}</div>
                            <div class="stat-value">
                                <span class="number">{{ formatCardValue(extraStats[card.key], card) }}</span>
                            </div>
                        </div>
                        <div class="stat-icon" :style="getCardIconStyle(card)">
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
                            <el-tag size="small" effect="plain">{{ isAdmin ? '全局数据' : '个人数据' }}</el-tag>
                        </div>
                    </template>
                    <div ref="trendChartRef" class="chart-container"></div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card shadow="never" class="chart-card">
                    <template #header>
                        <div class="card-header">
                            <span class="header-title">{{ isAdmin ? '审核状态占比' : '我的审核状态占比' }}</span>
                        </div>
                    </template>
                    <div ref="statusPieRef" class="chart-container"></div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="charts-row">
            <el-col :span="24">
                <el-card shadow="never" class="chart-card">
                    <template #header>
                        <div class="card-header">
                            <span class="header-title">{{ isAdmin ? '测评题型分布' : '提审来源分布' }}</span>
                        </div>
                    </template>
                    <div ref="assessmentPieRef" class="chart-container chart-container--compact"></div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="bottom-row">
            <el-col :span="14">
                <el-card shadow="never" class="table-card">
                    <template #header>
                        <div class="card-header">
                            <span class="header-title">{{ isAdmin ? '趋势明细数据' : '我的趋势明细' }}</span>
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
                            <span class="header-title">{{ isAdmin ? '最新审核动态' : '我的最新提审' }}</span>
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
import { listAssessmentQuestions, parseAssessmentQuestionRows } from '@/api/content/assessmentQuestion'
import useSettingsStore from '@/store/modules/settings'
import useUserStore from '@/store/modules/user'
import { AUDIT_STATUS } from '@/utils/enum'

const settingsStore = useSettingsStore()
const userStore = useUserStore()
const isDark = computed(() => settingsStore.isDark)
const isAdmin = computed(() => userStore.roles.includes('admin'))
const loading = ref(false)

const contentList = ref([])

const stats = ref({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
})

const adminStatCards = [
    {
        key: 'totalCount',
        title: '累计审核',
        icon: 'mdi:file-document-multiple-outline',
        color: '#409eff',
        bgColor: 'rgba(64, 158, 255, 0.1)'
    },
    {
        key: 'pendingCount',
        title: '待处理',
        icon: 'mdi:clock-time-four-outline',
        color: '#e6a23c',
        bgColor: 'rgba(230, 162, 60, 0.1)'
    },
    {
        key: 'approvedCount',
        title: '已通过',
        icon: 'mdi:check-circle-outline',
        color: '#67c23a',
        bgColor: 'rgba(103, 194, 58, 0.1)'
    },
    {
        key: 'rejectedCount',
        title: '已驳回',
        icon: 'mdi:close-circle-outline',
        color: '#f56c6c',
        bgColor: 'rgba(245, 108, 108, 0.1)'
    }
]

const extraStats = ref({
    contentTotal: 0,
    profileTotal: 0,
    passRate: 0,
    recentSubmitCount: 0,
    assessmentTotal: 0,
    abilityCount: 0,
    normalCount: 0
})

const userStatCards = [
    {
        key: 'totalCount',
        title: '我的提审',
        icon: 'mdi:file-document-outline',
        color: '#409eff',
        bgColor: 'rgba(64, 158, 255, 0.1)'
    },
    {
        key: 'pendingCount',
        title: '待审核',
        icon: 'mdi:clock-time-four-outline',
        color: '#e6a23c',
        bgColor: 'rgba(230, 162, 60, 0.1)'
    },
    {
        key: 'approvedCount',
        title: '已通过',
        icon: 'mdi:check-circle-outline',
        color: '#67c23a',
        bgColor: 'rgba(103, 194, 58, 0.1)'
    },
    {
        key: 'rejectedCount',
        title: '已驳回',
        icon: 'mdi:close-circle-outline',
        color: '#f56c6c',
        bgColor: 'rgba(245, 108, 108, 0.1)'
    }
]

const adminExtraCards = [
    { key: 'contentTotal', title: '内容总量', icon: 'mdi:file-document-outline', color: '#409eff', bgColor: 'rgba(64, 158, 255, 0.1)' },
    { key: 'assessmentTotal', title: '测评题量', icon: 'mdi:clipboard-text-outline', color: '#6f7ad3', bgColor: 'rgba(111, 122, 211, 0.12)' },
    { key: 'abilityCount', title: '能力题', icon: 'mdi:brain', color: '#409eff', bgColor: 'rgba(64, 158, 255, 0.12)' },
    { key: 'normalCount', title: '普通题', icon: 'mdi:format-list-bulleted', color: '#67c23a', bgColor: 'rgba(103, 194, 58, 0.12)' }
]

const userExtraCards = [
    { key: 'contentTotal', title: '内容提审', icon: 'mdi:file-document-outline', color: '#409eff', bgColor: 'rgba(64, 158, 255, 0.1)' },
    { key: 'profileTotal', title: '资料提审', icon: 'mdi:account-edit-outline', color: '#2f77ff', bgColor: 'rgba(47, 119, 255, 0.12)' },
    {
        key: 'passRate',
        title: '通过率',
        icon: 'mdi:percent-outline',
        color: '#00a870',
        bgColor: 'rgba(0, 168, 112, 0.1)',
        formatter: value => `${Number(value || 0)}%`
    },
    { key: 'recentSubmitCount', title: '近7天提审', icon: 'mdi:chart-line', color: '#6f7ad3', bgColor: 'rgba(111, 122, 211, 0.12)' }
]

const statCards = computed(() => (isAdmin.value ? adminStatCards : userStatCards))
const extraCards = computed(() => (isAdmin.value ? adminExtraCards : userExtraCards))

const trend = ref([])
const latest = ref([])

const trendChartRef = ref(null)
const statusPieRef = ref(null)
const assessmentPieRef = ref(null)
let trendChart = null
let statusChart = null
let assessmentChart = null

const customColors = [
    { color: '#f56c6c', percentage: 20 },
    { color: '#e6a23c', percentage: 40 },
    { color: '#5cb87a', percentage: 60 },
    { color: '#1989fa', percentage: 80 },
    { color: '#6f7ad3', percentage: 100 }
]

function getStatusType(status) {
    if (String(status) === String(AUDIT_STATUS.APPROVED)) return 'success'
    if (String(status) === String(AUDIT_STATUS.REJECTED)) return 'danger'
    return 'warning'
}

function formatCardValue(value, card) {
    if (card?.formatter) {
        return card.formatter(value)
    }
    const n = Number(value)
    return Number.isFinite(n) ? n.toLocaleString() : 0
}

function getCardIconStyle(card) {
    return {
        color: card?.color || '#409eff',
        background: card?.bgColor || 'rgba(64, 158, 255, 0.1)'
    }
}

function disposeCharts() {
    if (trendChart) {
        trendChart.dispose()
        trendChart = null
    }
    if (statusChart) {
        statusChart.dispose()
        statusChart = null
    }
    if (assessmentChart) {
        assessmentChart.dispose()
        assessmentChart = null
    }
}

watch(isDark, () => {
    disposeCharts()
    nextTick(() => initCharts())
})

watch(isAdmin, (nextRole, prevRole) => {
    if (nextRole === prevRole) return
    resetStats()
    disposeCharts()
    loadData()
})

watch(
    () => userStore.id,
    (nextId, prevId) => {
        if (nextId === prevId) return
        if (isAdmin.value) return
        resetStats()
        loadData()
    }
)

function initCharts() {
    const theme = isDark.value ? 'dark' : undefined
    const bgColor = isDark.value ? 'transparent' : undefined

    if (trendChartRef.value && !trendChart) {
        trendChart = echarts.init(trendChartRef.value, theme)
    }
    if (statusPieRef.value && !statusChart) {
        statusChart = echarts.init(statusPieRef.value, theme)
    }
    if (assessmentPieRef.value && !assessmentChart) {
        assessmentChart = echarts.init(assessmentPieRef.value, theme)
    }
    renderTrendChart(bgColor)
    renderStatusPie(bgColor)
    renderAssessmentPie(bgColor)
}

function renderTrendChart(bgColor) {
    if (!trendChart || !trend.value.length) return

    const dates = trend.value.map(x => x.date.slice(5))
    const totals = trend.value.map(x => x.total)
    const approved = trend.value.map(x => x.approved)
    const rejected = trend.value.map(x => x.rejected)

    const textColor = isDark.value ? '#cfd3dc' : '#606266'
    const splitLineColor = isDark.value ? '#333' : '#ebeef5'

    trendChart.setOption({
        backgroundColor: bgColor,
        tooltip: {
            trigger: 'axis',
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
                    borderColor: isDark.value ? '#1d1e1f' : '#fff',
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

function renderAssessmentPie(bgColor) {
    if (!assessmentChart) return

    const data = isAdmin.value
        ? [
              { name: '能力题', value: extraStats.value.abilityCount, itemStyle: { color: '#409eff' } },
              { name: '普通题', value: extraStats.value.normalCount, itemStyle: { color: '#67c23a' } }
          ]
        : [
              { name: '内容提审', value: extraStats.value.contentTotal, itemStyle: { color: '#409eff' } },
              { name: '资料提审', value: extraStats.value.profileTotal, itemStyle: { color: '#6f7ad3' } }
          ]

    assessmentChart.setOption({
        backgroundColor: bgColor,
        tooltip: { trigger: 'item' },
        legend: {
            bottom: 0,
            icon: 'circle',
            textStyle: { color: isDark.value ? '#cfd3dc' : '#606266' }
        },
        series: [
            {
                name: '题型分布',
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                itemStyle: {
                    borderRadius: 5,
                    borderColor: isDark.value ? '#1d1e1f' : '#fff',
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
    assessmentChart && assessmentChart.resize()
}

function getRows(payload) {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    if (Array.isArray(rows?.items)) return rows.items
    return []
}

function formatDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function resolveAuditTime(item) {
    return item?.auditTime || item?.applyTime || item?.updateTime || item?.createTime || ''
}

function belongsToCurrentUser(item) {
    const currentId = userStore.id != null ? String(userStore.id) : ''
    const currentNames = [userStore.name, userStore.nickName].filter(Boolean).map(x => String(x))
    const idCandidates = [item?.userId, item?.createBy, item?.ownerUserId, item?.targetUserId, item?.user?.id]
        .filter(x => x != null && x !== '')
        .map(x => String(x))
    if (currentId && idCandidates.includes(currentId)) return true

    const nameCandidates = [item?.userName, item?.nickName, item?.createByName, item?.applyUserName, item?.createBy].filter(Boolean).map(x => String(x))
    return currentNames.some(name => nameCandidates.includes(name))
}

function scopeByRole(list) {
    if (isAdmin.value) return list
    return list.filter(belongsToCurrentUser)
}

function resetStats() {
    stats.value = {
        totalCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0
    }
    extraStats.value = {
        contentTotal: 0,
        profileTotal: 0,
        passRate: 0,
        recentSubmitCount: 0,
        assessmentTotal: 0,
        abilityCount: 0,
        normalCount: 0
    }
    trend.value = []
    latest.value = []
}

async function loadData() {
    loading.value = true
    try {
        const [contentRes, userRes, assessmentRes] = await Promise.allSettled([
            listContentAudit({ pageNum: 1, pageSize: 9999 }),
            listUserAuditDetail({ pageNum: 1, pageSize: 9999 }),
            listAssessmentQuestions({ pageNum: 1, pageSize: 9999 })
        ])

        const contentData = contentRes.status === 'fulfilled' ? getRows(contentRes.value) : []
        const userData = userRes.status === 'fulfilled' ? getRows(userRes.value) : []
        const assessmentRows = assessmentRes.status === 'fulfilled' ? parseAssessmentQuestionRows(assessmentRes.value) || [] : []

        const scopedContent = scopeByRole(contentData)
        const scopedUser = scopeByRole(userData)
        const merged = [...scopedContent, ...scopedUser]

        contentList.value = merged
        calcStats(merged)
        if (isAdmin.value) {
            calcAdminExtraStats(scopedContent, assessmentRows)
        } else {
            calcUserExtraStats(scopedContent, scopedUser)
        }
        calcTrend(merged)
        calcLatest(merged)

        await nextTick()
        initCharts()
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

function calcStats(list) {
    stats.value.totalCount = list.length
    stats.value.pendingCount = list.filter(x => String(x.auditStatus) === String(AUDIT_STATUS.PENDING)).length
    stats.value.approvedCount = list.filter(x => String(x.auditStatus) === String(AUDIT_STATUS.APPROVED)).length
    stats.value.rejectedCount = list.filter(x => String(x.auditStatus) === String(AUDIT_STATUS.REJECTED)).length
}

function calcAdminExtraStats(contentData, assessmentRows) {
    extraStats.value.contentTotal = contentData.length
    extraStats.value.profileTotal = 0
    extraStats.value.passRate = 0
    extraStats.value.recentSubmitCount = 0
    extraStats.value.assessmentTotal = assessmentRows.length
    extraStats.value.abilityCount = assessmentRows.filter(x => x.type === 'ABILITY').length
    extraStats.value.normalCount = assessmentRows.filter(x => x.type === 'NORMAL').length
}

function calcUserExtraStats(contentData, userData) {
    const total = stats.value.totalCount
    extraStats.value.contentTotal = contentData.length
    extraStats.value.profileTotal = userData.length
    extraStats.value.passRate = total > 0 ? Math.round((stats.value.approvedCount / total) * 100) : 0
    extraStats.value.recentSubmitCount = 0
    extraStats.value.assessmentTotal = 0
    extraStats.value.abilityCount = 0
    extraStats.value.normalCount = 0
}

function calcTrend(list) {
    const map = {}
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 6; i >= 0; i--) {
        const day = new Date(now)
        day.setDate(now.getDate() - i)
        const d = formatDateKey(day)
        map[d] = { date: d, total: 0, approved: 0, rejected: 0 }
    }

    list.forEach(item => {
        const day = String(resolveAuditTime(item)).slice(0, 10)
        if (map[day]) {
            map[day].total++
            if (String(item.auditStatus) === String(AUDIT_STATUS.APPROVED)) map[day].approved++
            if (String(item.auditStatus) === String(AUDIT_STATUS.REJECTED)) map[day].rejected++
        }
    })

    trend.value = Object.values(map).map(x => ({
        ...x,
        approvedRate: x.total ? Math.round((x.approved / x.total) * 100) : 0
    }))
    extraStats.value.recentSubmitCount = trend.value.reduce((sum, item) => sum + Number(item.total || 0), 0)
}

function calcLatest(list) {
    latest.value = [...list]
        .sort((a, b) => new Date(resolveAuditTime(b)) - new Date(resolveAuditTime(a)))
        .slice(0, 8)
        .map(x => ({
            title: x.title || x.postTitle || '(无标题)',
            originStatus: x.auditStatus,
            auditStatus:
                String(x.auditStatus) === String(AUDIT_STATUS.APPROVED)
                    ? '已通过'
                    : String(x.auditStatus) === String(AUDIT_STATUS.REJECTED)
                      ? '已驳回'
                      : '待审核',
            auditTime: resolveAuditTime(x) ? String(resolveAuditTime(x)).slice(5, 16) : '-'
        }))
}

watch(
    [() => trend.value, () => stats.value, () => extraStats.value],
    () => {
        nextTick(() => {
            renderTrendChart()
            renderStatusPie()
            renderAssessmentPie()
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
    disposeCharts()
})
</script>

<style lang="scss" scoped>
.audit-dashboard {
    padding: 10px;
    background-color: var(--el-bg-color-page);
    min-height: 100vh;

    .dashboard-alert {
        margin-bottom: 16px;
    }

    .card-row {
        margin-bottom: 20px;
    }

    .stat-card {
        border: none;
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s;
        background: var(--el-bg-color-overlay);

        &:hover {
            transform: translateY(-4px);
            box-shadow: var(--el-box-shadow-light);
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
                    color: var(--el-text-color-secondary);
                    margin-bottom: 8px;
                }
                .stat-value {
                    font-size: 28px;
                    font-weight: 700;
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
                &.icon-bg-contentTotal {
                    background: rgba(64, 158, 255, 0.1);
                    color: #409eff;
                }
                &.icon-bg-assessmentTotal {
                    background: rgba(111, 122, 211, 0.12);
                    color: #6f7ad3;
                }
                &.icon-bg-abilityCount {
                    background: rgba(64, 158, 255, 0.12);
                    color: #409eff;
                }
                &.icon-bg-normalCount {
                    background: rgba(103, 194, 58, 0.12);
                    color: #67c23a;
                }
            }
        }
    }

    .chart-card,
    .table-card {
        border-radius: 12px;
        border: none;
        margin-bottom: 20px;
        background: var(--el-bg-color-overlay);

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .header-title {
                font-size: 16px;
                font-weight: 600;
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

    .chart-container--compact {
        height: 260px;
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
            color: var(--el-text-color-regular);
            margin-bottom: 4px;
        }
        .latest-meta {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }
    }
}
</style>
