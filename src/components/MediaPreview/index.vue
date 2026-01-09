<template>
    <div class="audit-media-preview">
        <div v-if="isAuditRejected" class="status-container rejected">
            <el-tag type="danger" effect="plain" round class="status-tag">
                <Icon icon="mdi:alert-circle-outline" class="icon" />
                <span>内容已删除</span>
            </el-tag>
        </div>

        <div v-else-if="normalizedList.length === 0" class="status-container empty">
            <span class="empty-text">
                <Icon icon="mdi:image-off-outline" class="mr-1" />
                无媒体资源
            </span>
        </div>

        <div v-else class="media-container">
            <template v-if="isImagePost">
                <div class="image-grid">
                    <div v-for="(img, index) in displayImages" :key="index" class="image-item" @click="openPreview(index)">
                        <el-image :src="img" fit="cover" class="grid-img" loading="lazy">
                            <template #placeholder>
                                <div class="image-placeholder">
                                    <Icon icon="mdi:loading" class="animate-spin" />
                                </div>
                            </template>
                            <template #error>
                                <div class="image-error">
                                    <Icon icon="mdi:image-broken-variant" />
                                </div>
                            </template>
                        </el-image>

                        <div v-if="index === displayImages.length - 1 && remainingCount > 0" class="more-overlay">
                            <span class="count">+{{ remainingCount }}</span>
                        </div>

                        <div class="hover-overlay">
                            <Icon icon="mdi:magnify-plus-outline" />
                        </div>
                    </div>
                </div>

                <el-image-viewer
                    v-if="showViewer"
                    :url-list="imageList"
                    :initial-index="initialIndex"
                    :z-index="4000"
                    :teleported="true"
                    :hide-on-click-modal="true"
                    @switch="onViewerSwitch"
                    @close="closeViewer"
                />

                <teleport to="body">
                    <div v-if="showViewer" class="viewer-count-badge">{{ currentIndex + 1 }} / {{ imageList.length }}</div>
                </teleport>
            </template>

            <template v-else-if="isVideoPost">
                <div class="video-card" @click="openVideo">
                    <el-image :src="videoThumb" fit="cover" class="video-cover">
                        <template #error>
                            <div class="video-error-placeholder">
                                <Icon icon="mdi:video-off-outline" />
                            </div>
                        </template>
                    </el-image>

                    <div class="play-overlay">
                        <div class="play-button">
                            <Icon icon="mdi:play" class="icon" />
                        </div>
                    </div>

                    <div class="video-badge"><Icon icon="mdi:video" class="mr-1" /> 视频</div>
                </div>

                <el-dialog
                    v-model="videoVisible"
                    title="视频预览"
                    width="900px"
                    append-to-body
                    destroy-on-close
                    align-center
                    class="media-preview-dialog"
                    @close="handleVideoClose"
                >
                    <div class="video-player-wrapper">
                        <video v-if="videoVisible && videoSrc" ref="playerRef" class="video-js preview-player" playsinline />
                    </div>
                </el-dialog>
            </template>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance, onBeforeUnmount, watch, nextTick } from 'vue'
import { isExternal } from '@/utils/validate'
import { POST_TYPE, AUDIT_STATUS } from '@/utils/enum'

const props = defineProps({
    postType: { type: String, default: '' },
    mediaUrls: { type: [String, Array], default: () => [] },
    auditStatus: { type: String, default: AUDIT_STATUS.PENDING },
    maxDisplayCount: { type: Number, default: 3 }
})

const { proxy } = getCurrentInstance()

const isAuditRejected = computed(() => props.auditStatus === AUDIT_STATUS.REJECTED)
const isImagePost = computed(() => props.postType === POST_TYPE.IMAGE)
const isVideoPost = computed(() => props.postType === POST_TYPE.VIDEO)

const normalizedList = computed(() => {
    if (isAuditRejected.value) return []
    let list = props.mediaUrls
    if (!list) return []

    const transformUrl = url => (!isExternal(url) && proxy?.$imgUrl ? proxy.$imgUrl(url) : url)

    let result = []
    if (Array.isArray(list)) {
        result = list
    } else if (typeof list === 'string') {
        const trimmed = list.trim()
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                result = JSON.parse(trimmed)
            } catch {
                result = []
            }
        } else {
            result = trimmed.split(',').map(s => s.trim())
        }
    }
    return result.filter(Boolean).map(transformUrl)
})

const imageList = computed(() => (isImagePost.value ? normalizedList.value : []))
const displayImages = computed(() => imageList.value.slice(0, Math.max(0, props.maxDisplayCount)))
const remainingCount = computed(() => Math.max(0, imageList.value.length - Math.max(0, props.maxDisplayCount)))

const showViewer = ref(false)
const initialIndex = ref(0)
const currentIndex = ref(0)

function openPreview(index) {
    initialIndex.value = index
    currentIndex.value = index
    showViewer.value = true
}

function closeViewer() {
    showViewer.value = false
}

