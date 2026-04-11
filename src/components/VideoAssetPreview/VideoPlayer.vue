<template>
    <video ref="playerRef" class="video-js preview-player" playsinline />
</template>

<script setup>
defineOptions({ name: 'ComponentsVideoPlayer' })
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import zhCN from 'video.js/dist/lang/zh-CN.json'

const props = defineProps({
    src: { type: String, default: '' },
    autoplay: { type: Boolean, default: true },
    muted: { type: Boolean, default: false },
    loop: { type: Boolean, default: false },
    preload: { type: String, default: 'auto' },
    playbackRates: {
        type: Array,
        default: () => [0.5, 1, 1.25, 1.5, 2]
    }
})

const playerRef = ref(null)
let player = null
let languageReady = false

function ensureLanguage() {
    if (languageReady) return
    videojs.addLanguage?.('zh-CN', zhCN)
    languageReady = true
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

async function initPlayer() {
    const el = playerRef.value
    const src = String(props.src || '').trim()
    if (!el || !src) return
    ensureLanguage()

    if (!player) {
        player = videojs(el, {
            controls: true,
            autoplay: props.autoplay,
            muted: props.muted,
            loop: props.loop,
            preload: props.preload,
            playbackRates: props.playbackRates,
            language: 'zh-CN',
            sources: buildSources(src)
        })
    } else {
        player.src(buildSources(src))
    }

    if (props.autoplay) {
        player.play?.()
    }
}

function dispose() {
    if (!player) return
    player.pause?.()
    player.dispose?.()
    player = null
}

function restart() {
    if (!player) return
    player.currentTime?.(0)
    player.play?.()
}

watch(
    () => props.src,
    async () => {
        await nextTick()
        if (!props.src) {
            dispose()
            return
        }
        initPlayer()
    }
)

onMounted(async () => {
    await nextTick()
    initPlayer()
})

onBeforeUnmount(() => {
    dispose()
})

defineExpose({
    restart,
    dispose
})
</script>
