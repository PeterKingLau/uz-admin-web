<template>
    <div class="content-body">
        <el-tabs v-model="activeTabValue" class="custom-tabs" @tab-click="onTabClick">
            <el-tab-pane label="作品" name="works">
                <template #label>
                    <div class="tab-label">
                        作品 <span class="count">{{ total }}</span>
                    </div>
                </template>
            </el-tab-pane>
            <el-tab-pane label="点赞" name="likes">
                <template #label>
                    <div class="tab-label">
                        点赞 <span class="count">{{ likeCount }}</span>
                    </div>
                </template>
            </el-tab-pane>
            <el-tab-pane label="收藏" name="bookmarks">
                <template #label>
                    <div class="tab-label">
                        收藏 <span class="count">{{ bookmarkCount }}</span>
                    </div>
                </template>
            </el-tab-pane>
        </el-tabs>

        <div class="post-grid">
            <div v-for="item in postList" :key="item.id" class="post-card" @click="handlePreview(item)">
                <div class="cover-wrapper">
                    <img v-if="item.postType === POST_TYPE.IMAGE" :src="getCover(item)" alt="cover" loading="lazy" />

                    <div v-else-if="item.postType === POST_TYPE.VIDEO" class="video-wrapper">
                        <video :src="getVideoUrl(item)" muted playsinline preload="metadata" class="video-cover"></video>
                        <div class="play-icon">
                            <Icon icon="mdi:play" />
                        </div>
                    </div>

                    <div v-else class="text-cover">
                        <span>{{ item.content }}</span>
                    </div>

                    <div class="card-stat"><Icon icon="ep:star" /> {{ item.likeCount || 0 }}</div>
                    <div class="type-badge" v-if="item.postType === POST_TYPE.IMAGE">
                        <Icon icon="ep:picture" />
                    </div>
                </div>
                <div class="post-desc">
                    {{ item.content }}
                </div>
            </div>
        </div>
        <div ref="loadTriggerRef" class="load-sentinel" aria-hidden="true"></div>

        <div v-if="loading" class="loading-state">
            <el-icon class="is-loading"><Loading /></el-icon> 加载中...
        </div>

        <div v-if="noMore && postList.length > 0" class="no-more-state">- 暂时没有更多了 -</div>

        <el-empty v-if="!loading && postList.length === 0" description="暂无内容" :image-size="160" />
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { POST_TYPE } from '@/utils/enum'

const props = defineProps({
    modelValue: { type: String, default: 'works' },
    total: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    postList: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    noMore: { type: Boolean, default: false },
    getCover: { type: Function, default: () => '' },
    getVideoUrl: { type: Function, default: () => '' }
})

const emit = defineEmits(['update:modelValue', 'tab-click', 'load-more', 'preview'])

const activeTabValue = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const onTabClick = tab => emit('tab-click', tab)
const handleLoadMore = () => emit('load-more')
const handlePreview = item => emit('preview', item)

const loadTriggerRef = ref(null)
const loadPending = ref(false)
let loadObserver = null

const triggerLoadMore = () => {
    if (loadPending.value || props.loading || props.noMore) return
    loadPending.value = true
    handleLoadMore()
}

const handleIntersect = entries => {
    if (!entries?.some(entry => entry.isIntersecting)) return
    triggerLoadMore()
}

const setupObserver = () => {
    if (loadObserver) loadObserver.disconnect()
    if (!loadTriggerRef.value) return
    loadObserver = new IntersectionObserver(handleIntersect, {
        root: null,
        rootMargin: '200px 0px',
        threshold: 0.01
    })
    loadObserver.observe(loadTriggerRef.value)
}

onMounted(() => {
    setupObserver()
})

onBeforeUnmount(() => {
    loadObserver?.disconnect()
})

watch(
    () => props.loading,
    next => {
        if (!next) {
            loadPending.value = false
            if (loadObserver && loadTriggerRef.value) {
                loadObserver.unobserve(loadTriggerRef.value)
                loadObserver.observe(loadTriggerRef.value)
            }
        }
    }
)
</script>

<style scoped lang="scss">
.content-body {
    padding: 0 32px 40px;

    :deep(.custom-tabs) {
        .el-tabs__nav-wrap::after {
            background-color: var(--el-border-color-light);
            height: 1px;
        }

        .el-tabs__item {
            font-size: 16px;
            padding: 0 24px;
            color: var(--el-text-color-secondary);

            &.is-active {
                color: var(--el-text-color-primary);
                font-weight: 600;
            }

            .tab-label {
                display: flex;
                align-items: center;

                .count {
                    margin-left: 4px;
                    font-size: 12px;
                    background: var(--el-fill-color-dark);
                    padding: 0 6px;
                    border-radius: 10px;
                    color: var(--el-text-color-secondary);
                }
            }
        }

        .el-tabs__active-bar {
            background-color: var(--el-color-warning);
            height: 3px;
            border-radius: 3px;
        }
    }

    .post-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 20px;

        .post-card {
            position: relative;
            cursor: pointer;
            border-radius: 8px;
            overflow: hidden;
            background-color: var(--el-bg-color-overlay);
            border: 1px solid var(--el-border-color-extra-light);
            transition: all 0.3s;

            &:hover {
                transform: translateY(-4px);
                box-shadow: var(--el-box-shadow-light);

                .cover-wrapper::after {
                    opacity: 1;
                }
            }

            .cover-wrapper {
                position: relative;
                width: 100%;
                padding-bottom: 133%;
                background: var(--el-fill-color-darker);

                &::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.1);
                    opacity: 0;
                    transition: opacity 0.3s;
                    z-index: 1;
                    pointer-events: none;
                }

                img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    z-index: 0;
                }

                .video-wrapper {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 0;

                    .video-cover {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .play-icon {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 32px;
                        color: #fff;
                        opacity: 0.8;
                        z-index: 2;
                        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
                    }
                }

                .text-cover {
                    position: absolute;
                    inset: 0;
                    padding: 16px;
                    font-size: 14px;
                    color: var(--el-text-color-primary);
                    background: var(--el-fill-color-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;

                    span {
                        display: -webkit-box;
                        -webkit-line-clamp: 4;
                        line-clamp: 4;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                }

                .card-stat {
                    position: absolute;
                    bottom: 8px;
                    left: 8px;
                    color: #fff;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
                    z-index: 2;
                }

                .type-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    color: #fff;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 4px;
                    border-radius: 4px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    z-index: 2;
                }
            }

            .post-desc {
                padding: 8px 10px;
                font-size: 13px;
                color: var(--el-text-color-regular);
                line-height: 1.4;
                display: -webkit-box;
                line-clamp: 2;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                background: var(--el-bg-color-overlay);
            }
        }
    }

    .loading-state,
    .no-more-state {
        text-align: center;
        padding: 30px 0;
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }

    .load-sentinel {
        height: 1px;
    }
}
</style>
