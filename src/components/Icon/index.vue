<template>
    <span v-bind="wrapperAttrs">
        <IconifyIcon v-bind="props" />
    </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { Icon as IconifyIcon } from '@iconify/vue/dist/offline'
import type { IconProps } from '@iconify/vue'
import type { HTMLAttributes, StyleValue } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<IconProps>()
const attrs = useAttrs()

const wrapperAttrs = computed<HTMLAttributes & Record<string, unknown>>(() => {
    const { class: className, style, ...rest } = attrs as Record<string, unknown>
    return {
        ...rest,
        class: className as HTMLAttributes['class'],
        style: style as StyleValue | undefined
    }
})
</script>
