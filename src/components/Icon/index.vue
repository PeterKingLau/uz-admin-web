<template>
    <span v-bind="wrapperAttrs">
        <IconifyIcon v-bind="props" />
    </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { Icon as IconifyIcon } from '@iconify/vue/dist/offline'
import type { IconProps } from '@iconify/vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<IconProps>()
const attrs = useAttrs()

const wrapperAttrs = computed(() => {
    const { class: className, style, ...rest } = attrs
    return {
        class: className,
        style,
        ...rest
    }
})
</script>
