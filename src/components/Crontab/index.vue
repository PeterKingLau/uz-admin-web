<template>
    <div>
        <el-tabs v-model="tabActive" type="border-card">
            <el-tab-pane v-for="tab in visibleTabs" :key="tab.key" :label="tab.label" :name="tab.key">
                <component :is="tab.component" :ref="tab.ref" :check="checkNumber" :cron="crontabValueObj" @update="updateCrontabValue" />
            </el-tab-pane>
        </el-tabs>

        <div class="popup-main">
            <div class="cron-preview">
                <p class="title">时间表达式</p>

                <div class="grid">
                    <div v-for="unit in visibleUnits" :key="unit.key" class="cell">
                        <div class="label">{{ unit.label }}</div>

                        <el-tooltip v-if="String(crontabValueObj[unit.key]).length >= 10" :content="crontabValueObj[unit.key]" placement="top">
                            <div class="value">
                                {{ crontabValueObj[unit.key] }}
                            </div>
                        </el-tooltip>

                        <div v-else class="value">
                            {{ crontabValueObj[unit.key] }}
                        </div>
                    </div>

                    <div class="cell cell--full">
                        <div class="label">Cron 表达式</div>

                        <el-tooltip v-if="crontabValueString.length >= 90" :content="crontabValueString" placement="top">
                            <div class="value value--long">
                                {{ crontabValueString }}
                            </div>
                        </el-tooltip>

                        <div v-else class="value value--long">
                            {{ crontabValueString }}
                        </div>
                    </div>
                </div>
            </div>

            <CrontabResult :ex="crontabValueString" />

            <div class="cron-actions">
                <el-button type="primary" @click="submitFill">
                    <Icon icon="ep:check" class="btn-icon" />
                    <span>确定</span>
                </el-button>
                <el-button type="warning" @click="clearCron">
                    <Icon icon="ep:refresh-right" class="btn-icon" />
                    <span>重置</span>
                </el-button>
                <el-button @click="hidePopup">
                    <Icon icon="ep:close" class="btn-icon" />
                    <span>取消</span>
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

import CrontabSecond from './second.vue'
import CrontabMin from './min.vue'
import CrontabHour from './hour.vue'
import CrontabDay from './day.vue'
import CrontabMonth from './month.vue'
import CrontabWeek from './week.vue'
import CrontabYear from './year.vue'
import CrontabResult from './result.vue'

const emit = defineEmits(['hide', 'fill'])

const props = defineProps({
    hideComponent: {
        type: Array,
        default: () => []
    },
    expression: {
        type: String,
        default: ''
    }
})

const crontabValueObj = ref({
    second: '*',
    min: '*',
    hour: '*',
    day: '*',
    month: '*',
    week: '?',
    year: ''
})

const units = [
    { key: 'second', label: '秒' },
    { key: 'min', label: '分钟' },
    { key: 'hour', label: '小时' },
    { key: 'day', label: '日' },
    { key: 'month', label: '月' },
    { key: 'week', label: '周' },
    { key: 'year', label: '年' }
]

const tabs = [
    { key: 'second', label: '秒', component: CrontabSecond, ref: 'cronsecond' },
    { key: 'min', label: '分钟', component: CrontabMin, ref: 'cronmin' },
    { key: 'hour', label: '小时', component: CrontabHour, ref: 'cronhour' },
    { key: 'day', label: '日', component: CrontabDay, ref: 'cronday' },
    { key: 'month', label: '月', component: CrontabMonth, ref: 'cronmonth' },
    { key: 'week', label: '周', component: CrontabWeek, ref: 'cronweek' },
    { key: 'year', label: '年', component: CrontabYear, ref: 'cronyear' }
]

const hideComponentInner = ref([])
const tabActive = ref('second')

const crontabValueString = computed(() => {
    const obj = crontabValueObj.value
    const base = `${obj.second} ${obj.min} ${obj.hour} ${obj.day} ${obj.month} ${obj.week}`
    return obj.year === '' ? base : `${base} ${obj.year}`
})

const visibleUnits = computed(() => units.filter(u => shouldShow(u.key)))

const visibleTabs = computed(() => tabs.filter(t => shouldShow(t.key)))

function shouldShow(key) {
    return !(hideComponentInner.value && hideComponentInner.value.includes(key))
}

function resolveExp(exp) {
    if (!exp) {
        clearCron()
        return
    }
    const arr = exp.trim().split(/\s+/)
    if (arr.length < 6) return
    const obj = {
        second: arr[0],
        min: arr[1],
        hour: arr[2],
        day: arr[3],
        month: arr[4],
        week: arr[5],
        year: arr[6] || ''
    }
    crontabValueObj.value = { ...obj }
}

function updateCrontabValue(name, value) {
    crontabValueObj.value[name] = value
}

function checkNumber(value, minLimit, maxLimit) {
    let v = Math.floor(Number(value) || 0)
    if (v < minLimit) v = minLimit
    if (v > maxLimit) v = maxLimit
    return v
}

function hidePopup() {
    emit('hide')
}

function submitFill() {
    emit('fill', crontabValueString.value)
    hidePopup()
}

function clearCron() {
    crontabValueObj.value = {
        second: '*',
        min: '*',
        hour: '*',
        day: '*',
        month: '*',
        week: '?',
        year: ''
    }
}

watch(
    () => props.expression,
    val => {
        resolveExp(val)
    },
    { immediate: true }
)

watch(
    () => props.hideComponent,
    val => {
        hideComponentInner.value = Array.isArray(val) ? [...val] : []
        const firstVisible = visibleTabs.value[0]
        if (firstVisible) {
            tabActive.value = firstVisible.key
        }
    },
    { immediate: true }
)

onMounted(() => {
    const firstVisible = visibleTabs.value[0]
    if (firstVisible) {
        tabActive.value = firstVisible.key
    }
})
</script>

<style lang="scss" scoped>
.popup-main {
    position: relative;
    margin: 10px auto;
    border-radius: 6px;
    font-size: 12px;
}

.cron-preview {
    position: relative;
    margin: 20px auto 10px;
    padding: 20px 15px 15px;
    border-radius: 8px;
    border: 1px solid #dcdfe6;
    background: #fff;

    .title {
        position: absolute;
        top: -22px;
        left: 50%;
        padding: 0 10px;
        background: #fff;
        transform: translateX(-50%);
        font-size: 14px;
        font-weight: 600;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 12px;
        width: 100%;
    }

    .cell {
        display: flex;
        flex-direction: column;

        .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
        }

        .value {
            padding: 6px 8px;
            border: 1px solid #e8e8e8;
            border-radius: 4px;
            background: #fafafa;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: Consolas, Menlo, Monaco, monospace;
            font-size: 12px;
        }
    }

    .cell--full {
        grid-column: 1 / -1;

        .value--long {
            font-weight: 600;
            color: #333;
        }
    }
}

.cron-actions {
    text-align: center;
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 12px;

    .btn-icon {
        margin-right: 4px;
        vertical-align: middle;
    }
}
</style>
