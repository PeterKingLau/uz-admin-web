<template>
    <div ref="rootRef" class="feed-item">
        <div class="select-box">
            <el-checkbox :model-value="checked" @change="$emit('select', $event)" />
        </div>
        <div class="feed-type-indicator" :class="`type-${String(post.postType)}`">
            <Icon :icon="typeIcon" />
            <span>{{ typeText }}</span>
        </div>

        <div class="feed-body">
            <div class="feed-top">
                <div class="user-block">
                    <el-avatar :size="32" :src="fullAvatar(post.avatar)" class="avatar">
                        {{ post.nickName?.slice(0, 1) || 'U' }}
                    </el-avatar>
                    <div class="user-meta">
                        <div class="name-line">
                            <span class="name">{{ post.nickName || '未知用户' }}</span>
                            <span class="time">{{ post.createTime || '-' }}</span>
                        </div>
                    </div>
                </div>

                <div class="type-tags">
                    <EnumTag enum-type="POST_TYPE" :value="post.postType" />
                </div>
            </div>

            <div v-if="post.content" class="feed-content" :class="{ 'feed-content--center': isTextOnly }">
                {{ post.content }}
            </div>
            <div v-else class="feed-content feed-content--empty">（无正文内容）</div>

            <div v-if="isVisible && isImage && images.length" class="feed-media-inline feed-media-inline--images">
                <MediaPreview
                    v-for="(img, idx) in images"
                    :key="img + idx"
                    :post-type="post.postType"
                    :media-urls="[img]"
                    :audit-status="post.auditStatus"
                    :mode="auditMode"
                />
            </div>

            <div v-if="isVisible && isVideo && videos.length" class="feed-media-inline">
                <MediaPreview :post-type="post.postType" :media-urls="[videos[0]]" :audit-status="post.auditStatus" :mode="auditMode" />
            </div>

            <div class="feed-footer">
                <div class="stats">
                    <div class="stat">
                        <Icon icon="mdi:thumb-up-outline" />
                        <span>{{ post.likeCount ?? 0 }}</span>
                    </div>
                    <div class="stat">
                        <Icon icon="mdi:comment-outline" />
                        <span>{{ post.commentCount ?? 0 }}</span>
                    </div>
                    <div class="stat">
                        <Icon icon="mdi:share-variant-outline" />
                        <span>{{ post.repostCount ?? 0 }}</span>
                    </div>
                    <div class="stat">
                        <Icon :icon="(post.bookmarkCount ?? 0) > 0 ? 'mdi:bookmark' : 'mdi:bookmark-outline'" />
                        <span>{{ post.bookmarkCount ?? 0 }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import EnumTag from '@/components/EnumTag/index.vue'
import MediaPreview from '@/components/MediaPreview/index.vue'
import { isExternal } from '@/utils/validate'

const props = defineProps<{
    post: any
    checked?: boolean
    auditMode?: string | number
}>()
const emit = defineEmits<{
    (e: 'select', value: boolean): void
}>()

const { proxy } = getCurrentInstance() || {}
const rootRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const typeText = computed(() => {
    const t = String(props.post?.postType)
    return t === '1' ? '文字' : t === '2' ? '图片' : '视频'
})
const typeIcon = computed(() => {
    const t = String(props.post?.postType)
    return t === '1' ? 'ep:document' : t === '2' ? 'ep:picture' : 'ep:video-camera'
})

const fullAvatar = (avatar: string) => {
    if (!avatar) return ''
    if (/^https?:\/\//.test(avatar)) return avatar
    return (import.meta.env.VITE_APP_BASE_API || '') + avatar
}
const transformUrl = (url: string) => {
    const fn = (proxy as any)?.$imgUrl
    return !isExternal(url) && fn ? fn(url) : url
}
const normalizeMediaUrls = (mediaUrls: any): string[] => {
    if (!mediaUrls) return []
    if (Array.isArray(mediaUrls)) return mediaUrls
    if (typeof mediaUrls === 'string') {
        const s = mediaUrls.trim()
        if (!s) return []
        if (s.startsWith('[')) {
            try {
                const arr = JSON.parse(s)
                return Array.isArray(arr) ? arr : []
            } catch {
                return []
            }
        }
        return [s]
    }
    return []
}
const isImageUrl = (url: string) => {
    const u = String(url || '')
        .split('?')[0]
        .toLowerCase()
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(u)
}
const isVideoUrl = (url: string) => {
    const u = String(url || '')
        .split('?')[0]
        .toLowerCase()
    return /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/.test(u)
}

const isImage = computed(() => String(props.post?.postType) === '2')
const isVideo = computed(() => String(props.post?.postType) === '3')

const images = computed(() => {
    if (!isImage.value) return []
    const urls = normalizeMediaUrls(props.post?.mediaUrls)
    const imgs = urls.filter(isImageUrl).map(transformUrl)
    return imgs.length ? imgs : urls.map(transformUrl)
})
const videos = computed(() => {
    if (!isVideo.value) return []
    const urls = normalizeMediaUrls(props.post?.mediaUrls)
    const vids = urls.filter(isVideoUrl).map(transformUrl)
    return vids.length ? vids : urls.map(transformUrl)
})

const isTextOnly = computed(() => String(props.post?.postType) === '1' && images.value.length === 0 && videos.value.length === 0)

function setupObserver() {
    if (isVisible.value) return
    const el = rootRef.value
    if (!el || typeof IntersectionObserver === 'undefined') {
        isVisible.value = true
        return
    }

    observer?.disconnect()
    observer = new IntersectionObserver(
        entries => {
            const entry = entries?.[0]
            if (entry?.isIntersecting) {
                isVisible.value = true
                observer?.disconnect()
                observer = null
            }
        },
        { rootMargin: '200px 0px', threshold: 0 }
    )
    observer.observe(el)
}

onMounted(() => {
    setupObserver()
})

onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
})

