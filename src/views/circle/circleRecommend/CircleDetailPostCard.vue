<template>
    <div class="social-card">
        <div class="card-header">
            <div class="user-meta">
                <el-avatar :size="44" :src="getImgUrl(post.authorAvatar || '')" class="user-avatar">
                    {{ post.authorName?.charAt(0) }}
                </el-avatar>
                <div class="meta-content">
                    <div class="user-name-row">
                        <span class="user-name">{{ post.authorName }}</span>
                        <span v-if="post.isTop" class="badge-top">
                            <Icon icon="mdi:pin" class="badge-icon" />
                            置顶
                        </span>
                    </div>
                </div>
            </div>
            <div class="header-more">
                <Icon icon="mdi:dots-horizontal" class="more-icon" />
            </div>
        </div>

        <div class="card-body">
            <div class="text-content">
                <h3 v-if="post.title" class="post-title">{{ post.title }}</h3>
                <p v-if="post.content" class="post-desc">{{ post.content }}</p>
            </div>

            <div v-if="hasVideo" class="media-video-wrapper">
                <div
                    ref="shellRef"
                    class="video-container"
                    @mouseenter="setControlsVisible(true)"
                    @mouseleave="setControlsVisible(false)"
                    @mousemove="handleFullscreenPointerMove"
                >
                    <video
                        v-if="videoSrc"
                        ref="videoRef"
                        class="html-video"
                        :src="videoSrc"
                        playsinline
                        preload="metadata"
                        @enterpictureinpicture="handleEnterPip"
                        @leavepictureinpicture="handleLeavePip"
                        @loadedmetadata="handleLoaded"
                        @timeupdate="handleTimeUpdate"
                        @progress="handleProgress"
                        @play="handlePlay"
                        @pause="handlePause"
                        @ended="handleEnded"
                    />

                    <div v-if="!videoState.playing" class="center-play-trigger" @click="togglePlay">
                        <div class="play-circle">
                            <Icon icon="mdi:play" />
                        </div>
                    </div>

                    <div class="video-control-bar" :class="{ 'is-visible': controlsVisible }">
                        <div class="progress-track-wrapper">
                            <input
                                class="seek-slider"
                                type="range"
                                min="0"
                                :max="Math.max(videoState.duration, 0)"
                                :step="0.1"
                                :value="videoState.currentTime"
                                @mousedown="startSeek"
                                @touchstart="startSeek"
                                @input="handleSeek"
                                @change="stopSeek"
                            />
                            <div
                                class="progress-fill"
                                :style="{ width: (videoState.currentTime / videoState.duration) * 100 + '%' }"
                            ></div>
                        </div>

                        <div class="controls-actions">
                            <div class="left-actions">
                                <button class="icon-btn" type="button" @click="togglePlay">
                                    <Icon :icon="videoState.playing ? 'mdi:pause' : 'mdi:play'" />
                                </button>
                                <div class="time-label">
                                    {{ formatVideoTime(videoState.currentTime) }} / {{ formatVideoTime(videoState.duration) }}
                                </div>
                            </div>

                            <div class="right-actions">
                                <div class="speed-selector">
                                    <button class="text-btn" type="button" @click.stop="toggleRateMenu">
                                        {{ formatRateLabel(videoState.rate) }}
                                    </button>
                                    <div v-if="videoState.showRateMenu" class="speed-menu">
                                        <button
                                            v-for="rate in rateOptions"
                                            :key="rate"
                                            class="speed-item"
                                            :class="{ 'is-selected': videoState.rate === rate }"
                                            @click="setPlaybackRate(rate)"
                                        >
                                            {{ formatRateLabel(rate) }}
                                        </button>
                                    </div>
                                </div>

                                <button class="icon-btn" type="button" @click="togglePictureInPicture">
                                    <Icon :icon="videoState.isPip ? 'mdi:picture-in-picture-exit' : 'mdi:picture-in-picture-bottom-right'" />
                                </button>

                                <button class="icon-btn" type="button" @click="toggleFullscreen">
                                    <Icon :icon="videoState.isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
                                </button>

                                <div class="volume-control">
                                    <button class="icon-btn" type="button" @click="toggleMute">
                                        <Icon :icon="videoState.muted || videoState.volume === 0 ? 'mdi:volume-off' : 'mdi:volume-high'" />
                                    </button>
                                    <div class="volume-slider-box">
                                        <input
                                            class="volume-slider"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            :value="videoState.volume"
                                            @input="handleVolume"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="post.images?.length" class="media-grid" :class="`grid-${Math.min(post.images.length, 4)}`">
                <div v-for="(img, idx) in post.images.slice(0, 4)" :key="idx" class="grid-item">
                    <el-image
                        :src="getImgUrl(img)"
                        fit="cover"
                        class="grid-img"
                        :preview-src-list="previewList"
                        :initial-index="idx"
                        :preview-teleported="true"
                        :infinite="false"
                        :z-index="previewZIndex"
                        loading="lazy"
                        hide-on-click-modal
                    >
                        <template #progress="{ activeIndex, total }">
                            <div class="viewer-indicator">{{ activeIndex + 1 }} / {{ total }}</div>
                        </template>
                    </el-image>
                    <div v-if="idx === 3 && post.images.length > 4" class="more-overlay">
                        <span>+{{ post.images.length - 4 }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="card-footer">
            <div class="post-time">发布于 {{ formatPostTime(post.updateTime || post.createTime) }}</div>
            <div class="interaction-bar">
                <button class="action-btn like-btn" :class="{ active: isLiked }" @click="handleLike">
                    <Icon :icon="isLiked ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'" />
                    <span>{{ post.likeCount || '赞同' }}</span>
                </button>

                <button class="action-btn comment-btn" @click="handleComment">
                    <Icon icon="mdi:comment-outline" />
                    <span>{{ post.commentCount ? formatActionCount(post.commentCount, '条评论') : '添加评论' }}</span>
                </button>

                <button class="action-btn share-btn" @click="handleShare">
                    <Icon icon="mdi:share-variant-outline" />
                    <span>分享</span>
                </button>

                <button class="action-btn star-btn" :class="{ active: isCollected }" @click="handleCollect">
                    <Icon :icon="isCollected ? 'mdi:star' : 'mdi:star-outline'" />
                    <span>收藏</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { PostItem } from './types'

const props = defineProps<{
    post: PostItem
    getImgUrl: (url: string) => string
    formatActionCount: (num?: number, suffix?: string) => string
}>()

const emit = defineEmits<{
    (e: 'like', post: PostItem): void
    (e: 'comment', post: PostItem): void
    (e: 'share', post: PostItem): void
    (e: 'collect', post: PostItem): void
}>()

const post = computed(() => props.post)
const previewZIndex = 4000

const videoSrc = computed(() => (post.value?.videoUrl ? props.getImgUrl(post.value.videoUrl) : ''))
const hasVideo = computed(() => Boolean(videoSrc.value))
const previewList = computed(() => (post.value.images || []).map(img => props.getImgUrl(img)))

const isLiked = computed(() => Boolean(post.value.isLiked ?? post.value.like))
const isCollected = computed(() => Boolean(post.value.isCollected ?? post.value.bookmark))

const handleLike = () => emit('like', post.value)
const handleComment = () => emit('comment', post.value)
const handleShare = () => emit('share', post.value)
const handleCollect = () => emit('collect', post.value)

const formatPostTime = (time?: string) => {
    if (!time) return ''
    const date = new Date(time)
    if (Number.isNaN(date.getTime())) return String(time)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
}

interface VideoState {
    playing: boolean
    muted: boolean
    volume: number
    currentTime: number
    duration: number
    buffered: number
    rate: number
    showControls: boolean
    showRateMenu: boolean
    seeking: boolean
    isFullscreen: boolean
    isPip: boolean
}

const rateOptions = [0.5, 1, 1.25, 1.5, 2]
const videoRef = ref<HTMLVideoElement | null>(null)
const shellRef = ref<HTMLDivElement | null>(null)
const fullscreenHideTimer = ref<number | null>(null)
const videoState = reactive<VideoState>({
    playing: false,
    muted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    rate: 1,
    showControls: false,
    showRateMenu: false,
    seeking: false,
    isFullscreen: false,
    isPip: false
})

const controlsVisible = computed(() => videoState.showControls || !videoState.playing)

const setControlsVisible = (visible: boolean) => {
    videoState.showControls = visible
    if (!visible) {
        videoState.showRateMenu = false
    }
}

const handleLoaded = () => {
    const video = videoRef.value
    if (!video) return
    videoState.duration = Number.isFinite(video.duration) ? video.duration : 0
    videoState.volume = video.volume
    videoState.muted = video.muted
    videoState.rate = video.playbackRate || 1
}

const handleTimeUpdate = () => {
    const video = videoRef.value
    if (!video) return
    if (!videoState.seeking) videoState.currentTime = video.currentTime
}

const handleProgress = () => {
    const video = videoRef.value
    if (!video || !video.buffered?.length) return
    const end = video.buffered.end(video.buffered.length - 1)
    videoState.buffered = Math.min(end, videoState.duration || end)
}

const handlePlay = () => {
    videoState.playing = true
    if (videoState.isFullscreen) {
        videoState.showControls = true
        scheduleFullscreenHide()
    }
}

const handlePause = () => {
    videoState.playing = false
    clearFullscreenHide()
    videoState.showControls = true
}

const handleEnded = () => {
    videoState.playing = false
    clearFullscreenHide()
    videoState.showControls = true
}

const togglePlay = async () => {
    const video = videoRef.value
    if (!video) return
    if (video.paused) {
        try {
            await video.play()
            videoState.playing = true
        } catch {
            videoState.playing = false
        }
    } else {
        video.pause()
        videoState.playing = false
    }
}

const startSeek = () => {
    videoState.seeking = true
}

const stopSeek = () => {
    videoState.seeking = false
}

const handleSeek = (event: Event) => {
    const target = event.target as HTMLInputElement | null
    const video = videoRef.value
    if (!target || !video) return
    const nextTime = Number(target.value)
    if (!Number.isNaN(nextTime)) {
        video.currentTime = nextTime
        videoState.currentTime = nextTime
    }
}

const toggleMute = () => {
    const video = videoRef.value
    if (!video) return
    video.muted = !video.muted
    videoState.muted = video.muted
}

const handleVolume = (event: Event) => {
    const target = event.target as HTMLInputElement | null
    const video = videoRef.value
    if (!target || !video) return
    const nextVolume = Number(target.value)
    if (Number.isNaN(nextVolume)) return
    video.volume = Math.min(1, Math.max(0, nextVolume))
    videoState.volume = video.volume
    if (video.volume > 0 && videoState.muted) {
        video.muted = false
        videoState.muted = false
    }
}

const toggleRateMenu = () => {
    videoState.showRateMenu = !videoState.showRateMenu
}

const setPlaybackRate = (rate: number) => {
    const video = videoRef.value
    if (video) video.playbackRate = rate
    videoState.rate = rate
    videoState.showRateMenu = false
}

const formatRateLabel = (rate: number) => (rate === 1 ? '1.0x' : `${rate}x`)

const formatVideoTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '00:00'
    const total = Math.floor(value)
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const seconds = total % 60
    const pad = (num: number) => String(num).padStart(2, '0')
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    return `${pad(minutes)}:${pad(seconds)}`
}

