<template>
    <nav class="profile-tabs" aria-label="个人主页内容分类">
        <button
            v-for="item in tabs"
            :key="item.key"
            type="button"
            class="tab-item"
            :class="{ active: item.key === modelValue }"
            @click="$emit('update:modelValue', item.key)"
        >
            <span>{{ item.label }}</span>
            <em v-if="item.count !== undefined">{{ formatCount(item.count) }}</em>
        </button>
    </nav>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientProfileComponentsProfileTabs' })

defineProps<{
    modelValue: string
    tabs: Array<{ key: string; label: string; count?: number }>
}>()

defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const formatCount = (value: unknown) => {
    const num = Number(value || 0)
    if (!Number.isFinite(num) || num <= 0) return '0'
    if (num >= 10000) return `${(num / 10000).toFixed(num >= 100000 ? 0 : 1).replace(/\.0$/, '')}w`
    return String(num)
}
</script>

<style scoped lang="scss">
.profile-tabs {
    display: flex;
    align-items: center;
    gap: 28px;
    overflow-x: auto;
    padding: 16px;
    background: var(--client-surface);
    border-radius: 12px;
    scrollbar-width: none;
}

.profile-tabs::-webkit-scrollbar {
    display: none;
}

.tab-item {
    position: relative;
    flex: 0 0 auto;
    border: 0;
    background: transparent;
    border-radius: 0;
    padding: 4px 0;
    color: var(--text-regular);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    transition: color 0.2s ease;
}

.tab-item::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -6px;
    height: 3px;
    border-radius: 999px;
    background: var(--primary-color);
    opacity: 0;
    transform: scaleX(0.5);
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.tab-item:hover {
    color: var(--text-main);
}

.tab-item.active {
    color: var(--primary-color);
    font-weight: 700;
}

.tab-item.active::after {
    opacity: 1;
    transform: scaleX(1);
}

.tab-item em {
    font-style: normal;
    font-size: 12px;
    color: var(--text-minor);
    font-weight: 400;
}

.tab-item:focus,
.tab-item:focus-visible {
    outline: none;
}

.tab-item:focus-visible {
    color: var(--text-main);
}

@media screen and (max-width: 768px) {
    .profile-tabs {
        gap: 24px;
        padding: 14px 14px;
    }
}
</style>