watch(
    () => props.post?.id,
    async () => {
        isVisible.value = false
        await nextTick()
        setupObserver()
    }
)
</script>

<style scoped lang="scss">
.feed-item {
    display: flex;
    gap: 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 10px;
    transition:
        box-shadow 0.15s ease,
        transform 0.15s ease;
    background: #fff;

    &:hover {
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
        transform: translateY(-1px);
    }
}

.select-box {
    display: flex;
    align-items: flex-start;
    padding-top: 4px;
}

.feed-type-indicator {
    width: 64px;
    min-width: 64px;
    height: 220px;
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    flex-shrink: 0;

    :deep(svg) {
        font-size: 20px;
    }
}

.feed-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.feed-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.user-block {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    .avatar {
        flex-shrink: 0;
    }
}
.user-meta {
    min-width: 0;

    .name-line {
        display: flex;
        align-items: baseline;
        gap: 10px;
        min-width: 0;

        .name {
            font-size: 13px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 260px;
        }
        .time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            white-space: nowrap;
        }
    }
}

.type-tags {
    display: flex;
    align-items: center;

    :deep(.el-tag) {
        transform: scale(0.9);
        transform-origin: right top;
    }
}

.feed-content {
    margin-top: 8px;
    padding: 10px 10px;
    background: #fbfcff;
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 10px;

    font-size: 13px;
    line-height: 1.55;
    color: var(--el-text-color-primary);

    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
}

.feed-content--center {
    min-height: 120px;
    line-clamp: 3;
    -webkit-line-clamp: 3;
}

.feed-content--empty {
    color: var(--el-text-color-secondary);
    font-style: italic;
}

.feed-media-inline {
    margin-top: 10px;
    border-radius: 10px;
    overflow: hidden;
    background: var(--el-fill-color-lighter);
}

.feed-media-inline--images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
}

.feed-footer {
    margin-top: auto;
    padding-top: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.stats {
    display: flex;
    align-items: center;
    gap: 18px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .stat {
        display: inline-flex;
        align-items: center;
        gap: 8px;

        :deep(svg) {
            font-size: 18px;
        }
    }
}

@media (max-width: 900px) {
    .feed-item {
        flex-direction: column;
    }

    .feed-type-indicator {
        width: 100%;
        min-width: 0;
        height: 56px;
        flex-direction: row;
        justify-content: flex-start;
        padding: 0 12px;
    }

    .user-meta .name-line .name {
        max-width: 60vw;
    }
}
</style>
