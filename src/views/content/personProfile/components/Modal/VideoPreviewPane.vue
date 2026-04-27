<template>
    <div ref="paneRef" class="video-preview-pane" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
        <div class="player-shell" @click="togglePlay">
            <div class="player-bg" :style="bgStyle"></div>

            <video
                ref="playerRef"
                :src="src"
                :poster="poster || undefined"
                class="video-element"
                draggable="false"
                playsinline
                autoplay
                preload="auto"
                controlslist="nodownload noremoteplayback"
                @contextmenu.prevent.stop
                @dragstart.prevent
                @loadstart="onBufferStart"
                @loadeddata="onBufferReady"
                @loadedmetadata="onLoadedMeta"
                @canplay="onBufferReady"
                @playing="onBufferReady"
                @waiting="onBufferStart"
                @stalled="onBufferStart"
                @seeking="onBufferStart"
                @seeked="onBufferReady"
                @timeupdate="onTimeUpdate"
                @durationchange="onDurationChange"
                @play="onPlay"
                @pause="onPause"
                @click.stop="togglePlay"
            />

            <transition name="buffer-fade">
                <div v-if="isBuffering" class="buffer-overlay">
                    <div class="buffer-indicator">
                        <span class="buffer-spinner" aria-hidden="true"></span>
                        <span class="buffer-text">视频加载中</span>
                    </div>
                </div>
            </transition>

            <transition name="overlay-fade">
                <div v-if="showPauseOverlay" class="pause-overlay" @click.stop="togglePlay">
                    <Icon icon="mdi:play" class="pause-overlay-icon" />
                </div>
            </transition>

            <div class="top-bar" :class="{ 'hide-controls': !controlsVisible && isPlaying }">
                <div class="close-filler"></div>
            </div>

            <div class="bottom-progress-layer" :class="{ ready: hasDuration, 'hide-controls': hasDuration && !controlsVisible && isPlaying }">
                <div class="progress-container" @click.stop>
                    <el-slider
                        :model-value="progressShown"
                        :min="0"
                        :max="progressMax"
                        :step="0.1"
                        :show-tooltip="false"
                        class="progress-slider"
                        @update:modelValue="onProgressDrag"
                        @change="onProgressCommit"
                    />
                </div>
            </div>

            <div class="bottom-controls-layer" :class="{ ready: hasDuration, 'hide-controls': hasDuration && !controlsVisible && isPlaying }">
                <div class="controls-layer" @click.stop>
                    <div class="control-row">
                        <div class="left-controls">
                            <div class="play-btn" @click.stop="togglePlay">
                                <transition name="play-icon-swap" mode="out-in">
                                    <Icon :key="playControlIcon" :icon="playControlIcon" class="play-btn-icon" />
                                </transition>
                            </div>
                            <div class="time-display" :class="{ pending: !hasDuration }">
                                <span class="time-current">{{ displayCurrentTime }}</span>
                                <span class="sep">/</span>
                                <span class="time-total">{{ displayDuration }}</span>
                            </div>
                        </div>

                        <div class="right-controls">
                            <div
                                class="volume-control"
                                :class="{ expanded: volumePanelVisible }"
                                @mouseenter="volumePanelVisible = true"
                                @mouseleave="volumePanelVisible = false"
                            >
                                <div class="volume-btn" @click.stop="toggleMute">
                                    <Icon :icon="volumeIcon" />
                                </div>
                                <div class="volume-slider-wrapper">
                                    <el-slider
                                        v-model="volume"
                                        :min="0"
                                        :max="1"
                                        :step="0.01"
                                        :show-tooltip="false"
                                        class="volume-slider"
                                        @input="applyVolume"
                                    />
                                    <span class="volume-percent">{{ volumePercentText }}</span>
                                </div>
                            </div>

                            <div class="speed-control">
                                <div class="speed-trigger">
                                    <span class="speed-text">{{ playbackRate === 1 ? '倍速' : playbackRate + 'x' }}</span>
                                    <div class="speed-menu-wrapper">
                                        <div class="speed-menu">
                                            <div class="speed-options">
                                                <div
                                                    v-for="rate in rates"
                                                    :key="rate"
                                                    class="speed-item"
                                                    :class="{ active: playbackRate === rate }"
                                                    @click.stop="applyRate(rate)"
                                                >
                                                    {{ rate }}x
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="icon-btn" @click.stop="toggleFullscreen">
                                <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsContentPersonProfileComponentsModalVideoPreviewPane' })
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
    src: { type: String, required: true },
    poster: { type: String, default: '' }
})

