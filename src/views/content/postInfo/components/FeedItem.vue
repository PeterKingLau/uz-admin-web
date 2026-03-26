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

                <div class="admin-toolbar">
                    <el-tooltip content="缂栬緫鏍囩" placement="bottom" :show-after="500">
                        <div class="tool-btn" @click="emit('edit-tag', post)">
                            <Icon icon="mdi:tag-outline" />
                        </div>
                    </el-tooltip>
                    <el-tooltip :content="post.isTop ? '鍙栨秷缃《' : '缃《'" placement="bottom" :show-after="500">
                        <div class="tool-btn" :class="{ active: post.isTop }" @click="handleTogglePin">
                            <Icon :icon="post.isTop ? 'mdi:pin-off-outline' : 'mdi:pin-outline'" />
                        </div>
                    </el-tooltip>
                    <el-tooltip content="鍒犻櫎" placement="bottom" :show-after="500">
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

            <div v-if="isTextPost" class="text-cover" :style="textCoverStyle">
                <div class="text-content-inner" :class="textCoverSizeClass">
                    <span class="quote quote-start">鈥?/span>
                    <span class="text-value">{{ textCoverText }}</span>
                    <span class="quote quote-end">鈥?/span>
                </div>
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
                    <span>闈欓煶棰勮</span>
                </div>
            </transition>
        </div>

        <div class="card-bottom">
            <div class="content-text" :class="{ 'is-empty': !post.content }">
                {{ post.content || '鏃犳鏂囧唴瀹? }}
            </div>

            <div class="card-footer">
                <div class="footer-user" @click.stop="emit('view-profile', post)">
                    <el-avatar :size="28" :src="resolveAvatar(post.avatar)" class="user-avatar">
                        {{ post.nickName?.charAt(0).toUpperCase() || 'U' }}
                    </el-avatar>
                    <span class="user-name">{{ post.nickName || '鏈煡鐢ㄦ埛' }}</span>
                </div>

                <div class="footer-actions">
                    <el-tooltip content="浜岀淮鐮? placement="top" v-if="isVideoPost">
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

<script setup name="ViewsContentPostInfoComponentsFeedItem" lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { POST_TYPE } from '@/utils/enum'
import { resolveTextCoverPalette } from '@/utils/textCover'
import { parseMediaRaw, parseMediaUrls, resolveMediaUrl as resolveCommonMediaUrl } from '@/utils/content/common'

const props = defineProps<{
    post: any
    checked?: boolean
    batchMode?: boolean
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
const textCoverText = computed(() => String(props.post?.content ?? '').trim() || '鏆傛棤鏂囧瓧')
const textCoverCharCount = computed(() => Array.from(textCoverText.value).length)
const textCoverSizeClass = computed(() => {
    const count = textCoverCharCount.value
    if (count <= 8) return 'size-xl'
    if (count <= 20) return 'size-lg'
    if (count <= 40) return 'size-md'
    return 'size-sm'
})

const TYPE_CONFIG: Record<string, { text: string; icon: string }> = {
    [POST_TYPE.TEXT]: { text: '鏂囧瓧', icon: 'mdi:format-text' },
    [POST_TYPE.IMAGE]: { text: '鍥炬枃', icon: 'mdi:image-outline' },
    [POST_TYPE.VIDEO]: { text: '瑙嗛', icon: 'mdi:video-outline' }
}

const typeText = computed(() => TYPE_CONFIG[postType.value]?.text || '鏈煡')
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

const textCoverStyle = computed(() => {
    if (!isTextPost.value) return {}
    const palette = resolveTextCoverPalette(String(currentPostId.value || textCoverText.value))
    return {
        '--card-accent': palette.accent,
        '--card-bg-gradient': `linear-gradient(135deg, ${palette.bg}, ${palette.accent}40)`
    } as Record<string, string>
})

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
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
    height: 100%;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 28px color-mix(in srgb, var(--el-color-black) 8%, transparent);
        border-color: var(--el-border-color);
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
    transition: transform 0.3s ease;
}

.card-media-wrapper:hover .media-image {
    transform: scale(1.03);
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
    width: 100%;
    height: 100%;
    padding: 0;
    background: var(--card-bg-gradient);
    color: var(--el-color-white);
    display: block;
    position: relative;
    text-shadow: 0 2px 4px color-mix(in srgb, var(--el-color-black) 10%, transparent);
    overflow: hidden;

    .text-content-inner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 86%;
        padding: 7% 9%;
        text-align: center;
        position: relative;

        .text-value {
            font-size: clamp(15px, 5.2%, 22px);
            line-height: 1.52;
            font-weight: 600;
            text-align: center;
            display: -webkit-box;
            -webkit-line-clamp: 6;
            line-clamp: 6;
            -webkit-box-orient: vertical;
            overflow: hidden;
            word-break: break-word;
        }

        .quote {
            position: absolute;
            font-size: clamp(32px, 11%, 56px);
            line-height: 1;
            opacity: 0.62;
            font-family: serif;
            pointer-events: none;
        }

        .quote-start {
            top: 0;
            left: 0;
            transform: translate(-20%, -10%);
        }

        .quote-end {
            right: 0;
            bottom: 0;
            transform: translate(20%, 10%);
        }

        &.size-xl {
            .text-value {
                font-size: clamp(28px, 9.8%, 44px);
                line-height: 1.28;
                font-weight: 700;
            }
        }

        &.size-lg {
            .text-value {
                font-size: clamp(22px, 8%, 34px);
                line-height: 1.34;
                font-weight: 680;
            }
        }

        &.size-md {
            .text-value {
                font-size: clamp(17px, 6.2%, 26px);
                line-height: 1.42;
            }
        }

        &.size-sm {
            .text-value {
                font-size: clamp(14px, 4.8%, 18px);
                line-height: 1.55;
            }
        }
    }
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
        transition: all 0.2s;

        &:hover {
            background: var(--el-color-white);
            color: var(--el-color-primary);
            transform: scale(1.04);
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
        transition: all 0.2s;

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
        transition: all 0.2s;
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


