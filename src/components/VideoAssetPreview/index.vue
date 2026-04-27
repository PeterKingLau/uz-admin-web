<template>
    <div class="video-card" :class="{ disabled: !hasValidSource }" @click="openVideo">
        <el-image :src="poster" fit="cover" class="video-cover">
            <template #error>
                <div class="video-error-placeholder">
                    <Icon icon="mdi:video-off-outline" />
                </div>
            </template>
        </el-image>

        <div class="video-mask">
            <div class="play-pill">
                <Icon icon="mdi:play" class="icon-play" />
                <span>预览</span>
            </div>
        </div>

        <div class="video-badge">
            <Icon icon="mdi:video-outline" class="badge-icon" />
            <span>{{ badgeText }}</span>
        </div>

        <el-dialog
            v-model="videoVisible"
            :width="dialogWidth"
            append-to-body
            destroy-on-close
            align-center
            class="video-asset-preview-dialog"
            @closed="handleVideoClose"
        >
            <template #header>
                <div class="dialog-header">
                    <div class="header-main">
                        <div class="header-icon">
                            <Icon icon="mdi:play-box-outline" />
                        </div>
                        <div class="header-text">
                            <div class="dialog-title">{{ dialogTitle }}</div>
                            <div class="dialog-subtitle">
                                <el-tag size="small" effect="plain">{{ sourceTypeLabel }}</el-tag>
                                <span class="source-name" :title="resolvedSrcUrl">{{ sourceName }}</span>
                            </div>
                        </div>
                    </div>
                    <el-button text type="primary" class="restart-btn" @click="restartVideo">
                        <Icon icon="mdi:replay" class="btn-icon" />
                        重播
                    </el-button>
                </div>
            </template>

            <div class="video-player-shell">
                <div class="video-player-wrapper">
                    <AsyncVideoPlayer v-if="videoVisible && hasValidSource" ref="videoPlayerRef" :src="resolvedSrcUrl" />
                </div>
                <div class="video-player-footer">
                    <div class="footer-item muted">
                        <Icon icon="mdi:information-outline" />
                        <span>支持 0.5x~2x 倍速播放</span>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
defineOptions({ name: 'ComponentsVideoAssetPreview' })
import { computed, defineAsyncComponent, ref } from 'vue'
import { getImgUrl } from '@/utils/img'

const AsyncVideoPlayer = defineAsyncComponent(() => import('./VideoPlayer.vue'))

const props = defineProps({
    src: { type: String, default: '' },
    poster: { type: String, default: '' },
    dialogTitle: { type: String, default: '视频预览' },
    badgeText: { type: String, default: '视频' }
})

const videoVisible = ref(false)
const videoPlayerRef = ref(null)
const dialogWidth = 'min(980px, calc(100vw - 32px))'
const resolvedSrcUrl = computed(() => getImgUrl(String(props.src || '').trim()))
const hasValidSource = computed(() => Boolean(resolvedSrcUrl.value))

function guessMime(url) {
    const value = String(url || '').toLowerCase()
    if (value.includes('.m3u8')) return 'application/x-mpegURL'
    if (value.includes('.mpd')) return 'application/dash+xml'
    if (value.includes('.webm')) return 'video/webm'
    if (value.includes('.ogg') || value.includes('.ogv')) return 'video/ogg'
    return 'video/mp4'
}

const sourceTypeLabel = computed(() => {
    const type = guessMime(resolvedSrcUrl.value)
    if (type === 'application/x-mpegURL') return 'HLS 流'
    if (type === 'application/dash+xml') return 'DASH 流'
    if (type === 'video/webm') return 'WebM'
    if (type === 'video/ogg') return 'OGG'
    return 'MP4'
})

const sourceName = computed(() => {
    const value = resolvedSrcUrl.value
    if (!value) return '未设置视频地址'
    const fallback = value.split('?')[0].split('/').filter(Boolean).pop() || value
    try {
        const parsed = new URL(value, window.location.origin)
        const name = parsed.pathname.split('/').filter(Boolean).pop()
        return decodeURIComponent(name || fallback)
    } catch {
        return fallback
    }
})

function openVideo() {
    if (!hasValidSource.value) return
    videoVisible.value = true
}

function handleVideoClose() {
    videoPlayerRef.value?.dispose?.()
    videoPlayerRef.value = null
}

function restartVideo() {
    if (!videoVisible.value) return
    videoPlayerRef.value?.restart?.()
}
</script>

