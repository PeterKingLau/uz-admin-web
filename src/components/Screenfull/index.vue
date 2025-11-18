<template>
    <div>
        <svg-icon :icon-class="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" @click="toggle" />
    </div>
</template>

<script setup>
import { useFullscreen } from '@vueuse/core'

const { isFullscreen, enter, exit, toggle } = useFullscreen()
</script>

<style lang="scss" scoped>
.screenfull-svg {
    display: inline-block;
    cursor: pointer;
    fill: #5a5e66;
    width: 24px;
    height: 24px;
    vertical-align: 10px;
}
</style>
