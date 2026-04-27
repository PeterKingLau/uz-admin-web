<template>
    <div class="profile-empty">
        <div class="empty-icon">
            <Icon :icon="icon" />
        </div>
        <p>{{ text }}</p>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientProfileComponentsProfileEmpty' })

withDefaults(
    defineProps<{
        text: string
        icon?: string
    }>(),
    {
        icon: 'mdi:image-multiple-outline'
    }
)
</script>

<style scoped lang="scss">
.profile-empty {
    min-height: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--text-minor);
    background: var(--client-surface);
    border: 1px dashed var(--client-border-strong);
    border-radius: 12px;
}

.empty-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--client-surface-muted);
}

.empty-icon :deep(svg) {
    font-size: 28px;
    color: var(--client-empty-icon);
}

p {
    margin: 0;
    font-size: 14px;
}
</style>
