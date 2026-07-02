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
            <div v-for="item in items" :key="getPostKey(item)" class="content-grid-item">
                <ClientPostCard :post="item" :show-author="false" show-comment-count @click="$emit('preview', item)" />
                <button
                    v-if="showDelete"
                    type="button"
                    class="delete-post-btn"
                    :class="{ 'is-deleting': isDeleting(item) }"
                    :disabled="isDeleting(item)"
                    aria-label="删除作品"
                    @click.stop="$emit('delete', item)"
                >
                    <Icon :icon="isDeleting(item) ? 'mdi:loading' : 'mdi:trash-can-outline'" />
                </button>
            </div>
        </div>

        <ProfileEmpty v-else :text="emptyText" :icon="emptyIcon" />

        <div v-if="items.length" ref="loadTriggerRef" class="scroll-trigger"></div>

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
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ClientPostCard from '@/views/client/components/ClientPostCard.vue'
import ProfileEmpty from './ProfileEmpty.vue'

const props = defineProps<{
    items: Array<Record<string, any>>
    loading: boolean
    loadingMore: boolean
    noMore: boolean
    emptyText: string
    emptyIcon?: string
    showDelete?: boolean
    deletingIds?: Array<string | number>
}>()

const emit = defineEmits<{
    (e: 'preview', item: Record<string, any>): void
    (e: 'delete', item: Record<string, any>): void
    (e: 'load-more'): void
}>()

const getPostKey = (item: Record<string, any>) => item?.id ?? item?.postId ?? `${item?.createTime || ''}-${item?.content || ''}`
const getPostId = (item: Record<string, any>) => item?.postId ?? item?.id
const isDeleting = (item: Record<string, any>) => props.deletingIds?.some(id => String(id) === String(getPostId(item))) ?? false

const loadTriggerRef = ref<HTMLElement | null>(null)
const loadPending = ref(false)
let loadObserver: IntersectionObserver | null = null
let isDestroyed = false

const triggerLoadMore = () => {
    if (loadPending.value || props.loading || props.loadingMore || props.noMore || !props.items.length) return
    loadPending.value = true
    emit('load-more')
}

const handleIntersect: IntersectionObserverCallback = entries => {
    if (!entries.some(entry => entry.isIntersecting)) return
    triggerLoadMore()
}

const setupObserver = () => {
    loadObserver?.disconnect()
    loadObserver = null
    if (isDestroyed) return
    if (!loadTriggerRef.value) return
    loadObserver = new IntersectionObserver(handleIntersect, {
        root: null,
        rootMargin: '260px 0px',
        threshold: 0.01
    })
    loadObserver.observe(loadTriggerRef.value)
}

onMounted(() => {
    setupObserver()
})

onBeforeUnmount(() => {
    isDestroyed = true
    loadObserver?.disconnect()
    loadObserver = null
})

watch(
    () => [props.items.length, props.noMore] as const,
    () => {
        void nextTick(() => {
            if (!isDestroyed) setupObserver()
        })
    }
)

watch(
    () => [props.loading, props.loadingMore] as const,
    ([loading, loadingMore]) => {
        if (loading || loadingMore) return
        loadPending.value = false
        void nextTick(() => {
            if (!isDestroyed) setupObserver()
        })
    }
)
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

.content-grid-item {
    position: relative;
    min-width: 0;
}

.delete-post-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    width: 30px;
    height: 30px;
    border: 1px solid rgba(226, 232, 240, 0.78);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    color: #64748b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(6px);
    transition:
        background-color 200ms ease,
        border-color 200ms ease,
        color 200ms ease;
}

.delete-post-btn:hover:not(:disabled) {
    border-color: rgba(239, 68, 68, 0.24);
    background: #fef2f2;
    color: #ef4444;
}

.delete-post-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.delete-post-btn :deep(svg) {
    font-size: 16px;
}

.delete-post-btn.is-deleting :deep(svg) {
    animation: spin 0.8s linear infinite;
}

.skeleton-card {
    overflow: hidden;
    border-radius: var(--client-feed-card-radius);
    border: 1px solid var(--client-feed-card-border);
    background: var(--client-surface);
    box-shadow: var(--client-feed-card-shadow);
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

.scroll-trigger {
    height: 1px;
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

@keyframes spin {
    100% {
        transform: rotate(360deg);
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
