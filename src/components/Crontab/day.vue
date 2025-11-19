<template>
    <el-form>
        <el-form-item>
            <el-radio v-model="radioValue" :value="1"> 日，允许通配符 [ , - * ? / L W ] </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="2"> 不指定 </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="3">
                周期从
                <el-input-number v-model="cycle01" :min="1" :max="30" />
                -
                <el-input-number v-model="cycle02" :min="cycle01 + 1" :max="31" />
                日
            </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="4">
                从
                <el-input-number v-model="average01" :min="1" :max="30" />
                号开始，每
                <el-input-number v-model="average02" :min="1" :max="31 - average01" />
                日执行一次
            </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="5">
                每月
                <el-input-number v-model="workday" :min="1" :max="31" />
                号最近的工作日
            </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="6"> 本月最后一天 </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="7">
                指定
                <el-select v-model="checkboxList" clearable placeholder="可多选" multiple :multiple-limit="10">
                    <el-option v-for="d in 31" :key="d" :label="d" :value="d" />
                </el-select>
            </el-radio>
        </el-form-item>
    </el-form>
</template>

<script setup>
const emit = defineEmits(['update'])

const props = defineProps({
    cron: {
        type: Object,
        default: () => ({
            second: '*',
            min: '*',
            hour: '*',
            day: '*',
            month: '*',
            week: '?',
            year: ''
        })
    },
    check: {
        type: Function,
        default: v => v
    }
})

const radioValue = ref(1)
const cycle01 = ref(1)
const cycle02 = ref(2)
const average01 = ref(1)
const average02 = ref(1)
const workday = ref(1)
const checkboxList = ref([])
const checkCopy = ref([1])

const cycleTotal = computed(() => {
    cycle01.value = props.check(cycle01.value, 1, 30)
    cycle02.value = props.check(cycle02.value, cycle01.value + 1, 31)
    return `${cycle01.value}-${cycle02.value}`
})

const averageTotal = computed(() => {
    average01.value = props.check(average01.value, 1, 30)
    average02.value = props.check(average02.value, 1, 31 - average01.value)
    return `${average01.value}/${average02.value}`
})

const workdayTotal = computed(() => {
    workday.value = props.check(workday.value, 1, 31)
    return `${workday.value}W`
})

const checkboxString = computed(() => checkboxList.value.join(','))

watch(
    () => props.cron.day,
    v => syncFromExpression(v)
)

watch([radioValue, cycleTotal, averageTotal, workdayTotal, checkboxString], () => {
    applyChange()
})

function detectMode(v) {
    if (!v) return 1
    if (v === '*') return 1
    if (v === '?') return 2
    if (v === 'L') return 6
    if (v.includes('-')) return 3
    if (v.includes('/')) return 4
    if (v.includes('W')) return 5
    return 7
}

function syncFromExpression(v) {
    const mode = detectMode(v)
    radioValue.value = mode

    if (mode === 3) {
        const [a, b] = v.split('-')
        cycle01.value = Number(a)
        cycle02.value = Number(b)
        return
    }

    if (mode === 4) {
        const [a, b] = v.split('/')
        average01.value = Number(a)
        average02.value = Number(b)
        return
    }

    if (mode === 5) {
        const [a] = v.split('W')
        workday.value = Number(a)
        return
    }

    if (mode === 7) {
        checkboxList.value = [...new Set(v.split(',').map(n => Number(n)))]
    }
}

function syncWeekWithDay(mode) {
    if (mode === 2 && props.cron.week === '?') {
        emit('update', 'week', '*', 'day')
        return
    }
    if (mode !== 2 && props.cron.week !== '?') {
        emit('update', 'week', '?', 'day')
    }
}

function applyChange() {
    const mode = radioValue.value
    syncWeekWithDay(mode)

    const handlers = {
        1: () => emit('update', 'day', '*', 'day'),
        2: () => emit('update', 'day', '?', 'day'),
        3: () => emit('update', 'day', cycleTotal.value, 'day'),
        4: () => emit('update', 'day', averageTotal.value, 'day'),
        5: () => emit('update', 'day', workdayTotal.value, 'day'),
        6: () => emit('update', 'day', 'L', 'day'),
        7: () => {
            if (!checkboxList.value.length) {
                checkboxList.value = [...checkCopy.value]
            } else {
                checkCopy.value = [...checkboxList.value]
            }
            emit('update', 'day', checkboxString.value, 'day')
        }
    }

    handlers[mode] && handlers[mode]()
}
</script>

<style lang="scss" scoped>
.el-input-number--small,
.el-select {
    margin: 0 0.2rem;
}

.el-select {
    width: 18.8rem;
}
</style>
