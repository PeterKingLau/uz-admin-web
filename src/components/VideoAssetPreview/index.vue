<template>
    <div class="video-card" @click="openVideo">
        <el-image :src="poster" fit="cover" class="video-cover">
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

        <div class="video-badge"><Icon icon="mdi:video" class="mr-1" /> {{ badgeText }}</div>

        <el-dialog
            v-model="videoVisible"
            :title="dialogTitle"
            width="900px"
            append-to-body
            destroy-on-close
            align-center
            class="video-asset-preview-dialog"
            @close="handleVideoClose"
        >
            <div class="video-player-wrapper">
                <video v-if="videoVisible && src" ref="playerRef" class="video-js preview-player" playsinline />
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
    src: { type: String, default: '' },
    poster: { type: String, default: '' },
    dialogTitle: { type: String, default: '视频预览' },
    badgeText: { type: String, default: '视频' }
})

const videoVisible = ref(false)
const playerRef = ref(null)
let player = null
let videoJsLoader = null
let languageReady = false

const playerOptions = {
    controls: true,
    autoplay: true,
    muted: false,
    loop: false,
    preload: 'auto',
    playbackRates: [0.5, 1, 1.25, 1.5, 2]
}

function guessMime(url) {
    const value = String(url || '').toLowerCase()
    if (value.includes('.m3u8')) return 'application/x-mpegURL'
    if (value.includes('.mpd')) return 'application/dash+xml'
    if (value.includes('.webm')) return 'video/webm'
    if (value.includes('.ogg') || value.includes('.ogv')) return 'video/ogg'
    return 'video/mp4'
}

function buildSources(url) {
    const value = String(url || '').trim()
    if (!value) return []
    return [{ src: value, type: guessMime(value) }]
}

function openVideo() {
    if (!props.src) return
    videoVisible.value = true
}

async function loadVideoJs() {
    if (!videoJsLoader) {
        videoJsLoader = Promise.all([import('video.js'), import('video.js/dist/video-js.css')]).then(([videoJsModule]) => videoJsModule.default || videoJsModule)
    }
    const videojsLib = await videoJsLoader

    if (!languageReady) {
        const langModule = await import('video.js/dist/lang/zh-CN.json')
        const langData = langModule.default || langModule
        videojsLib.addLanguage?.('zh-CN', langData)
        languageReady = true
    }

    return videojsLib
}

async function initPlayer() {
    if (!videoVisible.value || !props.src) return
    await nextTick()
    const el = playerRef.value
    if (!el) return
    const videojsLib = await loadVideoJs()
    if (!videoVisible.value || !el) return

    if (!player) {
        player = videojsLib(el, {
            ...playerOptions,
            language: 'zh-CN',
            sources: buildSources(props.src)
        })
    } else {
        player.src(buildSources(props.src))
    }
    player.play?.()
}

async function stopPlayer() {
    if (!player) return
    player.pause?.()
    player.dispose?.()
    player = null
}

async function handleVideoClose() {
    await stopPlayer()
}

watch(
    () => [videoVisible.value, props.src],
    () => {
        if (videoVisible.value) initPlayer()
        else stopPlayer()
    }
)

onBeforeUnmount(() => {
    stopPlayer()
})
</script>

<style lang="scss" scoped>
.video-card {
    position: relative;
    width: 140px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-color-black);

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
        color: var(--el-color-white);
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
                background: var(--el-color-white);
            }
        }
    }
}

.video-player-wrapper {
    background: var(--el-color-black);
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
</style>

<style lang="scss">
.video-asset-preview-dialog {
    .el-dialog__body {
        padding: 0;
        background-color: var(--el-color-black);
    }

    .el-dialog__header {
        margin-right: 0;
        padding: 15px 20px;
        background-color: var(--el-bg-color);
        border-bottom: 1px solid var(--el-border-color-lighter);
    }
}
</style>
