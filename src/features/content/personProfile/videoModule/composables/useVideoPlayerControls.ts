import { computed, nextTick, onBeforeUnmount, reactive, ref, watch, type ComputedRef } from 'vue'
import { clamp, clampRate, formatClock, isTypingTarget } from '../helpers'

const VIDEO_LOCAL_CACHE_NAME = 'uz-web-video-cache-v1'
const VIDEO_LOCAL_CACHE_META_KEY = 'uz-web-video-cache-meta-v1'
const VIDEO_LOCAL_CACHE_MAX_BYTES = 35 * 1024 * 1024
const VIDEO_LOCAL_CACHE_TOTAL_MAX_BYTES = 160 * 1024 * 1024
const VIDEO_LOCAL_CACHE_MAX_ITEMS = 5
const VIDEO_LOCAL_CACHE_MIN_FREE_BYTES = 180 * 1024 * 1024
const VIDEO_LOCAL_CACHE_MIN_FREE_RATIO = 0.08
const VIDEO_LOCAL_CACHE_TIMEOUT_MS = 12_000
const CACHEABLE_VIDEO_EXT_RE = /\.(mp4|m4v|webm|mov|ogg|ogv)(\?|#|$)/i
const BUFFERING_VISUAL_DELAY_MS = 180
const STALL_RECOVERY_DELAY_MS = 2200
const STALL_RECOVERY_MAX_RETRIES = 2

interface UseVideoPlayerControlsOptions {
    visible: ComputedRef<boolean>
    src: ComputedRef<string>
    videoPosterUrl: ComputedRef<string>
}

interface VideoCacheMetaItem {
    size: number
    lastAccessAt: number
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
    const playbackSrc = ref('')
    const isUsingLocalCache = ref(false)

    const isPlaying = ref(false)
    const playIntent = ref<'play' | 'pause' | null>(null)
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
    const playControlIcon = computed(() => {
        if (playIntent.value === 'play') return 'mdi:pause'
        if (playIntent.value === 'pause') return 'mdi:play'
        return isPlaying.value ? 'mdi:pause' : 'mdi:play'
    })
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
    const volumeIndicatorVisible = ref(false)
    const volumeIndicatorIcon = computed(() => {
        if (muted.value || volume.value <= 0) return 'mdi:volume-mute'
        if (volume.value < 0.5) return 'mdi:volume-low'
        return 'mdi:volume-high'
    })
    const volumeIndicatorPercent = computed(() => (muted.value ? 0 : volumePercent.value))

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
    let volumeIndicatorTimer: ReturnType<typeof setTimeout> | null = null
    let initialPlayFallbackTimer: ReturnType<typeof setTimeout> | null = null
    let bufferingDelayTimer: ReturnType<typeof setTimeout> | null = null
    let stallRecoveryTimer: ReturnType<typeof setTimeout> | null = null
    let stallRecoveryAttempts = 0
    let prevHtmlOverflow = ''
    let prevBodyOverflow = ''
    let prevHtmlScrollbarGutter = ''
    let prevBodyScrollbarGutter = ''
    let pageScrollLockedByPlayer = false
    let playbackObjectUrl = ''
    let sourceSyncId = 0
    const cacheWarmupInFlight = new Set<string>()
    let cacheMeta: Record<string, VideoCacheMetaItem> = {}
    let didCacheMetaInit = false

    const saveCacheMeta = () => {
        if (typeof window === 'undefined') return
        try {
            window.localStorage.setItem(VIDEO_LOCAL_CACHE_META_KEY, JSON.stringify(cacheMeta))
        } catch {
            // ignore persist errors; playback should keep working
        }
    }

    const loadCacheMeta = () => {
        if (didCacheMetaInit) return
        didCacheMetaInit = true
        if (typeof window === 'undefined') return
        try {
            const raw = window.localStorage.getItem(VIDEO_LOCAL_CACHE_META_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw)
            if (!parsed || typeof parsed !== 'object') return
            const nextMeta: Record<string, VideoCacheMetaItem> = {}
            for (const [url, item] of Object.entries(parsed as Record<string, any>)) {
                if (typeof url !== 'string' || !url) continue
                const size = Number(item?.size || 0)
                const lastAccessAt = Number(item?.lastAccessAt || 0)
                if (!Number.isFinite(size) || size <= 0) continue
                if (!Number.isFinite(lastAccessAt) || lastAccessAt <= 0) continue
                nextMeta[url] = {
                    size: Math.round(size),
                    lastAccessAt: Math.round(lastAccessAt)
                }
            }
            cacheMeta = nextMeta
        } catch {
            cacheMeta = {}
        }
    }

    const touchCacheMeta = (url: string, size?: number) => {
        if (!url) return
        loadCacheMeta()
        const now = Date.now()
        const existing = cacheMeta[url]
        const nextSize = Number(size)
        cacheMeta[url] = {
            size: Number.isFinite(nextSize) && nextSize > 0 ? Math.round(nextSize) : Math.max(0, Number(existing?.size || 0)),
            lastAccessAt: now
        }
        saveCacheMeta()
    }

    const removeCacheMetaByUrls = (urls: string[]) => {
        if (!urls.length) return
        loadCacheMeta()
        let changed = false
        for (const url of urls) {
            if (!url || !cacheMeta[url]) continue
            delete cacheMeta[url]
            changed = true
        }
        if (changed) saveCacheMeta()
    }

    const getCacheMetaTotalBytes = () => Object.values(cacheMeta).reduce((sum, item) => sum + Math.max(0, Number(item?.size || 0)), 0)

    const getCacheMetaCount = () => Object.keys(cacheMeta).length

    const hasStorageHeadroom = async () => {
        if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return true
        try {
            const estimate = await navigator.storage.estimate()
            const quota = Number(estimate?.quota || 0)
            const usage = Number(estimate?.usage || 0)
            if (!Number.isFinite(quota) || quota <= 0) return true
            if (!Number.isFinite(usage) || usage < 0) return true
            const freeBytes = quota - usage
            const freeRatio = freeBytes / quota
            return freeBytes >= VIDEO_LOCAL_CACHE_MIN_FREE_BYTES && freeRatio >= VIDEO_LOCAL_CACHE_MIN_FREE_RATIO
        } catch {
            return true
        }
    }

    const syncCacheWithMeta = async (cache: Cache) => {
        loadCacheMeta()
        const requests = await cache.keys()
        const cacheUrlSet = new Set(requests.map(request => request.url))

        const missingUrls = Object.keys(cacheMeta).filter(url => !cacheUrlSet.has(url))
        if (missingUrls.length) removeCacheMetaByUrls(missingUrls)

        const staleRequests = requests.filter(request => !cacheMeta[request.url])
        if (!staleRequests.length) return
        await Promise.all(staleRequests.map(request => cache.delete(request).catch(() => false)))
    }

    const trimLocalCache = async (cache: Cache, incomingSize = 0) => {
        await syncCacheWithMeta(cache)
        loadCacheMeta()

        const sortable = Object.entries(cacheMeta)
            .filter(([url]) => !cacheWarmupInFlight.has(url))
            .sort((a, b) => Number(a[1]?.lastAccessAt || 0) - Number(b[1]?.lastAccessAt || 0))

        let totalBytes = getCacheMetaTotalBytes()
        let count = getCacheMetaCount()
        const removeUrls: string[] = []

        while (
            sortable.length > 0 &&
            (totalBytes + incomingSize > VIDEO_LOCAL_CACHE_TOTAL_MAX_BYTES || count + 1 > VIDEO_LOCAL_CACHE_MAX_ITEMS)
        ) {
            const [url, item] = sortable.shift() as [string, VideoCacheMetaItem]
            removeUrls.push(url)
            totalBytes -= Math.max(0, Number(item?.size || 0))
            count -= 1
        }

        if (!removeUrls.length) return
        await Promise.all(removeUrls.map(url => cache.delete(url).catch(() => false)))
        removeCacheMetaByUrls(removeUrls)
    }

    const clearLocalVideoCache = async (cache: Cache) => {
        await syncCacheWithMeta(cache)
        const urls = Object.keys(cacheMeta)
        if (!urls.length) return
        await Promise.all(urls.map(url => cache.delete(url).catch(() => false)))
        removeCacheMetaByUrls(urls)
    }

    const canUseLocalCache = (url: string) => {
        if (!url) return false
        const normalized = String(url).trim().toLowerCase()
        if (!/^https?:\/\//.test(normalized)) return false
        if (!CACHEABLE_VIDEO_EXT_RE.test(normalized)) return false
        if (normalized.includes('.m3u8')) return false
        return typeof window !== 'undefined' && 'caches' in window
    }

    const revokePlaybackObjectUrl = () => {
        if (!playbackObjectUrl) return
        URL.revokeObjectURL(playbackObjectUrl)
        playbackObjectUrl = ''
    }

    const fetchWithTimeout = async (url: string, timeoutMs: number) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        try {
            return await fetch(url, { signal: controller.signal })
        } finally {
            clearTimeout(timer)
        }
    }

    const createBlobUrlFromCachedResponse = async (response: Response) => {
        if (!response?.ok) return null
        const blob = await response.blob()
        if (!blob || blob.size <= 0 || blob.size > VIDEO_LOCAL_CACHE_MAX_BYTES) return null
        return {
            objectUrl: URL.createObjectURL(blob),
            size: blob.size
        }
    }

    const tryGetCachedBlobUrl = async (url: string) => {
        if (!canUseLocalCache(url)) return null
        try {
            const cache = await caches.open(VIDEO_LOCAL_CACHE_NAME)
            const cached = await cache.match(url)
            if (!cached) return null
            const headerLength = Number(cached.headers.get('content-length') || 0)
            if (Number.isFinite(headerLength) && headerLength > VIDEO_LOCAL_CACHE_MAX_BYTES) {
                await cache.delete(url)
                removeCacheMetaByUrls([url])
                return null
            }
            const payload = await createBlobUrlFromCachedResponse(cached)
            if (!payload) {
                await cache.delete(url)
                removeCacheMetaByUrls([url])
                return null
            }
            touchCacheMeta(url, payload.size)
            return payload.objectUrl
        } catch {
            return null
        }
    }

    const warmLocalCache = async (url: string) => {
        if (!canUseLocalCache(url)) return
        if (cacheWarmupInFlight.has(url)) return
        cacheWarmupInFlight.add(url)
        try {
            const cache = await caches.open(VIDEO_LOCAL_CACHE_NAME)
            await syncCacheWithMeta(cache)
            const exists = await cache.match(url)
            if (exists) {
                touchCacheMeta(url)
                return
            }

            if (!(await hasStorageHeadroom())) {
                await clearLocalVideoCache(cache)
                if (!(await hasStorageHeadroom())) return
            }

            const response = await fetchWithTimeout(url, VIDEO_LOCAL_CACHE_TIMEOUT_MS)
            if (!response.ok) return

            const contentType = String(response.headers.get('content-type') || '').toLowerCase()
            if (contentType && !contentType.includes('video')) return

            const contentLength = Number(response.headers.get('content-length') || 0)
            if (!Number.isFinite(contentLength) || contentLength <= 0) return
            if (contentLength > VIDEO_LOCAL_CACHE_MAX_BYTES) return

            await trimLocalCache(cache, contentLength)
            await cache.put(url, response.clone())
            touchCacheMeta(url, contentLength)
        } catch {
            // fall through to default playback without blocking UI
        } finally {
            cacheWarmupInFlight.delete(url)
        }
    }

    const syncPlaybackSource = async (nextSrc: string) => {
        const normalizedSrc = String(nextSrc || '').trim()
        const currentSyncId = ++sourceSyncId
        isUsingLocalCache.value = false

        if (!normalizedSrc) {
            revokePlaybackObjectUrl()
            playbackSrc.value = ''
            return
        }

        if (!canUseLocalCache(normalizedSrc)) {
            revokePlaybackObjectUrl()
            playbackSrc.value = normalizedSrc
            return
        }

        const cachedBlobUrl = await tryGetCachedBlobUrl(normalizedSrc)
        if (currentSyncId !== sourceSyncId) {
            if (cachedBlobUrl) URL.revokeObjectURL(cachedBlobUrl)
            return
        }
        if (cachedBlobUrl) {
            revokePlaybackObjectUrl()
            playbackObjectUrl = cachedBlobUrl
            playbackSrc.value = cachedBlobUrl
            isUsingLocalCache.value = true
            return
        }

        revokePlaybackObjectUrl()
        playbackSrc.value = normalizedSrc
        void warmLocalCache(normalizedSrc)
    }

    const releasePlaybackMemory = () => {
        revokePlaybackObjectUrl()
        isUsingLocalCache.value = false
        if (playbackSrc.value) {
            playbackSrc.value = ''
        }
    }

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
        pipActive.value = Boolean(el && document.pictureInPictureElement === el)
    }

    const syncPiPActiveState = () => {
        const el = playerRef.value
        pipActive.value = Boolean(el && document.pictureInPictureElement === el)
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

    const clearVolumeIndicatorTimer = () => {
        if (!volumeIndicatorTimer) return
        clearTimeout(volumeIndicatorTimer)
        volumeIndicatorTimer = null
    }

    const showVolumeIndicator = () => {
        volumeIndicatorVisible.value = true
        clearVolumeIndicatorTimer()
        volumeIndicatorTimer = setTimeout(() => {
            volumeIndicatorVisible.value = false
            volumeIndicatorTimer = null
        }, 900)
    }

    const adjustVolumeByStep = (delta: number) => {
        const el = playerRef.value
        if (!el) return
        const base = el.muted ? 0 : Number(el.volume ?? volume.value ?? 0)
        const nextVolume = clamp(base + delta, 0, 1)
        el.volume = nextVolume
        el.muted = nextVolume <= 0
        volume.value = nextVolume
        muted.value = el.muted
        showVolumeIndicator()
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

    const clearInitialPlayFallbackTimer = () => {
        if (!initialPlayFallbackTimer) return
        clearTimeout(initialPlayFallbackTimer)
        initialPlayFallbackTimer = null
    }

    const clearBufferingDelayTimer = () => {
        if (!bufferingDelayTimer) return
        clearTimeout(bufferingDelayTimer)
        bufferingDelayTimer = null
    }

    const setBufferingState = (next: boolean, immediate = false) => {
        clearBufferingDelayTimer()
        if (!next) {
            isVideoBuffering.value = false
            return
        }
        if (immediate || !hasRenderedFirstFrame.value) {
            isVideoBuffering.value = true
            return
        }
        bufferingDelayTimer = setTimeout(() => {
            bufferingDelayTimer = null
            isVideoBuffering.value = true
        }, BUFFERING_VISUAL_DELAY_MS)
    }

    const clearStallRecoveryTimer = () => {
        if (!stallRecoveryTimer) return
        clearTimeout(stallRecoveryTimer)
        stallRecoveryTimer = null
    }

    const recoverFromStall = async () => {
        const el = playerRef.value
        if (!el || !visible.value || !isVideoBuffering.value) return
        if (stallRecoveryAttempts >= STALL_RECOVERY_MAX_RETRIES) return
        stallRecoveryAttempts += 1
        try {
            const dur = Number(el.duration || 0)
            const current = Number(el.currentTime || 0)
            if (dur > 0 && current < dur - 0.2) {
                const nudged = Math.min(dur - 0.1, current + 0.05)
                if (nudged > current) {
                    el.currentTime = nudged
                }
            }
            await safePlay(el)
        } catch {
            // best effort recovery
        }
    }

    const scheduleStallRecovery = () => {
        clearStallRecoveryTimer()
        stallRecoveryTimer = setTimeout(() => {
            stallRecoveryTimer = null
            void recoverFromStall()
        }, STALL_RECOVERY_DELAY_MS)
    }

    const scheduleInitialPlayFallback = () => {
        clearInitialPlayFallbackTimer()
        initialPlayFallbackTimer = setTimeout(() => {
            initialPlayFallbackTimer = null
            if (hasRenderedFirstFrame.value || isPlaying.value) return
            playIntent.value = null
            setBufferingState(false, true)
            revealPlayerUi()
        }, 2500)
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
            setBufferingState(true, true)
            scheduleInitialPlayFallback()
            const result = el.play()
            await result
        } catch (error: any) {
            clearInitialPlayFallbackTimer()
            if (error?.name === 'AbortError') return
            playIntent.value = null
            setBufferingState(false, true)
            revealPlayerUi()
            console.error(error)
        }
    }

    const togglePlay = () => {
        const el = playerRef.value
        if (!el) return
        if (el.paused) {
            playIntent.value = 'play'
            safePlay(el)
        } else {
            playIntent.value = 'pause'
            el.pause()
        }
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
        stallRecoveryAttempts = 0
        clearStallRecoveryTimer()
        setBufferingState(true, true)
        hasRenderedFirstFrame.value = false
        isPlayerUiReady.value = false
    }

    const onLoadedData = () => {
        clearInitialPlayFallbackTimer()
        clearStallRecoveryTimer()
        hasRenderedFirstFrame.value = true
        setBufferingState(false, true)
        hideVideoCoverOnFirstFrame()
        revealPlayerUi()
    }

    const onCanPlay = () => {
        clearInitialPlayFallbackTimer()
        clearStallRecoveryTimer()
        stallRecoveryAttempts = 0
        setBufferingState(false, true)
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
        clearInitialPlayFallbackTimer()
        playIntent.value = null
        isPlaying.value = true
    }

    const onPlaying = () => {
        clearInitialPlayFallbackTimer()
        clearStallRecoveryTimer()
        playIntent.value = null
        isPlaying.value = true
        hasRenderedFirstFrame.value = true
        stallRecoveryAttempts = 0
        setBufferingState(false, true)
        hideVideoCoverOnFirstFrame()
        revealPlayerUi()
    }

    const onPause = () => {
        clearInitialPlayFallbackTimer()
        clearStallRecoveryTimer()
        playIntent.value = null
        isPlaying.value = false
        const el = playerRef.value
        if (!el) return
        if (Number(el.currentTime || 0) <= 0.08 && videoPosterUrl.value) {
            videoCoverOverlayVisible.value = true
        }
    }

    const onWaiting = () => {
        setBufferingState(true)
        scheduleStallRecovery()
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

    const enterPiP = async () => {
        const el = playerRef.value as any
        if (!el || !document.pictureInPictureEnabled) return
        try {
            if (document.pictureInPictureElement === el) {
                pipActive.value = true
                return true
            }
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture()
            }
            await el.requestPictureInPicture()
            pipActive.value = true
            return true
        } catch (error) {
            console.error(error)
            syncPiPActiveState()
            return false
        }
    }

    const exitPiP = async () => {
        const el = playerRef.value as any
        if (!el || document.pictureInPictureElement !== el) {
            pipActive.value = false
            return true
        }
        try {
            await document.exitPictureInPicture()
            pipActive.value = false
            return true
        } catch (error) {
            console.error(error)
            syncPiPActiveState()
            return false
        }
    }

    const togglePiP = async () => {
        if (document.pictureInPictureElement) {
            await exitPiP()
            return
        }
        await enterPiP()
    }

    const onKeydown = (event: KeyboardEvent) => {
        if (!visible.value) return
        if (isTypingTarget(event.target)) return
        if (event.code === 'Space' || event.key === ' ') {
            event.preventDefault()
            togglePlay()
            return
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault()
            seekTo(currentTime.value - 5)
            return
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault()
            seekTo(currentTime.value + 5)
            return
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault()
            adjustVolumeByStep(0.05)
            return
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            adjustVolumeByStep(-0.05)
        }
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
                if (document.pictureInPictureElement === el) {
                    document.exitPictureInPicture().catch(error => console.error(error))
                }
                el.pause?.()
                if (Number(el.currentTime || 0) > 0) {
                    el.currentTime = 0
                }
                // Hint browser to release media buffer/decoder resources aggressively.
                ;(el as any).srcObject = null
                el.preload = 'none'
                el.removeAttribute('src')
                el.load?.()
            } catch (error) {
                console.error(error)
            }
        }
        isPlaying.value = false
        playIntent.value = null
        setBufferingState(false, true)
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
        volumeIndicatorVisible.value = false
        clearVolumePanelHideTimer()
        clearVolumeIndicatorTimer()
        clearInitialPlayFallbackTimer()
        clearStallRecoveryTimer()
        clearBufferingDelayTimer()

        window.removeEventListener('resize', handleResize)
        document.removeEventListener('fullscreenchange', handleResize)
        window.removeEventListener('keydown', onKeydown)
        if (el) {
            el.removeEventListener('enterpictureinpicture', syncPiPActiveState)
            el.removeEventListener('leavepictureinpicture', syncPiPActiveState)
        }
        if (hideControlsTimer) {
            clearTimeout(hideControlsTimer)
            hideControlsTimer = null
        }
        unlockPageScroll()
        releasePlaybackMemory()
    }

    const initPlayer = async () => {
        if (!visible.value || !playbackSrc.value) return
        await nextTick()
        const el = playerRef.value
        if (!el) return
        el.removeEventListener('enterpictureinpicture', syncPiPActiveState)
        el.removeEventListener('leavepictureinpicture', syncPiPActiveState)
        el.addEventListener('enterpictureinpicture', syncPiPActiveState)
        el.addEventListener('leavepictureinpicture', syncPiPActiveState)
        syncPiPSupport()
        window.addEventListener('resize', handleResize)
        document.addEventListener('fullscreenchange', handleResize)
        window.addEventListener('keydown', onKeydown)
        lockPageScroll()
        setBufferingState(true, true)
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
        src,
        value => {
            void syncPlaybackSource(value)
        },
        { immediate: true }
    )

    watch(
        () => [visible.value, playbackSrc.value],
        ([nextVisible]) => {
            if (nextVisible) initPlayer()
            else stopPlayer()
        },
        { immediate: true }
    )

    watch(
        visible,
        nextVisible => {
            if (!nextVisible) return
            if (!playbackSrc.value && src.value) {
                void syncPlaybackSource(src.value)
            }
        },
        { immediate: true }
    )

    watch(
        () => [visible.value, playbackSrc.value, videoPosterUrl.value],
        ([nextVisible]) => {
            videoCoverOverlayVisible.value = Boolean(nextVisible && videoPosterUrl.value)
        },
        { immediate: true }
    )

    onBeforeUnmount(() => {
        clearVolumePanelHideTimer()
        clearVolumeIndicatorTimer()
        clearStallRecoveryTimer()
        clearBufferingDelayTimer()
        releasePlaybackMemory()
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
        playbackSrc,
        videoCoverOverlayVisible,
        showVideoBuffering,
        showPauseOverlay,
        isPlayerUiReady,
        isPlaying,
        controlsVisible,
        hasRenderedFirstFrame,
        isDraggingProgress,
        progressDraft,
        progressHover,
        progressShown,
        progressMax,
        hasDuration,
        canSeekVideo,
        canTogglePlayback,
        playControlIcon,
        displayCurrentTime,
        displayDuration,
        volume,
        muted,
        volumePanelVisible,
        volumePercent,
        volumeIndicatorVisible,
        volumeIndicatorIcon,
        volumeIndicatorPercent,
        rates,
        playbackRate,
        pipSupported,
        pipActive,
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
        exitPiP,
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
