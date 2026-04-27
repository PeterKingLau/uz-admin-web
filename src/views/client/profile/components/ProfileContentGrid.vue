<template>
    <section class="content-grid-section">
        <div v-if="loading && !items.length" class="skeleton-grid">
            <div v-for="item in 8" :key="item" class="skeleton-card">
                <div class="skeleton-cover"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        </div>

        <div v-else-if="items.length" class="content-grid">
            <ClientPostCard
                v-for="item in items"
                :key="getPostKey(item)"
                :post="item"
                :show-author="false"
                show-comment-count
                @click="$emit('preview', item)"
            />
        </div>

        <ProfileEmpty v-else :text="emptyText" :icon="emptyIcon" />

        <div v-if="items.length" class="load-more">
            <button type="button" :disabled="loadingMore || noMore" @click="$emit('load-more')">
                <span v-if="loadingMore">正在加载...</span>
                <span v-else>{{ noMore ? '已全部加载' : '加载更多' }}</span>
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientProfileComponentsProfileContentGrid' })
import ClientPostCard from '@/views/client/components/ClientPostCard.vue'
import ProfileEmpty from './ProfileEmpty.vue'

defineProps<{
    items: Array<Record<string, any>>
    loading: boolean
    loadingMore: boolean
    noMore: boolean
    emptyText: string
    emptyIcon?: string
}>()

defineEmits<{
    (e: 'preview', item: Record<string, any>): void
    (e: 'load-more'): void
}>()

const getPostKey = (item: Record<string, any>) => item?.id ?? item?.postId ?? `${item?.createTime || ''}-${item?.content || ''}`
</script>

<style scoped lang="scss">
.content-grid-section {
    min-height: 280px;
}

.content-grid,
.skeleton-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
}

.skeleton-card {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background: var(--client-surface);
    padding-bottom: 16px;
}

.skeleton-cover,
.skeleton-line {
    background: var(--client-empty-gradient);
    background-size: 200% 100%;
    animation: pulse 1.3s ease-in-out infinite;
}

.skeleton-cover {
    aspect-ratio: 3 / 4;
    border-bottom: 1px solid var(--client-border-soft);
}

.skeleton-line {
    height: 14px;
    margin: 16px 14px 0;
    border-radius: 999px;
}

.skeleton-line.short {
    width: 56%;
}

.load-more {
    min-height: 52px;
    padding: 18px 0 4px;
    display: flex;
    justify-content: center;
}

.load-more button {
    height: 36px;
    min-width: 112px;
    border: 0;
    border-radius: 999px;
    background: var(--client-surface);
    color: var(--text-regular);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
        color 0.2s ease,
        background-color 0.2s ease;
}

.load-more button:hover:not(:disabled) {
    color: var(--primary-color);
    background: var(--client-primary-soft);
}

.load-more button:disabled {
    cursor: default;
    color: var(--text-minor);
}

button:focus,
button:focus-visible {
    outline: none;
}

@keyframes pulse {
    0% {
        background-position: 100% 0;
    }

    100% {
        background-position: -100% 0;
    }
}

@media screen and (max-width: 1440px) {
    .content-grid,
    .skeleton-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media screen and (max-width: 1024px) {
    .content-grid,
    .skeleton-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media screen and (max-width: 768px) {
    .content-grid,
    .skeleton-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }
}
</style>
