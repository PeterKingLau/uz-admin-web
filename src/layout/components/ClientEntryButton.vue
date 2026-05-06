<template>
    <button v-if="visible" type="button" class="client-entry-button" @click="handleClick">
        <Icon icon="mdi:cellphone-link" />
        <span>进入客户端</span>
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
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
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

.client-entry-button :deep(svg) {
    font-size: 16px;
}

@media screen and (max-width: 1100px) {
    .client-entry-button {
        width: 34px;
        padding: 0;
    }

    .client-entry-button span {
        display: none;
    }
}
</style>
