<template>
    <div class="social-card">
        <div class="card-header">
            <div class="user-meta">
                <div class="avatar-wrapper">
                    <el-avatar :size="48" :src="getImgUrl(post.authorAvatar || '')" class="user-avatar">
                        {{ post.authorName?.charAt(0) }}
                    </el-avatar>
                </div>
                <div class="meta-content">
                    <div class="user-name-row">
                        <span class="user-name">{{ post.authorName }}</span>
                    </div>
                </div>
            </div>
            <div class="header-actions">
                <button class="more-btn">
                    <Icon icon="mdi:dots-horizontal" />
                </button>
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
                            <div class="hover-time-indicator" v-if="hoverTime > 0" :style="{ left: hoverPosition + '%' }">
                                {{ formatVideoTime(hoverTime) }}
                            </div>
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
                            <div class="progress-fill" :style="{ width: (videoState.currentTime / videoState.duration) * 100 + '%' }"></div>
                            <div class="progress-buffer" :style="{ width: (videoState.buffered / videoState.duration) * 100 + '%' }"></div>
                        </div>

                        <div class="controls-actions">
                            <div class="left-actions">
                                <button class="icon-btn play-pause-btn" type="button" @click="togglePlay">
                                    <Icon :icon="videoState.playing ? 'mdi:pause' : 'mdi:play'" />
                                </button>

                                <div class="volume-control" @mouseenter="setVolumePanelVisible(true)" @mouseleave="handleVolumeControlLeave">
                                    <button class="icon-btn volume-btn" type="button" @click="toggleMute">
                                        <Icon :icon="videoState.muted || videoState.volume === 0 ? 'mdi:volume-off' : 'mdi:volume-high'" />
                                    </button>
                                    <div class="volume-slider-box" :class="{ 'is-open': volumePanelOpen }">
                                        <div class="volume-track">
                                            <div class="volume-fill" :style="{ width: videoState.volume * 100 + '%' }"></div>
                                            <input
                                                class="volume-slider"
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                :value="videoState.volume"
                                                @input="handleVolume"
                                                @mousedown.stop="startVolumeAdjust"
                                                @touchstart.stop="startVolumeAdjust"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div class="time-label">{{ formatVideoTime(videoState.currentTime) }} / {{ formatVideoTime(videoState.duration) }}</div>
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="post.images?.length" class="media-grid">
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
            <div class="footer-left">
                <div v-if="postTime" class="post-time">发布于 {{ postTime }}</div>
                <div class="interaction-bar">
                    <button class="action-btn like-btn" :class="{ active: isLiked }" @click="handleLike">
                        <div class="btn-icon-wrapper">
                            <Icon :icon="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" />
                        </div>
                        <span class="btn-text">{{ post.likeCount || '点赞' }}</span>
                    </button>

                    <button class="action-btn comment-btn" @click="handleComment">
                        <div class="btn-icon-wrapper">
                            <Icon icon="mdi:comment-outline" />
                        </div>
                        <span class="btn-text">{{ post.commentCount ? `${post.commentCount}条评论` : '添加评论' }}</span>
                    </button>

                    <button class="action-btn share-btn" @click="handleShare">
                        <div class="btn-icon-wrapper">
                            <Icon icon="mdi:share-outline" />
                        </div>
                        <span class="btn-text">分享</span>
                    </button>
                </div>
            </div>

            <button class="bookmark-btn" :class="{ active: isCollected }" @click="handleCollect">
                <Icon :icon="isCollected ? 'mdi:bookmark' : 'mdi:bookmark-outline'" />
                <span class="bookmark-text">收藏</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { PostItem } from '@/types/circle'

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
const postTime = computed(() => formatPostTime(post.value?.updateTime || post.value?.createTime))
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
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
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
const volumePanelVisible = ref(false)
const volumeAdjusting = ref(false)
const hoverTime = ref(0)
const hoverPosition = ref(0)
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
const volumePanelOpen = computed(() => volumePanelVisible.value || volumeAdjusting.value)

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

const setVolumePanelVisible = (visible: boolean) => {
    volumePanelVisible.value = visible
}

const handleVolumeControlLeave = () => {
    if (volumeAdjusting.value) return
    volumePanelVisible.value = false
}

const stopVolumeAdjust = () => {
    volumeAdjusting.value = false
}

const startVolumeAdjust = () => {
    volumeAdjusting.value = true
    volumePanelVisible.value = true
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
    document.addEventListener('mouseup', stopVolumeAdjust)
    document.addEventListener('touchend', stopVolumeAdjust)
})

onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', updateFullscreenState)
    document.removeEventListener('mouseup', stopVolumeAdjust)
    document.removeEventListener('touchend', stopVolumeAdjust)
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
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    overflow: hidden;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1);
        border-color: var(--el-border-color);
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 18px;

    .user-meta {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .avatar-wrapper {
        position: relative;
        flex-shrink: 0;

        .user-avatar {
            border: 2px solid var(--el-bg-color);
            box-shadow: 0 0 0 1px var(--el-border-color-lighter);
            transition: transform 0.2s ease;
        }
    }

    .meta-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
    }

    .user-name {
        font-size: 16px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.3;
        letter-spacing: -0.01em;
    }

    .post-meta-info {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 1;
    }

    .header-actions {
        .more-btn {
            background: transparent;
            border: none;
            color: var(--el-text-color-placeholder);
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover {
                background: var(--el-fill-color-light);
                color: var(--el-text-color-primary);
            }
        }
    }
}

