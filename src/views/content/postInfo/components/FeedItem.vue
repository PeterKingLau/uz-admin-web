<template>
    <div v-if="!isOriginalMissing" class="feed-card" :class="{ checked, 'is-batch': isBatchMode }">
        <div
            class="card-media-wrapper"
            :class="{ 'is-clickable': canPreview }"
            @click="handleMediaClick"
            @mouseenter="handleMediaMouseEnter"
            @mouseleave="handleMediaMouseLeave"
        >
            <div class="media-top-bar" @click.stop>
                <div class="type-tag" :data-type="post?.postType">
                    <Icon :icon="typeIcon" class="tag-icon" />
                    <span>{{ typeText }}</span>
                </div>

                <div v-if="isAdmin" class="admin-toolbar">
                    <el-tooltip content="编辑标签" placement="bottom" :show-after="500">
                        <div class="tool-btn" @click="emit('edit-tag', post)">
                            <Icon icon="mdi:tag-outline" />
                        </div>
                    </el-tooltip>
                    <el-tooltip :content="post.isTop ? '取消置顶' : '置顶'" placement="bottom" :show-after="500">
                        <div class="tool-btn" :class="{ active: post.isTop }" @click="handleTogglePin">
                            <Icon :icon="post.isTop ? 'mdi:pin-off-outline' : 'mdi:pin-outline'" />
                        </div>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="bottom" :show-after="500">
                        <div class="tool-btn danger" @click="emit('delete', currentPostId)">
                            <Icon icon="mdi:trash-can-outline" />
                        </div>
                    </el-tooltip>
                </div>
            </div>

            <div v-if="isBatchMode" class="batch-select-layer" @click.stop="handleCheckboxChange(!checked)">
                <div class="checkbox-circle" :class="{ active: checked }">
                    <Icon icon="mdi:check" v-if="checked" />
                </div>
            </div>

            <div v-if="isTextPost" class="text-cover">
                <Icon icon="mdi:format-quote-open" class="text-cover-quote" />
                <div class="text-wrap">
                    <span class="text-value">{{ textCoverText }}</span>
                </div>
                <i class="text-cover-accent" aria-hidden="true"></i>
            </div>

            <el-image v-else-if="coverUrl" :src="coverUrl" fit="cover" class="media-image" loading="lazy">
                <template #placeholder>
                    <div class="image-slot">
                        <Icon icon="mdi:loading" class="spin-icon" />
                    </div>
                </template>
                <template #error>
                    <div class="image-slot error">
                        <Icon icon="mdi:image-broken-variant" />
                    </div>
                </template>
            </el-image>

            <div v-else class="media-empty">
                <Icon icon="mdi:image-off-outline" />
            </div>

            <video
                v-if="canHoverPlayPreview && shouldRenderHoverVideo"
                ref="hoverVideoRef"
                :src="activeHoverVideoSrc"
                class="media-video"
                :class="{ 'is-active': isVideoHoverActive, 'is-playing': isVideoHoverPlaying }"
                :poster="coverUrl || undefined"
                muted
                loop
                playsinline
                preload="metadata"
                disablepictureinpicture
                controlslist="nodownload noplaybackrate nofullscreen"
                @contextmenu.prevent
            ></video>

            <div v-if="isVideoPost" class="play-overlay" :class="{ 'is-hidden': isVideoHoverPlaying }">
                <div class="play-button">
                    <Icon icon="mdi:play" />
                </div>
            </div>

            <transition name="preview-badge-fade">
                <div v-if="isVideoHoverActive" class="hover-preview-badge">
                    <Icon icon="mdi:volume-off" class="badge-icon" />
                    <span>静音预览</span>
                </div>
            </transition>
        </div>

        <div class="card-bottom">
            <div class="content-text" :class="{ 'is-empty': !post.content }">
                {{ post.content || '暂无正文内容' }}
            </div>

            <div class="card-footer">
                <div class="footer-user" @click.stop="emit('view-profile', post)">
                    <el-avatar :size="28" :src="resolveAvatar(post.avatar)" class="user-avatar">
                        {{ post.nickName?.charAt(0).toUpperCase() || 'U' }}
                    </el-avatar>
                    <span class="user-name">{{ post.nickName || '未知用户' }}</span>
                </div>

                <div class="footer-actions">
                    <el-tooltip content="二维码" placement="top" v-if="isVideoPost">
                        <div class="action-item" @click.stop="emit('qrcode', post)">
                            <Icon icon="mdi:qrcode" />
                        </div>
                    </el-tooltip>
                    <div class="action-item like-btn" :class="{ active: post.isLiked }" @click.stop="emit('like', post)">
                        <div class="icon-anim-wrapper">
                            <Icon :icon="post.isLiked ? 'mdi:heart' : 'mdi:heart-outline'" />
                        </div>
                        <span class="count" v-if="post.likeCount">{{ post.likeCount }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsContentPostInfoComponentsFeedItem' })
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { POST_TYPE } from '@/utils/enum'
import { parseMediaRaw, parseMediaUrls, resolveMediaUrl as resolveCommonMediaUrl } from '@/utils/content/common'

const props = defineProps<{
    post: any
    checked?: boolean
    batchMode?: boolean
    isAdmin?: boolean
}>()

const emit = defineEmits<{
    (e: 'select', value: boolean): void
    (e: 'delete', id: number | string): void
    (e: 'edit-tag', post: any): void
    (e: 'pin', post: any): void
    (e: 'unpin', post: any): void
    (e: 'preview', post: any): void
    (e: 'prewarm-video', src: string): void
    (e: 'view-profile', post: any): void
    (e: 'like', post: any): void
    (e: 'qrcode', post: any): void
}>()

const post = computed(() => props.post || {})
const currentPostId = computed(() => props.post?.id ?? props.post?.postId ?? '')
const isBatchMode = computed(() => Boolean(props.batchMode))
const isAdmin = computed(() => props.isAdmin === true)
const hoverVideoRef = ref<HTMLVideoElement | null>(null)
const shouldRenderHoverVideo = ref(false)
const isVideoHoverActive = ref(false)
const isVideoHoverPlaying = ref(false)
const isOriginalMissing = computed(() => {
    const originalPostId = Number(props.post?.originalPostId ?? 0)
    return originalPostId > 0 && props.post?.originalPost === null
})
const postType = computed(() => String(props.post?.postType ?? ''))
const isVideoPost = computed(() => postType.value === POST_TYPE.VIDEO)
const isTextPost = computed(() => postType.value === POST_TYPE.TEXT)
const textCoverText = computed(() => String(props.post?.content ?? '').trim() || '暂无文字')

const TYPE_CONFIG: Record<string, { text: string; icon: string }> = {
    [POST_TYPE.TEXT]: { text: '文字', icon: 'mdi:format-text' },
    [POST_TYPE.IMAGE]: { text: '图文', icon: 'mdi:image-outline' },
    [POST_TYPE.VIDEO]: { text: '视频', icon: 'mdi:video-outline' }
}

const typeText = computed(() => TYPE_CONFIG[postType.value]?.text || '未知')
const typeIcon = computed(() => TYPE_CONFIG[postType.value]?.icon || 'mdi:help-circle-outline')

const mediaSource = computed(() => {
    const p = props.post
    return p?.mediaUrls || p?.originalPost?.mediaUrls || p?.files || p?.originalPost?.files
})

const mediaRawList = computed(() => {
    return parseMediaRaw(mediaSource.value)
})

const mediaFiles = computed(() => parseMediaUrls(mediaSource.value))

const resolveMediaUrl = (url: string) => resolveCommonMediaUrl(url)

const resolveAvatar = (avatar: string) => resolveMediaUrl(avatar)

const isVideoUrl = (url: string) => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url || '')