const playerRef = ref<HTMLVideoElement | null>(null)
const paneRef = ref<HTMLElement | null>(null)
const isPlaying = ref(true)
const isBuffering = ref(true)
const hasDuration = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const progressDraft = ref<number | null>(null)
const muted = ref(false)
const volume = ref(1)
const previousVolume = ref(1)
const volumePanelVisible = ref(false)
const controlsVisible = ref(true)
const controlsTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const playbackRate = ref(1)
const isFullscreen = ref(false)
const rates = [0.75, 1, 1.25, 1.5, 2]

const bgStyle = computed(() => {
    const background = String(props.poster || '').trim()
    return background ? { backgroundImage: `url(${background})` } : {}
})

const progressMax = computed(() => Math.max(duration.value, 0))
const progressShown = computed(() => (progressDraft.value != null ? progressDraft.value : currentTime.value))
const displayCurrentTime = computed(() => formatClock(progressShown.value))
const displayDuration = computed(() => formatClock(duration.value))
const playControlIcon = computed(() => (isPlaying.value ? 'mdi:pause' : 'mdi:play'))
const showPauseOverlay = computed(() => !isPlaying.value)
const volumeIcon = computed(() => {
    if (muted.value || volume.value === 0) return 'mdi:volume-mute'
    if (volume.value < 0.5) return 'mdi:volume-low'
    return 'mdi:volume-high'
})
const volumePercentText = computed(() => `${Math.round((muted.value ? 0 : volume.value) * 100)}%`)

const clearControlsTimer = () => {
    if (!controlsTimer.value) return
    clearTimeout(controlsTimer.value)
    controlsTimer.value = null
}

const resetPlayerState = () => {
    isPlaying.value = false
    isBuffering.value = false
    hasDuration.value = false
    duration.value = 0
    currentTime.value = 0
    progressDraft.value = null
    volumePanelVisible.value = false
    controlsVisible.value = true
}

const releaseMediaElement = () => {
    clearControlsTimer()
    const el = playerRef.value
    if (!el) {
        resetPlayerState()
        return
    }
    try {
        el.pause()
        el.removeAttribute('src')
        el.load()
    } catch {
        // noop
    }
    resetPlayerState()
}

const exitLocalFullscreen = async () => {
    if (typeof document === 'undefined') return
    const fullscreenElement = document.fullscreenElement
    if (!fullscreenElement || !paneRef.value?.contains(fullscreenElement)) return
    try {
        await document.exitFullscreen()
    } catch {
        // noop
    }
    isFullscreen.value = false
}

const dispose = () => {
    releaseMediaElement()
    exitLocalFullscreen()
}

const scheduleHideControls = () => {
    clearControlsTimer()
    if (!isPlaying.value) return
    controlsTimer.value = setTimeout(() => {
        controlsVisible.value = false
    }, 1800)
}

const syncPlayback = async () => {
    await nextTick()
    const el = playerRef.value
    if (!el) return
    el.playbackRate = playbackRate.value
    el.muted = muted.value
    el.volume = muted.value ? 0 : volume.value
    try {
        isBuffering.value = el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
        await el.play()
        isPlaying.value = true
        scheduleHideControls()
    } catch {
        isBuffering.value = false
        isPlaying.value = false
        controlsVisible.value = true
    }
}

