<template>
    <el-empty v-if="!loading && posts.length === 0" description="暂无内容" :image-size="110" />

    <div v-else-if="loading && posts.length === 0" class="feed-skeleton">
        <el-skeleton animated :count="6">
            <template #template>
                <div class="feed-item--skeleton">
                    <div class="header-skeleton">
                        <el-skeleton-item variant="circle" style="width: 40px; height: 40px" />
                        <div class="meta-skeleton">
                            <el-skeleton-item variant="text" style="width: 30%" />
                            <el-skeleton-item variant="text" style="width: 50%; margin-top: 6px" />
                        </div>
                    </div>
                    <div class="body-skeleton">
                        <el-skeleton-item variant="text" style="width: 90%" />
                        <el-skeleton-item variant="text" style="width: 70%; margin-top: 8px" />
                        <div class="media-skeleton"></div>
                    </div>
                </div>
            </template>
        </el-skeleton>
    </div>

    <div v-else class="feed-list">
        <FeedItem
            v-for="item in posts"
            :key="item.id"
            :post="item"
            :checked="selectedIds?.includes(item.id)"
            @select="val => emit('select', { id: item.id, checked: val })"
            @delete="val => emit('delete', val)"
        />

        <div v-if="posts.length" class="load-more">
            <div ref="sentinel" class="sentinel"></div>

            <el-button v-if="!finished" :loading="loadingMore" text bg size="small" @click="$emit('load-more')">
                {{ loadingMore ? '加载中...' : '加载更多' }}
            </el-button>
            <span v-else class="finished">已无更多数据</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import FeedItem from './FeedItem.vue'

const props = defineProps<{
    posts: any[]
    loading: boolean
    loadingMore: boolean
    finished: boolean
    selectedIds?: Array<string | number>
}>()

const emit = defineEmits<{
    (e: 'load-more'): void
    (e: 'select', payload: { id: string | number; checked: boolean }): void
    (e: 'delete', id: string | number): void
}>()

const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
let lock = false

const teardown = () => {
    if (io) {
        io.disconnect()
        io = null
    }
}

const setup = () => {
    teardown()
    const el = sentinel.value
    if (!el) return

    io = new IntersectionObserver(
        entries => {
            const entry = entries?.[0]
            if (!entry?.isIntersecting) return
            if (props.finished || props.loading || props.loadingMore || lock) return

            lock = true
            emit('load-more')
            setTimeout(() => {
                lock = false
            }, 200)
        },
        { rootMargin: '200px 0px', threshold: 0 }
    )
    io.observe(el)
}

onMounted(setup)
onBeforeUnmount(teardown)

watch(
    () => props.posts.length,
    async () => {
        await nextTick()
        setup()
    }
)
</script>

<style scoped lang="scss">
.feed-skeleton {
    padding: 4px 0;
}

.feed-item--skeleton {
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;

    .header-skeleton {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .meta-skeleton {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
    }

    .body-skeleton {
        .media-skeleton {
            margin-top: 16px;
            width: 100%;
            height: 200px;
            border-radius: 8px;
            background: var(--el-fill-color-light);
        }
    }
}

.feed-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.load-more {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 20px;
    position: relative;

    .sentinel {
        position: absolute;
        top: -100px;
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
</style>
