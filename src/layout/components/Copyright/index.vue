<template>
    <footer v-if="visible" class="copyright">
        <span>{{ content }}</span>
    </footer>
</template>

<script setup>
defineOptions({ name: 'LayoutComponentsCopyright' })
import useSettingsStore from '@/store/modules/settings'

const settingsStore = useSettingsStore()

const visible = computed(() => settingsStore.footerVisible)
const content = computed(() => settingsStore.footerContent)
</script>

<style scoped>
.copyright {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 36px;
    padding: 10px 20px;
    text-align: right;
    background-color: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 14px;
    border-top: 1px solid var(--el-border-color-light);
    z-index: 999;
}
</style>
