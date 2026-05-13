<template>
    <Icon v-if="iconName" v-bind="$attrs" :icon="iconName" class="svg-icon" />
</template>

<script setup>
defineOptions({ name: 'ComponentsSvgIcon', inheritAttrs: false })
import { computed } from 'vue'

const props = defineProps({
    iconClass: {
        type: String,
        required: true
    }
})

const iconName = computed(() => {
    const key = String(props.iconClass || '').trim()
    return key.includes(':') ? key : ''
})
</script>

<style scoped>
.svg-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    line-height: 1;
    vertical-align: middle;
    flex-shrink: 0;
}
</style>
