<template>
    <div class="create-page-shell">
        <div class="shell-main">
            <el-card class="shell-card" shadow="never">
                <template v-if="title || subtitle" #header>
                    <div class="shell-header">
                        <div class="shell-header-text">
                            <h2 v-if="title" class="shell-title">{{ title }}</h2>
                            <p v-if="subtitle" class="shell-subtitle">{{ subtitle }}</p>
                        </div>
                    </div>
                </template>

                <el-row v-if="hasSplitLayout" :gutter="gutter" class="shell-split-layout" :style="rowStyle">
                    <el-col v-bind="leftColProps">
                        <slot name="primary" />
                    </el-col>

                    <el-col v-bind="rightColProps">
                        <slot name="secondary" />
                    </el-col>
                </el-row>

                <slot v-else />
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

type ColSize = number | undefined

const props = withDefaults(
    defineProps<{
        title?: string
        subtitle?: string
        gutter?: number
        maxWidth?: string
        leftXs?: ColSize
        leftSm?: ColSize
        leftMd?: ColSize
        leftLg?: ColSize
        leftXl?: ColSize
        rightXs?: ColSize
        rightSm?: ColSize
        rightMd?: ColSize
        rightLg?: ColSize
        rightXl?: ColSize
    }>(),
    {
        gutter: 40,
        maxWidth: '1440px',
        leftXs: 24,
        leftSm: 24,
        leftMd: 14,
        leftLg: 15,
        leftXl: 16,
        rightXs: 24,
        rightSm: 24,
        rightMd: 10,
        rightLg: 9,
        rightXl: 8
    }
)

const slots = useSlots()

const buildColProps = (sizes: Record<string, ColSize>) => Object.fromEntries(Object.entries(sizes).filter(([, value]) => value !== undefined))

const hasSplitLayout = computed(() => Boolean(slots.primary || slots.secondary))

const leftColProps = computed(() =>
    buildColProps({
        xs: props.leftXs,
        sm: props.leftSm,
        md: props.leftMd,
        lg: props.leftLg,
        xl: props.leftXl
    })
)

const rightColProps = computed(() =>
    buildColProps({
        xs: props.rightXs,
        sm: props.rightSm,
        md: props.rightMd,
        lg: props.rightLg,
        xl: props.rightXl
    })
)

const rowStyle = computed(() => {
    if (!props.maxWidth) return {}
    return {
        maxWidth: props.maxWidth,
        margin: '0 auto'
    }
})
</script>

<style scoped lang="scss">
.create-page-shell {
    background-color: var(--el-bg-color-page);
    display: flex;
    justify-content: flex-start;
    box-sizing: border-box;
}

.shell-main {
    width: 100%;
    max-width: none;
}

.shell-card {
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    background: var(--el-bg-color);
    width: 100%;

    :deep(.el-card__header) {
        padding: 30px 40px;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-card__body) {
        padding: 40px;
    }
}

.shell-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.shell-header-text {
    .shell-title {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.3;
    }

    .shell-subtitle {
        margin: 8px 0 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
    }
}

.shell-split-layout {
    width: 100%;
}
</style>