const coverUrl = computed(() => {
    const p = props.post
    const direct = p?.cover ?? p?.coverUrl ?? p?.thumbnail ?? p?.poster ?? p?.image
    if (direct) return resolveMediaUrl(direct)

    const candidates = mediaRawList.value
        .map((item: any) => (typeof item === 'object' ? item.cover || item.thumbnail || item.poster || item.url : item))
        .filter(Boolean)
    const img = candidates.find(u => !isVideoUrl(u))
    if (img) return resolveMediaUrl(img)
    if (!isVideoPost.value && candidates[0]) return resolveMediaUrl(candidates[0])
    return ''
})

const videoPreviewSrc = computed(() => {
    if (!isVideoPost.value) return ''
    const p = props.post || {}
    const directList = [
        p?.videoUrl,
        p?.video,
        p?.url,
        p?.src,
        p?.fileUrl,
        p?.originalPost?.videoUrl,
        p?.originalPost?.video,
        p?.originalPost?.url,
        p?.originalPost?.src,
        p?.originalPost?.fileUrl
    ]
        .map((item: unknown) => resolveMediaUrl(String(item || '').trim()))
        .filter(Boolean)

    const directVideo = directList.find(isVideoUrl)
    if (directVideo) return directVideo
    if (directList[0]) return directList[0]

    const list = mediaFiles.value.map(resolveMediaUrl).filter(Boolean)
    return list.find(isVideoUrl) || list[0] || ''
})
const activeHoverVideoSrc = computed(() => (shouldRenderHoverVideo.value ? videoPreviewSrc.value : ''))
const canHoverPlayPreview = computed(() => isVideoPost.value && Boolean(videoPreviewSrc.value) && !isBatchMode.value)
const canPreview = computed(() => isTextPost.value || Boolean(coverUrl.value || mediaFiles.value.length || videoPreviewSrc.value))

