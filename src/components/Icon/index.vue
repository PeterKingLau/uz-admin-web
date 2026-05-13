<template>
    <span v-bind="wrapperAttrs">
        <IconifyIcon :key="iconRenderKey" v-bind="props" />
    </span>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue'
import { Icon as IconifyIcon } from '@iconify/vue/dist/offline'
import type { IconProps } from '@iconify/vue'
import type { HTMLAttributes, StyleValue } from 'vue'
import { ensureIconCollectionByName } from '@/utils/iconify'

defineOptions({ name: 'ComponentsIcon', inheritAttrs: false })

const props = defineProps<IconProps>()
const attrs = useAttrs()
const iconRenderVersion = ref(0)
const iconRenderKey = computed(() => `${String(props.icon || '')}-${iconRenderVersion.value}`)

watch(
    () => props.icon,
    async icon => {
        if (typeof icon !== 'string') return
        await ensureIconCollectionByName(icon)
        iconRenderVersion.value += 1
    },
    { immediate: true }
)

const wrapperAttrs = computed<HTMLAttributes & Record<string, unknown>>(() => {
    const { class: className, style, ...rest } = attrs as Record<string, unknown>
    return {
        ...rest,
        class: ['app-icon', className] as HTMLAttributes['class'],
        style: style as StyleValue | undefined
    }
})
</script>

<style scoped>
.app-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    vertical-align: -0.125em;
    flex-shrink: 0;
}

.app-icon :deep(svg) {
    display: block;
    width: 1em;
    height: 1em;
}
</style>
