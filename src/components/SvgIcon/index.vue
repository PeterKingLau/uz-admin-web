<template>
    <Icon :icon="iconName" class="svg-icon" />
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { iconMap } from '@/utils/generator/iconMap'

const props = defineProps({
    iconClass: {
        type: String,
        required: true
    }
})

const iconName = computed(() => {
    const key = props.iconClass

    if (iconMap[key]) return iconMap[key]

    if (key.includes(':')) return key

    return `ep:${key}`
})
</script>

<style scoped>
.svg-icon {
    width: 1em;
    height: 1em;
    vertical-align: middle;
}
</style>