const handleEnterPip = () => {
    videoState.isPip = true
}

const handleLeavePip = () => {
    videoState.isPip = false
}

const togglePictureInPicture = async () => {
    const video = videoRef.value
    if (!video || !(document as any).pictureInPictureEnabled) return
    try {
        if (videoState.isPip) {
            await (document as any).exitPictureInPicture?.()
            videoState.isPip = false
        } else {
            await (video as any).requestPictureInPicture?.()
            videoState.isPip = true
        }
    } catch {}
}

const clearFullscreenHide = () => {
    if (!fullscreenHideTimer.value) return
    clearTimeout(fullscreenHideTimer.value)
    fullscreenHideTimer.value = null
}

const scheduleFullscreenHide = () => {
    if (!videoState.isFullscreen || !videoState.playing) return
    clearFullscreenHide()
    fullscreenHideTimer.value = window.setTimeout(() => {
        setControlsVisible(false)
    }, 2000)
}

const handleFullscreenPointerMove = () => {
    if (!videoState.isFullscreen) return
    videoState.showControls = true
    scheduleFullscreenHide()
}

const updateFullscreenState = () => {
    const fullscreenEl = document.fullscreenElement as HTMLElement | null
    const isNowFullscreen = fullscreenEl === shellRef.value
    videoState.isFullscreen = isNowFullscreen
    if (isNowFullscreen) {
        videoState.showControls = true
        scheduleFullscreenHide()
    } else {
        clearFullscreenHide()
        videoState.showControls = true
        videoState.showRateMenu = false
    }
}