function onViewerSwitch(index) {
    currentIndex.value = Number(index) || 0
}

const videoVisible = ref(false)
const playerRef = ref(null)
let player = null

const videoThumb = computed(() => {
    if (!isVideoPost.value) return ''
    return normalizedList.value[0] || ''
})

const videoSrc = computed(() => {
    if (!isVideoPost.value) return ''
    return normalizedList.value[1] || normalizedList.value[0] || ''
})

const playerOptions = {
    controls: true,
    autoplay: true,
    muted: false,
    loop: false,
    preload: 'auto',
    playbackRates: [0.5, 1, 1.25, 1.5, 2]
}

function buildSources(url) {
    const u = String(url || '').trim()
    if (!u) return []
    return [{ src: u, type: guessMime(u) }]
}

function guessMime(url) {
    const u = String(url || '').toLowerCase()
    if (u.includes('.m3u8')) return 'application/x-mpegURL'
    if (u.includes('.mpd')) return 'application/dash+xml'
    if (u.includes('.webm')) return 'video/webm'
    if (u.includes('.ogg') || u.includes('.ogv')) return 'video/ogg'
    return 'video/mp4'
}

function openVideo() {
    if (!videoSrc.value) return
    videoVisible.value = true
}

async function initPlayer() {
    if (!videoVisible.value || !videoSrc.value) return
    await nextTick()
    const el = playerRef.value
    if (!el) return

    if (!player) {
        const videojsLib = proxy?.$videojs
        if (!videojsLib) return
        player = videojsLib(el, {
            ...playerOptions,
            sources: buildSources(videoSrc.value)
        })
    } else {
        player.src(buildSources(videoSrc.value))
    }
    player.play?.()
}

async function stopPlayer() {
    if (!player) return
    player.pause?.()
    player.dispose?.()
    player = null
}

watch(
    () => [videoVisible.value, videoSrc.value],
    () => {
        if (videoVisible.value) initPlayer()
        else stopPlayer()
    }
)

async function handleVideoClose() {
    await stopPlayer()
}

onBeforeUnmount(() => {
    stopPlayer()
})
</script>

<style lang="scss" scoped>
.audit-media-preview {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
}

.status-container {
    display: flex;
    align-items: center;

    &.rejected {
        .status-tag {
            border: none;
            background-color: var(--el-color-danger-light-9);
            color: var(--el-color-danger);
            .icon {
                font-size: 16px;
                margin-right: 4px;
            }
        }
    }

    &.empty {
        .empty-text {
            display: inline-flex;
            align-items: center;
            color: var(--el-text-color-placeholder);
            font-size: 12px;
        }
    }
}

.image-grid {
    display: flex;
    gap: 8px;

    .image-item {
        position: relative;
        width: 70px;
        height: 70px;
        border-radius: 6px;
        overflow: hidden;
        cursor: zoom-in;
        border: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--el-fill-color-light);

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: var(--el-color-primary-light-5);

            .hover-overlay {
                opacity: 1;
            }
        }

        .grid-img {
            width: 100%;
            height: 100%;
            display: block;
            transition: transform 0.3s;
        }

        .image-placeholder,
        .image-error {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-secondary);
            font-size: 20px;
        }

        .animate-spin {
            animation: spin 1s linear infinite;
        }

        .more-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(2px);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            z-index: 2;
        }

        .hover-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
            color: #fff;
            font-size: 20px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
    }
}

.video-card {
    position: relative;
    width: 140px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--el-border-color-lighter);
    background-color: #000;

    .video-cover {
        width: 100%;
        height: 100%;
        opacity: 0.9;
        transition:
            transform 0.3s,
            opacity 0.3s;
    }

    .video-error-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--el-fill-color-darker);
        color: var(--el-text-color-secondary);
        font-size: 24px;
    }

    .play-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.2);
        transition: background 0.3s;

        .play-button {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s;

            .icon {
                color: var(--el-color-primary);
                font-size: 20px;
                margin-left: 2px;
            }
        }
    }

    .video-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
    }

    &:hover {
        .video-cover {
            transform: scale(1.05);
            opacity: 1;
        }
        .play-overlay {
            background: rgba(0, 0, 0, 0.1);
            .play-button {
                transform: scale(1.1);
                background: #fff;
            }
        }
    }
}

.video-player-wrapper {
    background: #000;
    border-radius: 4px;
    overflow: hidden;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    aspect-ratio: 16/9;
}

.preview-player {
    width: 100%;
    height: 100%;
    max-height: 70vh;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>

<style lang="scss">
.media-preview-dialog {
    .el-dialog__body {
        padding: 0;
        background-color: #000;
    }
    .el-dialog__header {
        margin-right: 0;
        padding: 15px 20px;
        background-color: var(--el-bg-color);
        border-bottom: 1px solid var(--el-border-color-lighter);
    }
}

.viewer-count-badge {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 16px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
    backdrop-filter: blur(4px);
    font-variant-numeric: tabular-nums;
    z-index: 4001;
}
</style>
