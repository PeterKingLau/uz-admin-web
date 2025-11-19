<template>
    <el-form>
        <el-form-item>
            <el-radio v-model="radioValue" :value="1"> 分钟，允许通配符 [ , - * / ] </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="2">
                周期从
                <el-input-number v-model="cycle01" :min="0" :max="58" />
                -
                <el-input-number v-model="cycle02" :min="cycle01 + 1" :max="59" />
                分钟
            </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="3">
                从
                <el-input-number v-model="average01" :min="0" :max="58" />
                分钟开始，每
                <el-input-number v-model="average02" :min="1" :max="59 - average01" />
                分钟执行一次
            </el-radio>
        </el-form-item>

        <el-form-item>
            <el-radio v-model="radioValue" :value="4">
                指定
                <el-select v-model="checkboxList" clearable placeholder="可多选" multiple :multiple-limit="10">
                    <el-option v-for="v in 60" :key="v" :label="v - 1" :value="v - 1" />
                </el-select>
            </el-radio>
        </el-form-item>
    </el-form>
</template>

<script setup>
const emit = defineEmits(['update'])

const props = defineProps({
    cron: Object,
    check: Function
})

const radioValue = ref(1)
const cycle01 = ref(0)
const cycle02 = ref(1)
const average01 = ref(0)
const average02 = ref(1)
const checkboxList = ref([])
const checkCopy = ref([0])

const cycleTotal = computed(() => {
    cycle01.value = props.check(cycle01.value, 0, 58)
    cycle02.value = props.check(cycle02.value, cycle01.value + 1, 59)
    return cycle01.value + '-' + cycle02.value
})

const averageTotal = computed(() => {
    average01.value = props.check(average01.value, 0, 58)
    average02.value = props.check(average02.value, 1, 59 - average01.value)
    return average01.value + '/' + average02.value
})

const checkboxString = computed(() => checkboxList.value.join(','))

watch(
    () => props.cron.min,
    v => parseExpression(v)
)

watch([radioValue, cycleTotal, averageTotal, checkboxString], () => applyChange())

function parseExpression(v) {
    if (v === '*') {
        radioValue.value = 1
        return
    }

    if (v.includes('-')) {
        const arr = v.split('-')
        cycle01.value = Number(arr[0])
        cycle02.value = Number(arr[1])
        radioValue.value = 2
        return
    }

    if (v.includes('/')) {
        const arr = v.split('/')
        average01.value = Number(arr[0])
        average02.value = Number(arr[1])
        radioValue.value = 3
        return
    }

    checkboxList.value = [...new Set(v.split(',').map(n => Number(n)))]
    radioValue.value = 4
}

function applyChange() {
    if (radioValue.value === 1) {
        emit('update', 'min', '*', 'min')
        return
    }
    if (radioValue.value === 2) {
        emit('update', 'min', cycleTotal.value, 'min')
        return
    }
    if (radioValue.value === 3) {
        emit('update', 'min', averageTotal.value, 'min')
        return
    }
    if (radioValue.value === 4) {
        if (!checkboxList.value.length) {
            checkboxList.value = [...checkCopy.value]
        } else {
            checkCopy.value = [...checkboxList.value]
        }
        emit('update', 'min', checkboxString.value, 'min')
    }
}
</script>

<style lang="scss" scoped>
.el-input-number--small,
.el-select {
    margin: 0 0.2rem;
}

.el-select {
    width: 19.8rem;
}
</style>