const toggleFullscreen = async () => {
    const shell = shellRef.value
    if (!shell) return
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen()
        } else {
            await shell.requestFullscreen()
        }
    } catch {}
    updateFullscreenState()
}

onMounted(() => {
    document.addEventListener('fullscreenchange', updateFullscreenState)
})

onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', updateFullscreenState)
    clearFullscreenHide()
    const video = videoRef.value
    if (video) {
        try {
            video.pause()
        } catch {}
    }
})
</script>

<style scoped lang="scss">
.social-card {
    background: var(--el-bg-color);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px color-mix(in srgb, var(--el-color-black) 4%, transparent);
    border: 1px solid var(--el-border-color-lighter);
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px color-mix(in srgb, var(--el-color-black) 6%, transparent);
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .user-meta {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-avatar {
        flex-shrink: 0;
        border: 2px solid var(--el-bg-color);
        box-shadow: 0 0 0 1px var(--el-border-color-lighter);
    }

    .meta-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .user-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .user-name {
        font-size: 16px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.4;
    }

    .badge-top {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        background: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .post-meta-info {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    .header-more {
        color: var(--el-text-color-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: background 0.2s;

        &:hover {
            background: var(--el-fill-color);
            color: var(--el-text-color-primary);
        }

        .more-icon {
            font-size: 20px;
        }
    }
}

.card-body {
    margin-bottom: 16px;

    .text-content {
        margin-bottom: 16px;

        .post-title {
            font-size: 17px;
            font-weight: 700;
            margin: 0 0 8px;
            color: var(--el-text-color-primary);
            line-height: 1.5;
        }

        .post-desc {
            font-size: 15px;
            line-height: 1.7;
            color: var(--el-text-color-regular);
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
        }
    }
}

.media-grid {
    display: grid;
    gap: 8px;
    border-radius: 12px;
    overflow: hidden;
    max-width: 540px;

    &.grid-1 {
        grid-template-columns: 1fr;
        max-width: 420px;
    }
    &.grid-1 .grid-item {
        aspect-ratio: 4/3;
    }

    &.grid-2 {
        grid-template-columns: repeat(4, 1fr);
        max-width: 560px;
    }
    &.grid-2 .grid-item {
        aspect-ratio: 1;
    }

    &.grid-3 {
        grid-template-columns: repeat(4, 1fr);
        max-width: 560px;
    }
    &.grid-3 .grid-item {
        aspect-ratio: 1;
    }

    &.grid-4 {
        grid-template-columns: repeat(4, 1fr);
        max-width: 560px;
    }
    &.grid-4 .grid-item {
        aspect-ratio: 1;
    }

    .grid-item {
        position: relative;
        background: var(--el-fill-color-light);
        cursor: zoom-in;
        overflow: hidden;

        .grid-img {
            width: 100%;
            height: 100%;
            transition: transform 0.4s ease;

            &:hover {
                transform: scale(1.03);
            }
        }

        .more-overlay {
            position: absolute;
            inset: 0;
            background: color-mix(in srgb, var(--el-color-black) 50%, transparent);
            backdrop-filter: blur(2px);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-color-white);
            font-size: 24px;
            font-weight: 600;
            pointer-events: none;
        }
    }
}

.media-video-wrapper {
    border-radius: 12px;
    overflow: hidden;
    background: var(--el-color-black);
    max-width: 540px;

    .video-container {
        position: relative;
        width: 100%;
        background: var(--el-color-black);

        &:hover .center-play-trigger {
            opacity: 1;
        }
    }

    .html-video {
        width: 100%;
        display: block;
        max-height: 400px;
        background: var(--el-color-black);
    }

    .center-play-trigger {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.3s;

        .play-circle {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: color-mix(in srgb, var(--el-color-white) 20%, transparent);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-color-white);
            font-size: 32px;
            box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-black) 20%, transparent);
            transition: transform 0.2s;
        }

        &:hover .play-circle {
            transform: scale(1.1);
            background: color-mix(in srgb, var(--el-color-white) 30%, transparent);
        }
    }

    .video-control-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0 16px 16px;
        background: linear-gradient(to top, color-mix(in srgb, var(--el-color-black) 80%, transparent) 0%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;

        &.is-visible {
            opacity: 1;
            pointer-events: auto;
        }
    }
}