.card-body {
    margin-bottom: 20px;

    .text-content {
        margin-bottom: 16px;

        .post-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 8px;
            color: var(--el-text-color-primary);
            line-height: 1.4;
            letter-spacing: -0.01em;
        }

        .post-desc {
            font-size: 15px;
            line-height: 1.6;
            color: var(--el-text-color-regular);
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
        }
    }
}

.media-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;

    .grid-item {
        position: relative;
        background: var(--el-fill-color-light);
        cursor: zoom-in;
        overflow: hidden;
        aspect-ratio: 1;

        .grid-img {
            width: 100%;
            height: 100%;
            transition: transform 0.5s ease;
            object-fit: cover;
        }

        &:hover .grid-img {
            transform: scale(1.05);
        }

        .more-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 24px;
            font-weight: 600;
            opacity: 0;
            animation: fadeIn 0.3s forwards;
        }
    }
}

.media-video-wrapper {
    border-radius: 12px;
    overflow: hidden;
    background: #000;
    width: 100%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    .video-container {
        position: relative;
        width: 100%;
        padding-top: 56.25%;
        background: #000;

        .html-video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        &:hover .center-play-trigger {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }

    .center-play-trigger {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.95);
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.8;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: 10;

        .play-circle {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 32px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: background 0.2s;
        }

        &:hover .play-circle {
            background: rgba(255, 255, 255, 0.35);
        }
    }

    .video-control-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 40px 16px 12px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 20;

        &.is-visible {
            opacity: 1;
        }
    }
}

.progress-track-wrapper {
    position: relative;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    cursor: pointer;
    transition: height 0.2s;
    margin-bottom: 4px;

    &:hover {
        height: 6px;

        .seek-slider::-webkit-slider-thumb {
            transform: scale(1);
        }
    }

    .seek-slider {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: 5;
        margin: 0;

        &::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            transition: transform 0.2s;
            transform: scale(0);
        }
    }

    .progress-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: var(--el-color-primary);
        border-radius: 2px;
        pointer-events: none;
        z-index: 2;
    }

    .progress-buffer {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 2px;
        pointer-events: none;
        z-index: 1;
    }

    .hover-time-indicator {
        position: absolute;
        bottom: 12px;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        pointer-events: none;
    }
}

.controls-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #fff;

    .left-actions,
    .right-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .time-label {
        font-size: 12px;
        font-feature-settings: 'tnum';
        font-variant-numeric: tabular-nums;
        opacity: 0.9;
        margin-left: 8px;
        font-weight: 500;
    }
}

.icon-btn,
.text-btn {
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    font-size: 20px;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
    }
}

.text-btn {
    font-size: 13px;
    font-weight: 600;
    min-width: 32px;
}

.speed-selector {
    position: relative;

    .speed-menu {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 20, 20, 0.95);
        border-radius: 8px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        min-width: 60px;

        .speed-item {
            background: transparent;
            border: none;
            color: #ccc;
            padding: 6px 0;
            font-size: 12px;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s;

            &:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            &.is-selected {
                color: var(--el-color-primary);
                font-weight: 700;
            }
        }
    }
}

.volume-control {
    position: relative;
    display: flex;
    align-items: center;

    .volume-slider-box {
        width: 0;
        opacity: 0;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        margin-left: 4px;
        height: 24px;
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;

        &.is-open {
            width: 80px;
            opacity: 1;
            padding: 0 8px;
        }

        .volume-track {
            position: relative;
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
        }

        .volume-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: #fff;
            border-radius: 2px;
        }

        .volume-slider {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            margin: 0;
            opacity: 0;
            cursor: pointer;
        }
    }
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 16px;
    margin-top: 8px;
}

.footer-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
}

.post-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1;
}

.interaction-bar {
    display: flex;
    gap: 16px;

    .action-btn {
        background: transparent;
        border: none;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--el-text-color-regular);
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s ease;

        .btn-icon-wrapper {
            font-size: 20px;
            display: flex;
        }

        .btn-text {
            font-size: 14px;
            font-weight: 500;
        }

        &:hover {
            background: var(--el-fill-color);
            color: var(--el-text-color-primary);
        }

        &.like-btn:hover,
        &.like-btn.active {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.08);

            .btn-icon-wrapper {
                transform: scale(1.1);
                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
        }

        &.comment-btn:hover {
            color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
        }

        &.share-btn:hover {
            color: var(--el-color-success);
            background: var(--el-color-success-light-9);
        }
    }
}

.bookmark-btn {
    background: transparent;
    border: none;
    color: var(--el-text-color-secondary);
    font-size: 20px;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: var(--el-fill-color);
        color: var(--el-text-color-primary);
    }

    &.active {
        color: var(--el-color-warning);
    }
}

.bookmark-text {
    font-size: 14px;
    font-weight: 500;
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
}

@media screen and (max-width: 520px) {
    .social-card {
        padding: 16px;
    }
    .action-btn .btn-text {
        display: none;
    }
}
</style>