const handleMediaClick = () => {
    stopHoverPreview()
    if (isVideoPost.value && videoPreviewSrc.value) {
        emit('prewarm-video', videoPreviewSrc.value)
    }
    if (isBatchMode.value) {
        emit('select', !props.checked)
    } else if (canPreview.value) {
        emit('preview', props.post)
    }
}

const handleCheckboxChange = (value: boolean) => {
    emit('select', value)
}

const handleTogglePin = () => {
    if (post.value?.isTop) {
        emit('unpin', post.value)
        return
    }
    emit('pin', post.value)
}

const stopHoverPreview = () => {
    const video = hoverVideoRef.value
    if (video) {
        video.pause()
        try {
            video.currentTime = 0
        } catch {
            // Ignore seek failures for unready media.
        }
    }
    isVideoHoverActive.value = false
    isVideoHoverPlaying.value = false
    shouldRenderHoverVideo.value = false
}

const handleMediaMouseEnter = async () => {
    if (!canHoverPlayPreview.value) return
    emit('prewarm-video', videoPreviewSrc.value)
    shouldRenderHoverVideo.value = true
    await nextTick()
    const video = hoverVideoRef.value
    if (!video) return
    isVideoHoverActive.value = true
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.preload = 'auto'
    video.load()

    try {
        await video.play()
        isVideoHoverPlaying.value = true
    } catch {
        isVideoHoverPlaying.value = false
    }
}

const handleMediaMouseLeave = () => {
    stopHoverPreview()
}

watch(
    () => [videoPreviewSrc.value, isBatchMode.value] as const,
    () => {
        stopHoverPreview()
    }
)

onBeforeUnmount(() => {
    stopHoverPreview()
})
</script>

<style scoped lang="scss">
.feed-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    border-radius: 18px;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--el-color-black) 4%, transparent);
    border: 1px solid var(--el-border-color-lighter);
    transition:
        border-color 0.24s cubic-bezier(0.2, 0, 0.2, 1),
        box-shadow 0.24s cubic-bezier(0.2, 0, 0.2, 1),
        background-color 0.24s cubic-bezier(0.2, 0, 0.2, 1);
    overflow: hidden;
    height: 100%;

    &:hover {
        transform: none;
        box-shadow: 0 6px 20px color-mix(in srgb, var(--el-color-black) 7%, transparent);
        border-color: var(--el-border-color);
        background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-fill-color-light));
    }

    &.checked {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
    }
}

.card-media-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 9 / 14;
    background: var(--el-fill-color-lighter);
    overflow: hidden;
    cursor: default;

    &.is-clickable {
        cursor: pointer;
    }
}

.media-top-bar {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    z-index: 12;
}

