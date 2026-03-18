import { computed, nextTick, onBeforeUnmount, reactive, ref, watch, type ComputedRef } from 'vue'
import { clamp, clampRate, formatClock, isTypingTarget } from '../helpers'

interface UseVideoPlayerControlsOptions {
    visible: ComputedRef<boolean>
    src: ComputedRef<string>
    videoPosterUrl: ComputedRef<string>
}

export function useVideoPlayerControls(options: UseVideoPlayerControlsOptions) {
    const { visible, src, videoPosterUrl } = options

    const playerRef = ref<HTMLVideoElement | null>(null)
    const playerFrameRef = ref<HTMLElement | null>(null)
    const videoWrapperRef = ref<HTMLElement | null>(null)
    const progressContainerRef = ref<HTMLElement | null>(null)

    const showWatermark = ref(false)
    const videoFitMode = ref<'width' | 'height'>('height')
    const videoPillarSize = ref(0)
    const isPortraitVideo = ref(false)

    const isPlaying = ref(false)
    const videoCoverOverlayVisible = ref(false)
    const isVideoBuffering = ref(false)
    const hasRenderedFirstFrame = ref(false)
    const isPlayerUiReady = ref(false)
    const showVideoBuffering = computed(() => isVideoBuffering.value && (!videoCoverOverlayVisible.value || hasRenderedFirstFrame.value))
    const showPauseOverlay = computed(() => !isPlaying.value && !videoCoverOverlayVisible.value)

    const duration = ref(0)
    const currentTime = ref(0)
    const hasDuration = computed(() => Number.isFinite(duration.value) && duration.value > 0)
    const canSeekVideo = computed(() => hasDuration.value)
    const canTogglePlayback = computed(() => Boolean(playerRef.value))
    const isBufferingForControl = computed(() => isVideoBuffering.value && !isPlaying.value)
    const displayCurrentTime = computed(() => (hasDuration.value ? formatClock(currentTime.value) : '--:--'))
    const displayDuration = computed(() => (hasDuration.value ? formatClock(duration.value) : '--:--'))

    const isDraggingProgress = ref(false)
    const progressDraft = ref(0)
    const progressMax = computed(() => (hasDuration.value ? duration.value : 0))
    const progressShown = computed(() => {
        if (!hasDuration.value) return 0
        return isDraggingProgress.value ? progressDraft.value : currentTime.value
    })
    const progressHover = reactive({ visible: false, time: 0, left: 0 })

    const volume = ref(1)
    const muted = ref(false)
    const volumePanelVisible = ref(false)
    const volumePercent = computed(() => Math.round((muted.value ? 0 : volume.value) * 100))

    const rates = [0.75, 1.0, 1.25, 1.5, 2.0]
    const playbackRate = ref(1)

    const controlsVisible = ref(true)
    const pipSupported = ref(false)
    const pipActive = ref(false)
    const isFullscreen = ref(false)

    const pipIcon = computed(() => (pipActive.value ? 'mdi:picture-in-picture-bottom-right' : 'mdi:picture-in-picture-bottom-right-outline'))
    const videoFitClass = computed(() => (videoFitMode.value === 'width' ? 'fit-width' : 'fit-height'))
    const playerShellStyle = computed(() => ({
        '--pillar-size': `${Math.max(0, Math.round(videoPillarSize.value))}px`
    }))
    const usePortraitGlass = computed(() => isPortraitVideo.value && videoPillarSize.value > 20)

    let hideControlsTimer: ReturnType<typeof setTimeout> | null = null
    let volumePanelHideTimer: ReturnType<typeof setTimeout> | null = null
    let prevHtmlOverflow = ''
    let prevBodyOverflow = ''
    let prevHtmlScrollbarGutter = ''
    let prevBodyScrollbarGutter = ''
    let pageScrollLockedByPlayer = false

    const updateWatermarkAndFit = () => {
        const wrapper = videoWrapperRef.value
        const videoEl = playerRef.value
        if (!wrapper || !videoEl) {
            showWatermark.value = false
            videoFitMode.value = 'height'
            videoPillarSize.value = 0
            isPortraitVideo.value = false
            return
        }
        const containerWidth = wrapper.clientWidth || 0
        const containerHeight = wrapper.clientHeight || 0
        const vw = videoEl.videoWidth || 0
        const vh = videoEl.videoHeight || 0
        if (!containerWidth || !containerHeight || !vw || !vh) {
            showWatermark.value = false
            videoPillarSize.value = 0
            isPortraitVideo.value = false
            return
        }
        const containerRatio = containerWidth / containerHeight
        const videoRatio = vw / vh
        showWatermark.value = Math.abs(containerRatio - videoRatio) > 0.12
        videoFitMode.value = videoRatio >= containerRatio ? 'width' : 'height'
        isPortraitVideo.value = videoRatio < 0.98
        if (videoFitMode.value === 'height') {
            const renderedWidth = containerHeight * videoRatio
            videoPillarSize.value = Math.max(0, (containerWidth - renderedWidth) / 2)
        } else {
            videoPillarSize.value = 0
        }
    }

    const handleResize = () => {
        updateWatermarkAndFit()
        isFullscreen.value = Boolean(document.fullscreenElement)
    }

    const calcHoverLeftByTime = (sec: number) => {
        const el = progressContainerRef.value
        const max = progressMax.value
        if (!el || !max) return null
        const rect = el.getBoundingClientRect()
        if (!rect.width) return null
        const ratio = clamp(Number(sec || 0) / max, 0, 1)
        const offsetX = ratio * rect.width
        const padding = 16
        return clamp(offsetX, padding, rect.width - padding)
    }

    const onProgressHover = (event: MouseEvent) => {
        if (isDraggingProgress.value) return
        const el = progressContainerRef.value
        const max = progressMax.value
        if (!el || !max) {
            progressHover.visible = false
            return
        }
        const rect = el.getBoundingClientRect()
        if (!rect.width) return
        const offsetX = clamp(event.clientX - rect.left, 0, rect.width)
        const ratio = offsetX / rect.width
        const nextTime = ratio * max
        const padding = 16
        const clampedLeft = clamp(offsetX, padding, rect.width - padding)
        progressHover.time = nextTime
        progressHover.left = clampedLeft
        progressHover.visible = true
    }

    const onProgressLeave = () => {
        if (isDraggingProgress.value) return
        progressHover.visible = false
    }

    const onProgressDrag = (value: number) => {
        if (!canSeekVideo.value) return
        const sec = Number(value || 0)
        isDraggingProgress.value = true
        progressDraft.value = sec
        progressHover.time = sec
        const left = calcHoverLeftByTime(sec)
        if (left != null) progressHover.left = left
        progressHover.visible = true
    }

    const commitProgressSeek = (sec: number) => {
        const el = playerRef.value
        if (!el) {
            progressHover.visible = false
            return
        }
        const dur = Number(el.duration || duration.value || 0)
        const next = Math.min(dur || sec, Math.max(0, sec))
        el.currentTime = next
        currentTime.value = next
        progressHover.time = next
        const left = calcHoverLeftByTime(next)
        if (left != null) progressHover.left = left
        progressHover.visible = true
    }

    const onProgressCommit = (value: number) => {
        if (!canSeekVideo.value) return
        const sec = Number(value || 0)
        isDraggingProgress.value = false
        progressDraft.value = sec
        commitProgressSeek(sec)
    }

    const onProgressTrackClick = (event: MouseEvent) => {
        if (!canSeekVideo.value) return
        const target = event?.target as HTMLElement | null
        if (target?.closest?.('.el-slider__button-wrapper')) return
        const el = progressContainerRef.value
        const max = progressMax.value
        if (!el || !max) return
        const rect = el.getBoundingClientRect()
        if (!rect.width) return
        const offsetX = clamp(event.clientX - rect.left, 0, rect.width)
        const ratio = offsetX / rect.width
        const sec = ratio * max
        isDraggingProgress.value = false
        progressDraft.value = sec
        commitProgressSeek(sec)
    }

    const syncPiPSupport = () => {
        const el = playerRef.value
        pipSupported.value = Boolean(el && document.pictureInPictureEnabled)
    }

    const applyRate = (value: number) => {
        const el = playerRef.value
        if (!el) return
        const next = clampRate(value ?? playbackRate.value ?? 1)
        playbackRate.value = next
        el.playbackRate = next
    }

    const applyVolume = () => {
        const el = playerRef.value
        if (!el) return
        const nextVolume = Math.min(1, Math.max(0, Number(volume.value)))
        el.volume = nextVolume
        if (nextVolume > 0 && el.muted) el.muted = false
    }

    const toggleMute = () => {
        const el = playerRef.value
        if (!el) return
        el.muted = !el.muted
        muted.value = el.muted
    }

    const clearVolumePanelHideTimer = () => {
        if (!volumePanelHideTimer) return
        clearTimeout(volumePanelHideTimer)
        volumePanelHideTimer = null
    }

    const openVolumePanel = () => {
        clearVolumePanelHideTimer()
        volumePanelVisible.value = true
    }

    const scheduleCloseVolumePanel = () => {
        clearVolumePanelHideTimer()
        volumePanelHideTimer = setTimeout(() => {
            volumePanelVisible.value = false
            volumePanelHideTimer = null
        }, 120)
    }

    const handleVolumeButtonClick = () => {
        openVolumePanel()
        toggleMute()
    }

    const revealPlayerUi = () => {
        if (isPlayerUiReady.value) return
        isPlayerUiReady.value = true
    }

    const hideVideoCoverOnFirstFrame = () => {
        if (!videoPosterUrl.value || !hasRenderedFirstFrame.value) return
        videoCoverOverlayVisible.value = false
    }

    const safePlay = async (el: HTMLVideoElement | null) => {
        if (!el?.play) return
        try {
            isVideoBuffering.value = true
            const result = el.play()
            await result
        } catch (error: any) {
            if (error?.name === 'AbortError') return
            isVideoBuffering.value = false
            console.error(error)
        }
    }

    const togglePlay = () => {
        const el = playerRef.value
        if (!el) return
        if (el.paused) safePlay(el)
        else el.pause()
    }

    const handlePlayControlClick = (event?: Event) => {
        event?.stopPropagation?.()
        if (!canTogglePlayback.value) return
        togglePlay()
    }

    const onLoadedMeta = () => {
        const el = playerRef.value
        if (!el) return
        duration.value = Number(el.duration || 0)
        currentTime.value = Number(el.currentTime || 0)
        volume.value = Number(el.volume ?? 1)
        muted.value = Boolean(el.muted)
        playbackRate.value = Number(el.playbackRate || 1)
        isPlaying.value = !el.paused
        syncPiPSupport()
        updateWatermarkAndFit()
    }

    const onLoadStart = () => {
        isVideoBuffering.value = true
        hasRenderedFirstFrame.value = false
        isPlayerUiReady.value = false
    }

    const onLoadedData = () => {
        hasRenderedFirstFrame.value = true
        hideVideoCoverOnFirstFrame()
        revealPlayerUi()
    }

    const onCanPlay = () => {
        isVideoBuffering.value = false
        hideVideoCoverOnFirstFrame()
        revealPlayerUi()
    }

    const onTimeUpdate = () => {
        const el = playerRef.value
        if (!el) return
        if (!isDraggingProgress.value) currentTime.value = Number(el.currentTime || 0)
    }

    const onDurationChange = () => {
        const el = playerRef.value
        if (!el) return
        duration.value = Number(el.duration || 0)
    }

    const onPlay = () => {
        isPlaying.value = true
    }

    const onPlaying = () => {
        isPlaying.value = true
        hasRenderedFirstFrame.value = true
        isVideoBuffering.value = false
        hideVideoCoverOnFirstFrame()
        revealPlayerUi()
    }

    const onPause = () => {
        isPlaying.value = false
        const el = playerRef.value
        if (!el) return
        if (Number(el.currentTime || 0) <= 0.08 && videoPosterUrl.value) {
            videoCoverOverlayVisible.value = true
        }
    }

    const onWaiting = () => {
        isVideoBuffering.value = true
    }

    const onVolumeChange = () => {
        const el = playerRef.value
        if (!el) return
        muted.value = Boolean(el.muted)
        volume.value = muted.value ? 0 : Number(el.volume ?? 1)
    }

    const onRateChange = () => {
        const el = playerRef.value
        if (!el) return
        playbackRate.value = Number(el.playbackRate || 1)
    }

    const toggleFullscreen = async () => {
        const shell = playerFrameRef.value || videoWrapperRef.value
        if (!shell) return
        try {
            if (document.fullscreenElement) await document.exitFullscreen()
            else await shell.requestFullscreen()
        } catch (error) {
            console.error(error)
        } finally {
            isFullscreen.value = Boolean(document.fullscreenElement)
            nextTick(() => updateWatermarkAndFit())
        }
    }

    const togglePiP = async () => {
        const el = playerRef.value as any
        if (!el || !document.pictureInPictureEnabled) return
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture()
                pipActive.value = false
            } else {
                await el.requestPictureInPicture()
                pipActive.value = true
            }
        } catch (error) {
            console.error(error)
            pipActive.value = Boolean(document.pictureInPictureElement)
        }
    }

    const onKeydown = (event: KeyboardEvent) => {
        if (!visible.value) return
        if (event.code !== 'Space' && event.key !== ' ') return
        if (isTypingTarget(event.target)) return
        event.preventDefault()
        togglePlay()
    }

    const lockPageScroll = () => {
        if (pageScrollLockedByPlayer || typeof document === 'undefined') return
        const html = document.documentElement
        const body = document.body
        if (!html || !body) return
        prevHtmlOverflow = html.style.overflow
        prevBodyOverflow = body.style.overflow
        prevHtmlScrollbarGutter = html.style.scrollbarGutter
        prevBodyScrollbarGutter = body.style.scrollbarGutter
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
        html.style.scrollbarGutter = 'auto'
        body.style.scrollbarGutter = 'auto'
        pageScrollLockedByPlayer = true
    }

    const unlockPageScroll = () => {
        if (!pageScrollLockedByPlayer || typeof document === 'undefined') return
        const html = document.documentElement
        const body = document.body
        if (!html || !body) return
        html.style.overflow = prevHtmlOverflow
        body.style.overflow = prevBodyOverflow
        html.style.scrollbarGutter = prevHtmlScrollbarGutter
        body.style.scrollbarGutter = prevBodyScrollbarGutter
        pageScrollLockedByPlayer = false
    }

    const stopPlayer = () => {
        const el = playerRef.value
        if (el) {
            try {
                el.pause?.()
                if (Number(el.currentTime || 0) > 0) {
                    el.currentTime = 0
                }
            } catch (error) {
                console.error(error)
            }
        }
        isPlaying.value = false
        isVideoBuffering.value = false
        hasRenderedFirstFrame.value = false
        isPlayerUiReady.value = false
        showWatermark.value = false
        videoPillarSize.value = 0
        isPortraitVideo.value = false
        pipActive.value = false
        isDraggingProgress.value = false
        progressDraft.value = 0
        progressHover.visible = false
        volumePanelVisible.value = false
        clearVolumePanelHideTimer()

        window.removeEventListener('resize', handleResize)
        document.removeEventListener('fullscreenchange', handleResize)
        window.removeEventListener('keydown', onKeydown)
        if (hideControlsTimer) {
            clearTimeout(hideControlsTimer)
            hideControlsTimer = null
        }
        unlockPageScroll()
    }

    const initPlayer = async () => {
        if (!visible.value || !src.value) return
        await nextTick()
        const el = playerRef.value
        if (!el) return
        syncPiPSupport()
        window.addEventListener('resize', handleResize)
        document.addEventListener('fullscreenchange', handleResize)
        window.addEventListener('keydown', onKeydown)
        lockPageScroll()
        isVideoBuffering.value = true
        hasRenderedFirstFrame.value = false
        isPlayerUiReady.value = false
        el.playbackRate = Number(playbackRate.value || 1)
        el.volume = Math.min(1, Math.max(0, Number(volume.value)))
        el.preload = 'auto'
        el.load?.()
        updateWatermarkAndFit()
        await safePlay(el)
    }

    const resetHideTimer = () => {
        controlsVisible.value = true
        if (hideControlsTimer) clearTimeout(hideControlsTimer)
        if (isPlaying.value) {
            hideControlsTimer = setTimeout(() => {
                controlsVisible.value = false
            }, 3000)
        }
    }

    const onMouseMove = () => {
        resetHideTimer()
    }

    const onMouseLeave = () => {
        if (isPlaying.value) {
            controlsVisible.value = false
        }
    }

    const seekTo = (seconds: number) => {
        const el = playerRef.value
        if (!el) return
        const next = Math.min(Number(el.duration || 0), Math.max(0, Number(seconds || 0)))
        el.currentTime = next
        currentTime.value = next
    }

    watch(isPlaying, value => {
        if (value) {
            resetHideTimer()
        } else {
            controlsVisible.value = true
            if (hideControlsTimer) clearTimeout(hideControlsTimer)
        }
    })

    watch(
        () => [visible.value, src.value],
        ([nextVisible]) => {
            if (nextVisible) initPlayer()
            else stopPlayer()
        },
        { immediate: true }
    )

    watch(
        () => [visible.value, src.value, videoPosterUrl.value],
        ([nextVisible]) => {
            videoCoverOverlayVisible.value = Boolean(nextVisible && videoPosterUrl.value)
        },
        { immediate: true }
    )

    onBeforeUnmount(() => {
        clearVolumePanelHideTimer()
        stopPlayer()
    })

    return {
        playerRef,
        playerFrameRef,
        videoWrapperRef,
        progressContainerRef,
        showWatermark,
        videoFitClass,
        usePortraitGlass,
        playerShellStyle,
        videoCoverOverlayVisible,
        showVideoBuffering,
        showPauseOverlay,
        isPlayerUiReady,
        controlsVisible,
        isDraggingProgress,
        progressDraft,
        progressHover,
        progressShown,
        progressMax,
        canSeekVideo,
        canTogglePlayback,
        isBufferingForControl,
        displayCurrentTime,
        displayDuration,
        volume,
        muted,
        volumePanelVisible,
        volumePercent,
        rates,
        playbackRate,
        pipSupported,
        pipIcon,
        isFullscreen,
        togglePlay,
        handlePlayControlClick,
        onProgressHover,
        onProgressLeave,
        onProgressDrag,
        onProgressCommit,
        onProgressTrackClick,
        openVolumePanel,
        scheduleCloseVolumePanel,
        handleVolumeButtonClick,
        applyVolume,
        applyRate,
        togglePiP,
        toggleFullscreen,
        onLoadStart,
        onLoadedData,
        onLoadedMeta,
        onCanPlay,
        onTimeUpdate,
        onDurationChange,
        onPlay,
        onPlaying,
        onPause,
        onWaiting,
        onVolumeChange,
        onRateChange,
        onMouseMove,
        onMouseLeave,
        seekTo
    }
}