const formatClock = (value: number) => {
    const totalSeconds = Math.max(0, Math.floor(Number(value || 0)))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const togglePlay = async () => {
    const el = playerRef.value
    if (!el) return
    if (el.paused) {
        try {
            isBuffering.value = el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
            await el.play()
            isPlaying.value = true
            scheduleHideControls()
        } catch {
            isBuffering.value = false
            isPlaying.value = false
        }
        return
    }
    el.pause()
    isPlaying.value = false
    controlsVisible.value = true
    clearControlsTimer()
}

const onLoadedMeta = () => {
    const el = playerRef.value
    if (!el) return
    duration.value = Number(el.duration || 0)
    hasDuration.value = duration.value > 0
}

const onTimeUpdate = () => {
    const el = playerRef.value
    if (!el || progressDraft.value != null) return
    currentTime.value = Number(el.currentTime || 0)
}

const onDurationChange = () => {
    const el = playerRef.value
    if (!el) return
    duration.value = Number(el.duration || 0)
    hasDuration.value = duration.value > 0
}

const onBufferStart = () => {
    isBuffering.value = true
}

const onBufferReady = () => {
    isBuffering.value = false
}

const onPlay = () => {
    isPlaying.value = true
    scheduleHideControls()
}

const onPause = () => {
    isPlaying.value = false
    controlsVisible.value = true
    clearControlsTimer()
}

const onMouseMove = () => {
    controlsVisible.value = true
    scheduleHideControls()
}

const onMouseLeave = () => {
    if (!isPlaying.value) return
    controlsVisible.value = false
    clearControlsTimer()
}

const onProgressDrag = (value: number) => {
    progressDraft.value = Number(value || 0)
}

const onProgressCommit = (value: number) => {
    const el = playerRef.value
    const next = Number(value || 0)
    progressDraft.value = null
    if (!el) return
    el.currentTime = next
    currentTime.value = next
}

const applyVolume = (value: number) => {
    const el = playerRef.value
    volume.value = Number(value || 0)
    muted.value = volume.value === 0
    if (volume.value > 0) previousVolume.value = volume.value
    if (!el) return
    el.muted = muted.value
    el.volume = muted.value ? 0 : volume.value
}

const toggleMute = () => {
    const nextMuted = !muted.value
    muted.value = nextMuted
    if (!nextMuted && volume.value === 0) {
        volume.value = previousVolume.value || 0.6
    }
    applyVolume(nextMuted ? 0 : volume.value)
}

const applyRate = (rate: number) => {
    playbackRate.value = rate
    if (playerRef.value) playerRef.value.playbackRate = rate
}

const toggleFullscreen = async () => {
    const el = playerRef.value?.closest('.video-preview-pane') as HTMLElement | null
    if (!el) return
    try {
        if (!document.fullscreenElement) {
            await el.requestFullscreen()
            isFullscreen.value = true
        } else {
            await document.exitFullscreen()
            isFullscreen.value = false
        }
    } catch {
        isFullscreen.value = Boolean(document.fullscreenElement)
    }
}

watch(
    () => props.src,
    () => {
        clearControlsTimer()
        currentTime.value = 0
        duration.value = 0
        hasDuration.value = false
        isBuffering.value = true
        progressDraft.value = null
        controlsVisible.value = true
        syncPlayback()
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    dispose()
})

defineExpose({ dispose })
</script>

<style scoped lang="scss">
.video-preview-pane {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
}

.player-shell {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    user-select: none;
}

.player-bg {
    position: absolute;
    inset: -40px;
    background-position: center;
    background-size: cover;
    filter: blur(60px) brightness(0.35);
    opacity: 0.6;
    transform: scale(1.2);
    pointer-events: none;
    z-index: 0;
}

.video-element {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    z-index: 2;
    cursor: pointer;
}

.buffer-overlay {
    position: absolute;
    inset: 0;
    z-index: 7;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.18);
    pointer-events: none;
}

.buffer-indicator {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    color: #ffffff;
    background: rgba(16, 16, 16, 0.52);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
}

.buffer-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.34);
    border-top-color: #ffffff;
    animation: bufferSpin 0.78s linear infinite;
}

.buffer-text {
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
}

.pause-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    cursor: pointer;
}

.pause-overlay-icon {
    font-size: 64px;
    color: rgba(255, 255, 255, 0.85);
    transition:
        color 0.2s ease,
        transform 0.2s ease;
}