.progress-track-wrapper {
    position: relative;
    height: 4px;
    background: color-mix(in srgb, var(--el-color-white) 20%, transparent);
    border-radius: 2px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: height 0.2s;

    &:hover {
        height: 6px;
    }

    .seek-slider {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: 2;
        margin: 0;
    }

    .progress-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: var(--el-color-primary);
        border-radius: 2px;
        pointer-events: none;
    }
}

.controls-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .left-actions,
    .right-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .time-label {
        color: var(--el-text-color-regular);
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        font-weight: 500;
    }
}

.icon-btn,
.text-btn {
    background: transparent;
    border: none;
    color: var(--el-color-white);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    font-size: 20px;

    &:hover {
        background: color-mix(in srgb, var(--el-color-white) 15%, transparent);
    }
}

.text-btn {
    font-size: 13px;
    font-weight: 600;
    width: 40px;
}

.speed-selector {
    position: relative;

    .speed-menu {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: color-mix(in srgb, var(--el-color-black) 92%, transparent);
        border-radius: 8px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 8px;
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-black) 30%, transparent);

        .speed-item {
            background: transparent;
            border: none;
            color: var(--el-text-color-secondary);
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            border-radius: 4px;
            white-space: nowrap;

            &:hover {
                background: color-mix(in srgb, var(--el-color-white) 10%, transparent);
                color: var(--el-color-white);
            }

            &.is-selected {
                color: var(--el-color-primary);
                font-weight: bold;
            }
        }
    }
}

