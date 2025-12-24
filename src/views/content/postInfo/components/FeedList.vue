<template>
    <el-empty v-if="!loading && posts.length === 0" description="暂无内容" :image-size="110" />

    <div v-else-if="loading && posts.length === 0" class="feed-skeleton">
        <el-skeleton animated :count="6">
            <template #template>
                <div class="feed-item--skeleton">
                    <div class="type-skeleton"></div>
                    <div class="body-skeleton">
                        <el-skeleton-item variant="text" style="width: 40%" />
                        <el-skeleton-item variant="text" style="width: 70%; margin-top: 8px" />
                        <el-skeleton-item variant="text" style="width: 55%; margin-top: 6px" />
                        <el-skeleton-item variant="text" style="width: 85%; margin-top: 10px" />
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
        />

        <div v-if="posts.length" class="load-more">
            <div ref="sentinel" style="height: 1px; width: 1px"></div>

            <el-button v-if="!finished" :loading="loadingMore" size="small" @click="$emit('load-more')">
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
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 10px;
    display: flex;
    gap: 12px;
    margin-bottom: 10px;

    .type-skeleton {
        width: 64px;
        min-width: 64px;
        height: 220px;
        border-radius: 10px;
        background: var(--el-fill-color-lighter);
        flex-shrink: 0;
    }

    .body-skeleton {
        flex: 1;
        padding-top: 4px;
        min-width: 0;
    }

    .media-skeleton {
        margin-top: 10px;
        width: 100%;
        height: 180px;
        border-radius: 10px;
        background: var(--el-fill-color-lighter);
    }
}

.feed-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.load-more {
    margin-top: 6px;
    display: flex;
    justify-content: center;
    padding: 8px 0 2px;

    .finished {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}
</style>