.type-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: color-mix(in srgb, var(--el-color-black) 35%, transparent);
    color: var(--el-color-white);
    backdrop-filter: blur(4px);

    .tag-icon {
        font-size: 12px;
    }

    &[data-type='1'] {
        background: color-mix(in srgb, var(--el-color-primary) 78%, transparent);
    }
    &[data-type='2'] {
        background: color-mix(in srgb, var(--el-color-success) 78%, transparent);
    }
    &[data-type='3'] {
        background: color-mix(in srgb, var(--el-color-warning) 78%, transparent);
    }
}

.media-image {
    width: 100%;
    height: 100%;
    display: block;
    transition: transform 0.24s cubic-bezier(0.2, 0, 0.2, 1);
}

.card-media-wrapper:hover .media-image {
    transform: scale(1.012);
}

.media-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transform: scale(1.02);
    transition:
        opacity 0.22s ease,
        transform 0.28s ease;
    pointer-events: none;
    z-index: 4;
    background: var(--el-color-black);

    &.is-active {
        opacity: 0.88;
        transform: scale(1.01);
    }

    &.is-playing {
        opacity: 1;
        transform: scale(1);
    }
}

.hover-preview-badge {
    position: absolute;
    right: 10px;
    bottom: 10px;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--el-color-black) 48%, transparent);
    color: var(--el-color-white);
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-black) 18%, transparent);
    pointer-events: none;

    .badge-icon {
        font-size: 13px;
    }
}

.image-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 24px;

    .spin-icon {
        animation: spin 1s linear infinite;
    }
}

.media-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--el-text-color-disabled);
    font-size: 32px;
    background: var(--el-fill-color-light);
}

.text-cover {
    --admin-text-cover-color: color-mix(in srgb, var(--el-text-color-primary) 88%, #2c3e50);
    --admin-text-cover-muted: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
    --admin-text-cover-accent: color-mix(in srgb, var(--el-text-color-primary) 14%, transparent);

    width: 100%;
    height: 100%;
    padding: 28px 24px;
    background:
        radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--el-color-white) 82%, transparent), transparent 30%),
        radial-gradient(circle at 82% 78%, color-mix(in srgb, var(--el-fill-color-darker) 36%, transparent), transparent 34%),
        linear-gradient(135deg, var(--el-fill-color-extra-light) 0%, var(--el-fill-color-light) 100%);
    color: var(--admin-text-cover-color);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    isolation: isolate;
}

.text-cover::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
        linear-gradient(160deg, color-mix(in srgb, var(--el-color-white) 24%, transparent) 0%, transparent 46%),
        radial-gradient(circle at 50% 52%, color-mix(in srgb, var(--el-color-white) 28%, transparent), transparent 40%);
}

.text-cover .text-wrap {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    width: 100%;
    max-width: 184px;
    min-height: 42%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    transform: translate(-50%, -50%);
}

.text-cover .text-value {
    width: 100%;
    font-size: 18px;
    line-height: 1.65;
    font-weight: 600;
    text-align: center;
    color: var(--admin-text-cover-color);
    text-shadow: none;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
}

.text-cover .text-cover-quote {
    position: absolute;
    left: 50%;
    top: 44%;
    z-index: 0;
    color: var(--admin-text-cover-muted);
    font-size: 112px;
    pointer-events: none;
    transform: translate(-50%, -50%);
}

.text-cover .text-cover-accent {
    position: absolute;
    left: 50%;
    bottom: 20px;
    z-index: 1;
    width: 34px;
    height: 4px;
    border-radius: 999px;
    background: var(--admin-text-cover-accent);
    transform: translateX(-50%);
}

.play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--el-color-black) 20%, transparent);
    pointer-events: none;
    z-index: 5;
    transition: opacity 0.2s ease;

    &.is-hidden {
        opacity: 0;
    }

    .play-button {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--el-color-white) 90%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        color: color-mix(in srgb, var(--el-color-primary) 78%, var(--el-color-black));
        font-size: 26px;
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-black) 20%, transparent);
        backdrop-filter: blur(4px);
    }
}