.volume-control {
    display: flex;
    align-items: center;
    position: relative;

    &:hover .volume-slider-box {
        width: 80px;
        opacity: 1;
        padding-left: 8px;
    }

    .volume-slider-box {
        width: 0;
        overflow: hidden;
        opacity: 0;
        transition: all 0.3s;
        display: flex;
        align-items: center;
    }

    .volume-slider {
        width: 100%;
        height: 4px;
        background: color-mix(in srgb, var(--el-color-white) 30%, transparent);
        border-radius: 2px;
        appearance: none;
        outline: none;

        &::-webkit-slider-thumb {
            appearance: none;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--el-color-white);
        }
    }
}

.post-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    margin-bottom: 10px;
}

.interaction-bar {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 14px;

    .action-btn {
        background: transparent;
        border: none;
        padding: 0;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--el-text-color-regular);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: color 0.2s ease;

        .iconify {
            font-size: 16px;
        }

        &:hover {
            color: var(--el-text-color-primary);
        }

        &.like-btn {
            padding: 6px 12px;
            border-radius: 8px;
            background: var(--el-color-primary-light-9);
            color: var(--el-color-primary);

            &:hover {
                color: var(--el-color-primary);
                background: var(--el-color-primary-light-8);
            }
        }

        &.like-btn.active {
            background: var(--el-color-primary-light-8);
            color: var(--el-color-primary);
        }

        &.star-btn.active {
            color: var(--el-color-warning);
        }

        &.comment-btn:hover {
            color: var(--el-color-primary);
        }
    }
}

.card-footer {
    padding-top: 12px;
    margin-top: 4px;
}

@keyframes pop {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.3);
    }
    100% {
        transform: scale(1);
    }
}

.viewer-indicator {
    position: fixed;
    background: color-mix(in srgb, var(--el-color-black) 60%, transparent);
    color: var(--el-color-white);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 14px;
    backdrop-filter: blur(4px);
    z-index: 4001;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    line-height: 1;
}
</style>