<style lang="scss" scoped>
.video-card {
    position: relative;
    width: 140px;
    height: 84px;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-blank);
    box-shadow: var(--app-shadow-medium);
    transition:
        box-shadow 0.22s cubic-bezier(0.2, 0, 0.2, 1),
        border-color 0.22s cubic-bezier(0.2, 0, 0.2, 1),
        background-color 0.22s cubic-bezier(0.2, 0, 0.2, 1);

    .video-cover {
        width: 100%;
        height: 100%;
        opacity: 0.95;
        transition:
            transform 0.24s cubic-bezier(0.2, 0, 0.2, 1),
            opacity 0.24s cubic-bezier(0.2, 0, 0.2, 1);
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

    .video-mask {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(180deg, var(--app-overlay-mask-weak), color-mix(in srgb, var(--el-color-black) 45%, transparent));
        transition: background 0.3s ease;

        .play-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
            color: var(--app-on-dark-color);
            border: var(--app-overlay-border-soft);
            background: var(--app-overlay-mask-medium);
            backdrop-filter: blur(4px);
            transition:
                background-color var(--app-motion-image),
                opacity var(--app-motion-image);

            .icon-play {
                font-size: 14px;
                transform: translateX(1px);
            }
        }
    }

    .video-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: var(--app-overlay-mask-strong);
        color: var(--app-on-dark-color);
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        backdrop-filter: blur(4px);

        .badge-icon {
            font-size: 12px;
        }
    }

    &:hover {
        transform: none;
        box-shadow: var(--app-hover-shadow-card);
        border-color: var(--el-color-primary-light-5);
        background: color-mix(in srgb, var(--el-fill-color-blank) 96%, var(--el-fill-color-light));

        .video-cover {
            filter: brightness(0.96);
            opacity: 1;
        }

        .video-mask {
            background: linear-gradient(
                180deg,
                color-mix(in srgb, var(--el-color-black) 12%, transparent),
                color-mix(in srgb, var(--el-color-black) 54%, transparent)
            );

            .play-pill {
                border: var(--app-overlay-border-strong);
                background: color-mix(in srgb, var(--el-color-black) 50%, transparent);
            }
        }
    }

    &.disabled {
        cursor: not-allowed;
        opacity: 0.7;
    }
}

.video-player-shell {
    padding: 0;
}
</style>

<style lang="scss">
.video-asset-preview-dialog {
    .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 32px;
    }

    .header-main {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }

    .header-icon {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex: none;
    }

    .header-text {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .dialog-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        line-height: 1.25;
    }

    .dialog-subtitle {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .source-name {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .restart-btn {
        flex: none;
        margin-right: 2px;
    }

    .btn-icon {
        margin-right: 4px;
    }

    .el-dialog {
        border-radius: 14px;
        overflow: hidden;
        background: var(--el-bg-color-overlay);
        box-shadow: var(--app-shadow-dialog);
    }

    .el-dialog__body {
        padding: 16px 18px 18px;
        background: var(--el-bg-color-overlay);
    }

    .el-dialog__header {
        margin-right: 0;
        padding: 14px 56px 12px 18px;
        background-color: var(--el-bg-color-overlay);
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .el-dialog__headerbtn {
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        transition: background-color var(--app-motion-fast);

        &:hover {
            background: var(--el-fill-color-light);
        }
    }

    .el-dialog__close {
        font-size: 18px;
        color: var(--el-text-color-secondary);
    }

    .video-player-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        border-radius: 12px;
        border: 1px solid var(--el-border-color-lighter);
        background: var(--el-color-black);
        aspect-ratio: 16/9;
    }

    .preview-player {
        width: 100%;
        height: 100%;
        max-height: calc(100vh - 250px);
    }

    .video-player-footer {
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--el-border-color-lighter);
        background: var(--el-fill-color-light);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
    }

    .footer-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--el-text-color-regular);
        font-size: 12px;
        min-width: 0;

        svg {
            font-size: 14px;
            flex: none;
        }

        &.muted {
            color: var(--el-text-color-secondary);
        }
    }
}

@media (max-width: 768px) {
    .video-card {
        width: 128px;
        height: 76px;
    }

    .video-asset-preview-dialog {
        .el-dialog {
            width: calc(100vw - 24px) !important;
            margin: 0 auto;
        }

        .dialog-header {
            align-items: flex-start;
        }

        .header-main {
            width: 100%;
        }

        .header-text {
            width: 100%;
        }

        .dialog-subtitle {
            width: 100%;
        }

        .restart-btn {
            padding-right: 0;
        }

        .source-name {
            max-width: 100%;
        }

        .el-dialog__body {
            padding: 12px;
        }

        .el-dialog__header {
            padding-right: 52px;
        }

        .video-player-wrapper {
            border-radius: 12px;
        }

        .video-player-footer {
            padding: 8px 10px;
        }
    }
}
</style>
