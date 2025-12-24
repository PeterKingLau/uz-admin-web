<template>
    <el-tag v-if="tagConfig" :type="tagType" :style="customStyle" disable-transitions size="small">
        {{ tagLabel }}
    </el-tag>

    <el-tag v-else size="small" type="info">
        {{ fallbackLabel }}
    </el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { ENUM_TAG_CONFIG } from '@/utils/enum'

const props = defineProps({
    enumType: { type: String, required: true },
    value: { required: false },
    fallbackLabel: { type: String, default: '-' }
})

const normalizedValue = computed(() => {
    if (props.value === undefined || props.value === null) return undefined
    return String(props.value)
})
const groupConfig = computed(() => {
    return ENUM_TAG_CONFIG[props.enumType] || null
})

const tagConfig = computed(() => {
    if (!groupConfig.value) return null
    if (normalizedValue.value === undefined) return null
    return groupConfig.value[normalizedValue.value] || null
})

const tagLabel = computed(() => {
    return tagConfig.value?.label ?? props.fallbackLabel
})

const tagType = computed(() => {
    return tagConfig.value?.type || undefined
})

const customStyle = computed(() => {
    if (!tagConfig.value) return {}

    const style = {}
    const cfg = tagConfig.value

    if (cfg.color) style.backgroundColor = cfg.color
    if (cfg.textColor) style.color = cfg.textColor
    if (cfg.borderColor) style.borderColor = cfg.borderColor

    return style
})
</script>