.pause-overlay:hover .pause-overlay-icon {
    color: #ffffff;
    transform: scale(1.05);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active,
.buffer-fade-enter-active,
.buffer-fade-leave-active {
    transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to,
.buffer-fade-enter-from,
.buffer-fade-leave-to {
    opacity: 0;
}

@keyframes bufferSpin {
    to {
        transform: rotate(360deg);
    }
}

.top-bar,
.bottom-progress-layer,
.bottom-controls-layer {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 6;
    transition: opacity 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.top-bar {
    top: 0;
    min-height: 80px;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
    pointer-events: none;
}

.bottom-progress-layer {
    bottom: 66px;
    padding: 0 24px;
}

.bottom-controls-layer {
    bottom: 0;
    padding: 0 24px 20px;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
}

.hide-controls {
    opacity: 0;
    pointer-events: none;
}

.progress-container {
    padding: 0 4px;
}

.progress-slider :deep(.el-slider__runway) {
    height: 5px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    transition: transform 0.2s ease;
}

.progress-slider:hover :deep(.el-slider__runway) {
    transform: scaleY(1.2);
}

.progress-slider :deep(.el-slider__bar) {
    height: 100%;
    background: var(--el-color-primary);
    border-radius: 4px;
    box-shadow: 0 0 10px color-mix(in srgb, var(--el-color-primary) 60%, transparent);
}

.progress-slider :deep(.el-slider__button-wrapper) {
    top: -15px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-slider :deep(.el-slider__button) {
    width: 14px;
    height: 14px;
    border: 3px solid #fff;
    background: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.progress-slider:hover :deep(.el-slider__button) {
    transform: scale(1.3);
}

.controls-layer {
    color: rgba(255, 255, 255, 0.95);
}

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 32px;
}

.left-controls,
.right-controls {
    display: flex;
    align-items: center;
    gap: 20px;
    height: 100%;
}

.volume-control {
    display: flex;
    align-items: center;
    height: 32px;
    border-radius: 16px;
    background: transparent;
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    width: 26px;
    overflow: hidden;
}

.volume-control.expanded {
    width: 158px;
    background: rgba(28, 28, 30, 0.85);
    padding-right: 12px;
}

.volume-btn {
    width: 26px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: color 0.2s ease;
}

.volume-control.expanded .volume-btn,
.volume-btn:hover {
    color: #ffffff;
}

.volume-slider-wrapper {
    flex: 1;
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    margin-left: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.volume-control.expanded .volume-slider-wrapper {
    opacity: 1;
    transform: translateX(0);
}

.volume-slider {
    flex: 1;
    min-width: 58px;
    width: 100%;
}

.volume-percent {
    width: 34px;
    flex: 0 0 34px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    text-align: right;
    font-variant-numeric: tabular-nums;
}

.volume-slider :deep(.el-slider__runway) {
    height: 4px;
    margin: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
}

.volume-slider :deep(.el-slider__bar) {
    height: 4px;
    background: var(--el-color-primary);
    border-radius: 2px;
}

.volume-slider :deep(.el-slider__button-wrapper) {
    width: 24px;
    height: 24px;
    top: -10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.volume-slider :deep(.el-slider__button) {
    width: 10px;
    height: 10px;
    border: 2px solid #fff;
    background: var(--el-color-primary);
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.volume-slider:hover :deep(.el-slider__button) {
    transform: scale(1.3);
}

.speed-control {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
}

.play-btn,
.icon-btn,
.speed-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    height: 100%;
    transition: color 0.2s ease;
}

.play-btn:hover,
.icon-btn:hover,
.speed-trigger:hover {
    color: #ffffff;
}

.play-btn:active,
.icon-btn:active,
.speed-trigger:active {
    color: var(--el-color-primary);
}

.play-btn-icon,
.volume-btn :deep(svg),
.icon-btn :deep(svg) {
    font-size: 26px;
    display: block;
    line-height: 1;
}

.time-display {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0.5px;
    line-height: 1;
}

.time-display.pending {
    opacity: 0.6;
}

.speed-text {
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    display: block;
}

.speed-menu-wrapper {
    position: absolute;
    bottom: calc(100% + 14px);
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    visibility: hidden;
    transition:
        opacity 0.2s ease,
        visibility 0.2s ease;
    z-index: 10;
}

.speed-menu-wrapper::after {
    content: '';
    position: absolute;
    top: 100%;
    left: -20px;
    right: -20px;
    height: 24px;
    background: transparent;
}

.speed-trigger:hover .speed-menu-wrapper {
    opacity: 1;
    visibility: visible;
}

.speed-menu {
    min-width: 96px;
    padding: 8px;
    border-radius: 12px;
    background: rgba(28, 28, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
}

.speed-options {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.speed-item {
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.85);
    transition:
        background 0.2s ease,
        color 0.2s ease;
}

.speed-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.speed-item.active {
    background: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    color: var(--el-color-primary);
    font-weight: 600;
}

.play-icon-swap-enter-active,
.play-icon-swap-leave-active {
    transition: opacity 0.2s ease;
}

.play-icon-swap-enter-from,
.play-icon-swap-leave-to {
    opacity: 0;
}

@media screen and (max-width: 768px) {
    .bottom-progress-layer {
        bottom: 60px;
        padding: 0 16px;
    }

    .bottom-controls-layer {
        padding: 0 16px 16px;
    }

    .control-row {
        gap: 12px;
    }

    .left-controls,
    .right-controls {
        gap: 14px;
    }

    .play-btn-icon,
    .volume-btn :deep(svg),
    .icon-btn :deep(svg) {
        font-size: 24px;
    }

    .time-display {
        font-size: 12px;
    }

    .speed-text {
        font-size: 13px;
    }

    .pause-overlay-icon {
        font-size: 48px;
    }
}
</style>
