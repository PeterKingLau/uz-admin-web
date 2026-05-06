<template>
    <el-date-picker v-bind="datePickerAttrs" :class="['app-date-picker', attrs.class]" :popper-class="mergedPopperClass">
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps || {}" />
        </template>
    </el-date-picker>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ name: 'AppDatePicker', inheritAttrs: false })

const attrs = useAttrs()

const datePickerAttrs = computed(() => {
    const { class: _class, popperClass: _popperClass, 'popper-class': _kebabPopperClass, ...rest } = attrs
    return rest
})

const mergedPopperClass = computed(() => {
    const rawClass = attrs.popperClass ?? attrs['popper-class']
    return ['app-date-picker-popper', rawClass].filter(Boolean).join(' ')
})
</script>

<style scoped lang="scss">
.app-date-picker {
    --app-date-radius: 10px;

    width: 100%;

    :deep(.el-input__wrapper) {
        border-radius: var(--app-date-radius);
        background:
            linear-gradient(180deg, color-mix(in srgb, var(--el-fill-color-blank) 94%, var(--el-color-white)), var(--el-fill-color-blank));
        box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
        transition:
            background-color var(--app-motion-fast),
            box-shadow var(--app-motion-fast);

        &:hover {
            box-shadow: 0 0 0 1px var(--el-border-color) inset;
        }

        &.is-focus,
        &.is-focused {
            background: color-mix(in srgb, var(--el-color-primary-light-9) 62%, var(--el-fill-color-blank));
            box-shadow:
                0 0 0 1px var(--el-color-primary) inset,
                0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
        }
    }

    :deep(.el-range-input) {
        font-size: 13px;
    }

    :deep(.el-range-separator) {
        color: var(--el-text-color-secondary);
    }

    :deep(.el-input__prefix),
    :deep(.el-range__icon) {
        color: var(--el-color-primary);
    }
}

:global(.app-date-picker-popper.el-picker__popper) {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 14px 34px color-mix(in srgb, var(--el-color-black) 14%, transparent);
}

:global(.app-date-picker-popper .el-picker-panel) {
    border-radius: 12px;
}

:global(.app-date-picker-popper .el-date-table td.current:not(.disabled) .el-date-table-cell__text),
:global(.app-date-picker-popper .el-date-table td.today .el-date-table-cell__text) {
    border-radius: 8px;
}
</style>
