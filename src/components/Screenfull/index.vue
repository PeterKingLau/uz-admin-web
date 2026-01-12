<template>
    <div @click="toggle">
        <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" class="screenfull-svg" />
    </div>
</template>

<script setup>
import { useFullscreen } from '@vueuse/core'

const { isFullscreen, toggle } = useFullscreen()
</script>

<style lang="scss" scoped>
.screenfull-svg {
    display: inline-block;
    cursor: pointer;
    width: 1em;
    height: 1em;
    font-size: 18px;
    vertical-align: middle;
    color: inherit;
    outline: none;
}
</style>
