<template>
    <div class="loading-state" :class="[sizeClass, themeClass]" :style="rootStyle">
        <el-icon class="loading-icon is-loading">
            <Loading />
        </el-icon>
        <span v-if="displayText" class="loading-text">{{ displayText }}</span>
    </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import { computed } from 'vue'

const props = withDefaults(
    defineProps<{
        text?: string
        size?: 'default' | 'small'
        theme?: 'default' | 'inverse'
        minHeight?: string | number
    }>(),
    {
        text: '加载中...',
        size: 'default',
        theme: 'default',
        minHeight: undefined
    }
)

const sizeClass = computed(() => `is-${props.size}`)
const themeClass = computed(() => `is-${props.theme}`)
const displayText = computed(() => String(props.text || '').trim())
const rootStyle = computed(() => {
    if (props.minHeight === undefined || props.minHeight === null || props.minHeight === '') return {}
    const minHeight = typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight
    return { minHeight }
})
</script>

<style scoped lang="scss">
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    color: var(--el-text-color-secondary);
}

.loading-state.is-small {
    gap: 8px;
}

.loading-state.is-inverse {
    color: color-mix(in srgb, var(--el-color-white) 78%, transparent);
}

.loading-icon {
    font-size: 24px;
    color: var(--el-color-primary);
}

.loading-state.is-small .loading-icon {
    font-size: 18px;
}

.loading-state.is-inverse .loading-icon {
    color: color-mix(in srgb, var(--el-color-primary-light-3) 88%, var(--el-color-white));
}

.loading-text {
    font-size: 13px;
    line-height: 1;
}

.loading-state.is-small .loading-text {
    font-size: 12px;
}
</style>
