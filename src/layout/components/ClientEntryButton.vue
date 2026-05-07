<template>
    <button v-if="visible" type="button" class="client-entry-button" @click="handleClick">
        <Icon icon="mdi:cellphone-link" class="client-entry-icon" />
        <span class="entry-label-full">进入客户端</span>
        <span class="entry-label-short">客户端</span>
    </button>
</template>

<script setup lang="ts">
defineOptions({ name: 'LayoutComponentsClientEntryButton' })
import { useRouter } from 'vue-router'
import { getClientBaseUrl, getClientHomeRoute } from '@/utils/routeAccess'

defineProps<{
    visible: boolean
}>()

const router = useRouter()

const handleClick = () => {
    const clientBaseUrl = getClientBaseUrl()
    if (clientBaseUrl) {
        window.location.href = clientBaseUrl
        return
    }
    router.push(getClientHomeRoute())
}
</script>

<style scoped lang="scss">
.client-entry-button {
    height: 34px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--el-color-primary) 28%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
    color: var(--el-color-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
        background-color var(--app-motion-fast),
        border-color var(--app-motion-fast),
        color var(--app-motion-fast);
}

.client-entry-button:hover {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: var(--el-color-white);
}

.client-entry-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.client-entry-icon :deep(svg),
.client-entry-icon :deep(.iconify) {
    width: 1em;
    height: 1em;
    display: block;
}

.entry-label-short {
    display: none;
}

@media screen and (max-width: 1100px) {
    .client-entry-button {
        min-width: 0;
        flex-basis: auto;
        padding: 0 10px;
        gap: 5px;
    }

    .entry-label-full {
        display: none;
    }

    .entry-label-short {
        display: inline;
    }
}

@media screen and (max-width: 768px) {
    .client-entry-button {
        height: 32px;
        border-radius: 7px;
        font-size: 12px;
    }

    .client-entry-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
    }
}
</style>
