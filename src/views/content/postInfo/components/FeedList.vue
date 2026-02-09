<template>
    <el-empty v-if="!loading && posts.length === 0" description="暂无内容" :image-size="110" />

    <div v-else-if="loading && posts.length === 0" class="feed-skeleton">
        <el-skeleton animated :count="6">
            <template #template>
                <div class="feed-item--skeleton">
                    <div class="header-skeleton">
                        <el-skeleton-item variant="text" style="width: 40%" />
                        <el-skeleton-item variant="text" style="width: 30%" />
                    </div>
                    <div class="meta-skeleton">
                        <el-skeleton-item variant="circle" style="width: 36px; height: 36px" />
                        <div class="meta-lines">
                            <el-skeleton-item variant="text" style="width: 55%" />
                            <el-skeleton-item variant="text" style="width: 35%; margin-top: 6px" />
                        </div>
                    </div>
                    <div class="body-skeleton">
                        <el-skeleton-item variant="text" style="width: 90%" />
                        <el-skeleton-item variant="text" style="width: 70%; margin-top: 8px" />
                        <div class="media-skeleton"></div>
                    </div>
                    <div class="footer-skeleton">
                        <el-skeleton-item variant="text" style="width: 60%" />
                    </div>
                </div>
            </template>
        </el-skeleton>
    </div>

    <div v-else class="feed-grid">
        <FeedItem
            v-for="item in posts"
            :key="item.id"
            :post="item"
            :checked="isSelected(item.id)"
            :batch-mode="batchMode"
            @select="val => handleSelect(item.id, val)"
            @delete="emit('delete', $event)"
            @preview="emit('preview', $event)"
            @view-profile="emit('view-profile', $event)"
            @edit-tag="emit('edit-tag', $event)"
            @pin="emit('pin', $event)"
            @unpin="emit('unpin', $event)"
            @like="emit('like', $event)"
            @qrcode="emit('qr-code', $event)"
        />

        <div v-if="posts.length" class="load-more">
            <div ref="sentinelRef" class="sentinel"></div>

            <el-button v-if="!finished" :loading="loadingMore" text bg size="small" @click="emit('load-more', { source: 'manual' })">
                {{ loadingMore ? '加载中...' : '加载更多' }}
            </el-button>
            <span v-else class="finished">已无更多数据</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import FeedItem from './FeedItem.vue'

const props = defineProps<{
    posts: any[]
    loading: boolean
    loadingMore: boolean
    finished: boolean
    selectedIds?: Array<string | number>
    batchMode?: boolean
}>()

const emit = defineEmits<{
    (e: 'load-more', payload?: { source: 'auto' | 'manual' }): void
    (e: 'select', payload: { id: string | number; checked: boolean }): void
    (e: 'delete', id: string | number): void
    (e: 'edit-tag', post: any): void
    (e: 'pin', post: any): void
    (e: 'unpin', post: any): void
    (e: 'preview', post: any): void
    (e: 'view-profile', post: any): void
    (e: 'like', post: any): void
    (e: 'qr-code', post: any): void
}>()

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let loadLock = false

const selectedIdsSet = computed(() => new Set(props.selectedIds || []))

const isSelected = (id: string | number) => selectedIdsSet.value.has(id)

const handleSelect = (id: string | number, checked: boolean) => {
    emit('select', { id, checked })
}

const destroyObserver = () => {
    if (observer) {
        observer.disconnect()
        observer = null
    }
}

const createObserver = () => {
    destroyObserver()

    const element = sentinelRef.value
    if (!element) return

    observer = new IntersectionObserver(
        entries => {
            const entry = entries[0]
            if (!entry?.isIntersecting) return
            if (props.finished || props.loading || props.loadingMore || loadLock) return

            loadLock = true
            emit('load-more', { source: 'auto' })
            setTimeout(() => {
                loadLock = false
            }, 200)
        },
        { rootMargin: '240px 0px', threshold: 0 }
    )

    observer.observe(element)
}

onMounted(createObserver)
onBeforeUnmount(destroyObserver)

watch(
    () => props.posts.length,
    async () => {
        await nextTick()
        createObserver()
    }
)
</script>

<style scoped lang="scss">
.feed-skeleton {
    padding: 4px 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
}

.feed-skeleton :deep(.el-skeleton) {
    display: contents;
}

.feed-item--skeleton {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);

    .header-skeleton {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
    }

    .meta-skeleton {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;

        .meta-lines {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
    }

    .body-skeleton {
        .media-skeleton {
            margin-top: 14px;
            width: 100%;
            height: 200px;
            border-radius: 12px;
            background: var(--el-fill-color-light);
        }
    }

    .footer-skeleton {
        margin-top: 14px;
    }
}

.feed-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(286px, 1fr));
    gap: 10px;
    align-items: start;
}

.load-more {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 20px;
    position: relative;
    grid-column: 1 / -1;

    .sentinel {
        position: absolute;
        top: -140px;
        height: 1px;
        width: 1px;
        opacity: 0;
        pointer-events: none;
    }

    .finished {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        padding: 8px 0;
    }
}

@media screen and (max-width: 768px) {
    .feed-grid,
    .feed-skeleton {
        grid-template-columns: 1fr;
    }
}
</style>