.admin-toolbar {
    display: flex;
    gap: 6px;
    z-index: 12;

    .tool-btn {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--el-color-white) 90%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        color: color-mix(in srgb, var(--el-color-black) 65%, var(--el-text-color-primary));
        cursor: pointer;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 12%, transparent);
        font-size: 14px;
        transition:
            background-color var(--app-motion-fast),
            color var(--app-motion-fast),
            box-shadow var(--app-motion-fast);

        &:hover {
            background: var(--el-color-white);
            color: var(--el-color-primary);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
        }

        &.active {
            background: var(--el-color-primary);
            color: var(--el-color-white);
        }

        &.danger:hover {
            color: var(--el-color-danger);
        }
    }
}

.batch-select-layer {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--el-color-white) 15%, transparent);
    display: flex;
    padding: 12px;
    cursor: pointer;

    .checkbox-circle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid var(--el-color-white);
        background: color-mix(in srgb, var(--el-color-black) 40%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-color-white);
        font-size: 16px;
        box-shadow: 0 2px 4px color-mix(in srgb, var(--el-color-black) 20%, transparent);
        transition:
            background-color var(--app-motion-fast),
            border-color var(--app-motion-fast),
            color var(--app-motion-fast);

        &.active {
            background: var(--el-color-primary);
            border-color: var(--el-color-primary);
        }
    }
}

.card-bottom {
    flex: 1;
    background: color-mix(in srgb, var(--el-fill-color-light) 70%, var(--el-color-white));
    border-top: 1px solid var(--el-border-color-extra-light);
    padding: 12px 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .content-text {
        font-size: 13px;
        line-height: 1.5;
        color: var(--el-text-color-regular);
        display: -webkit-box;
        -webkit-line-clamp: 1;
        line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-all;

        &.is-empty {
            color: var(--el-text-color-placeholder);
            font-style: italic;
            font-size: 12px;
        }
    }
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    .footer-user {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        cursor: pointer;

        .user-avatar {
            border: 1px solid var(--el-border-color);
            flex-shrink: 0;
        }

        .user-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .footer-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    .action-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 1px solid var(--el-border-color);
        background: transparent;
        color: var(--el-text-color-secondary);
        cursor: pointer;
        transition:
            background-color var(--app-motion-fast),
            border-color var(--app-motion-fast),
            color var(--app-motion-fast);
        font-size: 13px;

        &:hover {
            border-color: var(--el-text-color-secondary);
            background: transparent;
            color: var(--el-text-color-primary);
        }

        &.like-btn {
            width: auto;
            min-width: 32px;
            padding: 0 8px;
            border-radius: 999px;
            gap: 4px;
            font-size: 15px;

            &:hover {
                color: var(--el-color-danger);
                border-color: color-mix(in srgb, var(--el-color-danger) 55%, var(--el-border-color));
                background: transparent;
            }

            &.active {
                color: var(--el-color-danger);
                border-color: color-mix(in srgb, var(--el-color-danger) 55%, var(--el-border-color));

                .icon-anim-wrapper {
                    animation: heart-bounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            }

            .count {
                font-size: 11px;
                font-weight: 600;
                line-height: 1;
            }

            .icon-anim-wrapper {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                line-height: 1;
            }
        }
    }
}

@keyframes heart-bounce {
    0% {
        transform: scale(1);
    }
    40% {
        transform: scale(1.4);
    }
    100% {
        transform: scale(1);
    }
}

.preview-badge-fade-enter-active,
.preview-badge-fade-leave-active {
    transition:
        opacity 0.18s ease,
        transform 0.22s ease;
}

.preview-badge-fade-enter-from,
.preview-badge-fade-leave-to {
    opacity: 0;
    transform: translateY(4px);
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

:global(html.dark) .feed-card {
    .play-overlay {
        .play-button {
            background: color-mix(in srgb, var(--el-color-white) 92%, transparent);
            color: color-mix(in srgb, var(--el-color-primary) 75%, var(--el-color-black));
            box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-black) 28%, transparent);
        }
    }

    .admin-toolbar {
        .tool-btn {
            background: color-mix(in srgb, var(--el-color-white) 88%, transparent);
            color: color-mix(in srgb, var(--el-color-black) 78%, var(--el-text-color-primary));
            box-shadow: 0 2px 10px color-mix(in srgb, var(--el-color-black) 24%, transparent);

            &:hover {
                background: var(--el-color-white);
            }
        }
    }
}
</style>
