<template>
    <div class="preview-sticky-wrapper">
        <div class="preview-header">
            <div class="header-left">
                <Icon icon="mdi:cellphone" class="header-icon" />
                <span class="label">实时预览</span>
            </div>
            <el-tag size="small" type="info" effect="plain">{{ props.currentTime }}</el-tag>
        </div>

        <div class="mobile-frame">
            <div class="notch">
                <div class="camera"></div>
                <div class="speaker"></div>
            </div>
            <div class="side-btn volume-up"></div>
            <div class="side-btn volume-down"></div>
            <div class="side-btn power"></div>

            <div class="screen-content">
                <div class="status-bar">
                    <span class="time">{{ props.currentTime }}</span>
                    <div class="status-icons">
                        <Icon icon="mdi:signal-cellular-3" />
                        <Icon icon="mdi:wifi" />
                        <Icon icon="mdi:battery-80" />
                    </div>
                </div>

                <div class="app-nav">
                    <Icon icon="mdi:chevron-left" class="nav-icon" />
                    <div class="user-brief">
                        <el-avatar :size="32" :src="props.userAvatar" />
                        <span class="username">{{ props.userNickName }}</span>
                    </div>
                    <Icon icon="mdi:dots-horizontal" class="nav-icon" />
                </div>

                <div class="scroll-area">
                    <transition name="media-slide">
                        <div class="media-area" v-if="props.postType !== POST_TYPE.TEXT && props.previewMediaList.length">
                            <el-carousel
                                v-if="props.postType === POST_TYPE.IMAGE"
                                :autoplay="false"
                                indicator-position="none"
                                height="375px"
                                arrow="always"
                                class="media-carousel"
                            >
                                <el-carousel-item v-for="(url, index) in props.previewMediaList" :key="index">
                                    <div class="carousel-img" :style="{ backgroundImage: `url(${url})` }"></div>
                                </el-carousel-item>
                            </el-carousel>

                            <div v-else-if="props.postType === POST_TYPE.VIDEO" class="video-preview">
                                <video
                                    ref="previewVideoRef"
                                    :src="props.previewMediaList[0]"
                                    :poster="props.previewVideoCoverUrl || undefined"
                                    controls
                                    controlslist="nodownload"
                                    disablepictureinpicture
                                    preload="metadata"
                                    playsinline
                                    @contextmenu.prevent
                                    @playing="handleVideoPlaying"
                                    @pause="handleVideoPause"
                                    @ended="handleVideoEnded"
                                ></video>
                                <transition name="cover-fade">
                                    <div v-if="showVideoCoverOverlay && props.previewVideoCoverUrl" class="video-cover-overlay" @click="startPreviewVideo">
                                        <img :src="props.previewVideoCoverUrl" alt="video cover" class="video-cover-image" />
                                        <div class="video-cover-play">
                                            <Icon icon="mdi:play" />
                                        </div>
                                    </div>
                                </transition>
                            </div>

                            <div class="indicator-dots" v-if="props.postType === POST_TYPE.IMAGE && props.previewMediaList.length > 1">
                                <span v-for="(_, i) in props.previewMediaList" :key="i" class="dot" :class="{ active: i === 0 }"></span>
                            </div>
                        </div>
                    </transition>

                    <div class="content-body">
                        <transition name="fade">
                            <h1 class="post-title" v-if="props.previewContentTitle">
                                {{ props.previewContentTitle }}
                            </h1>
                        </transition>

                        <p class="post-text" :class="{ placeholder: !props.previewContent }">
                            {{ props.previewContent || props.previewContentPlaceholder }}
                        </p>

                        <transition name="tags-slide">
                            <div class="tags-row" v-if="props.selectedTagNames.length">
                                <span v-for="tag in props.selectedTagNames" :key="tag.id" class="hash-tag"> #{{ tag.name }} </span>
                            </div>
                        </transition>

                        <div class="meta-row">
                            <span class="date">刚刚</span>
                            <span class="location">
                                <Icon icon="mdi:map-marker-outline" class="location-icon" />
                                四川 · 成都
                            </span>
                        </div>
                    </div>

                    <el-divider class="mock-divider" />

                    <div class="mock-comments">
                        <div class="comment-count">共 0 条评论</div>
                        <div class="empty-comment">
                            <Icon icon="mdi:sofa-outline" />
                            <span>快来坐沙发~</span>
                        </div>
                    </div>
                </div>

                <div class="app-tabbar">
                    <div class="input-fake">
                        <Icon icon="mdi:emoticon-outline" class="emoji-icon" />
                        <span>说点什么...</span>
                    </div>
                    <div class="action-icons">
                        <div class="icon-item">
                            <Icon icon="mdi:heart-outline" />
                            <span class="count">0</span>
                        </div>
                        <div class="icon-item">
                            <Icon icon="mdi:star-outline" />
                            <span class="count">0</span>
                        </div>
                        <div class="icon-item">
                            <Icon icon="mdi:comment-outline" />
                            <span class="count">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { POST_TYPE } from '@/utils/enum'

interface TagItem {
    id: number | string
    name: string
}

const props = defineProps<{
    currentTime: string
    userAvatar: string
    userNickName: string
    postType: string
    previewMediaList: string[]
    previewVideoCoverUrl: string
    previewContent: string
    previewContentTitle: string
    previewContentPlaceholder: string
    selectedTagNames: TagItem[]
}>()

const previewVideoRef = ref<HTMLVideoElement>()
const showVideoCoverOverlay = ref(false)

const shouldShowCoverOverlay = () =>
    props.postType === POST_TYPE.VIDEO && Boolean(props.previewMediaList[0]) && Boolean(String(props.previewVideoCoverUrl || '').trim())

const resetVideoOverlay = async () => {
    showVideoCoverOverlay.value = shouldShowCoverOverlay()
    if (!previewVideoRef.value) return
    try {
        previewVideoRef.value.pause()
        previewVideoRef.value.currentTime = 0
    } catch {
        // noop
    }
    await nextTick()
}

watch(
    () => [props.postType, props.previewMediaList[0] || '', props.previewVideoCoverUrl || ''] as const,
    () => {
        resetVideoOverlay()
    },
    { immediate: true }
)

const startPreviewVideo = async () => {
    const video = previewVideoRef.value
    if (!video) return
    try {
        await video.play()
    } catch {
        // ignore autoplay/play promise rejection in preview
    }
}

const handleVideoPlaying = () => {
    showVideoCoverOverlay.value = false
}

const handleVideoPause = () => {
    const video = previewVideoRef.value
    if (!video) return
    if (video.currentTime <= 0.08 && shouldShowCoverOverlay()) {
        showVideoCoverOverlay.value = true
    }
}

const handleVideoEnded = () => {
    if (!shouldShowCoverOverlay()) return
    showVideoCoverOverlay.value = true
}
</script>

<style lang="scss" scoped>
.preview-sticky-wrapper {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.preview-header {
    width: 320px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .header-icon {
            font-size: 20px;
            color: var(--el-color-primary);
        }

        .label {
            font-weight: 600;
            color: var(--el-text-color-primary);
            font-size: 16px;
        }
    }
}

.mobile-frame {
    width: 320px;
    height: 650px;
    background: var(--el-bg-color);
    border-radius: 46px;
    box-shadow:
        0 0 0 2px var(--el-border-color-light),
        0 0 0 10px #1f1f1f,
        0 0 0 12px #0a0a0a,
        0 24px 48px rgba(0, 0, 0, 0.45),
        0 12px 24px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    z-index: 1;
    transition: all 0.3s;

    .notch {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 130px;
        height: 32px;
        background: #0a0a0a;
        border-radius: 0 0 18px 18px;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 20px;

        .camera {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
        }

        .speaker {
            width: 50px;
            height: 5px;
            border-radius: 3px;
            background: #1a1a1a;
        }
    }

    .side-btn {
        position: absolute;
        background: #1f1f1f;
        border: 1px solid #0a0a0a;
    }

    .volume-up {
        width: 3px;
        height: 45px;
        left: -12px;
        top: 125px;
        border-radius: 2px 0 0 2px;
    }

    .volume-down {
        width: 3px;
        height: 45px;
        left: -12px;
        top: 180px;
        border-radius: 2px 0 0 2px;
    }

    .power {
        width: 3px;
        height: 70px;
        right: -12px;
        top: 155px;
        border-radius: 0 2px 2px 0;
    }
}

.screen-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
    transition: all 0.3s;
}

.status-bar {
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 24px 10px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.3px;

    .time {
        color: var(--el-text-color-primary);
    }

    .status-icons {
        display: flex;
        gap: 7px;
        color: var(--el-text-color-primary);
    }
}

.app-nav {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    .nav-icon {
        font-size: 26px;
        color: inherit;
        cursor: pointer;
        transition: all 0.2s;

        &:active {
            opacity: 0.6;
        }
    }

    .user-brief {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        font-weight: 600;
    }
}

.scroll-area {
    flex: 1;
    overflow-y: auto;
    &::-webkit-scrollbar {
        display: none;
    }
}

.media-area {
    width: 100%;
    background: var(--el-fill-color-dark);
    position: relative;

    .carousel-img {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
    }

    :deep(.media-carousel) {
        background: var(--el-fill-color-darker);
    }

    :deep(.media-carousel .el-carousel__container) {
        background: var(--el-fill-color-darker);
    }

    :deep(.el-carousel__arrow) {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);

        &:hover {
            background: rgba(0, 0, 0, 0.7);
        }
    }

    .video-preview video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
    }

    .video-cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .video-preview {
        height: 375px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-darker);
        position: relative;
    }

    .video-cover-overlay {
        position: absolute;
        inset: 0;
        cursor: pointer;
    }

    .video-cover-play {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.45);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        backdrop-filter: blur(3px);
    }

    .indicator-dots {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 7px;
        z-index: 5;

        .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transition: all 0.3s;

            &.active {
                background: var(--el-color-white);
                width: 22px;
                border-radius: 4px;
            }
        }
    }
}

.cover-fade-enter-active,
.cover-fade-leave-active {
    transition: opacity 0.2s ease;
}

.cover-fade-enter-from,
.cover-fade-leave-to {
    opacity: 0;
}

.media-slide-enter-active,
.media-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.media-slide-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.media-slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.content-body {
    padding: 18px;

    .post-title {
        font-size: 19px;
        font-weight: 700;
        margin: 0 0 10px;
        line-height: 1.4;
        color: var(--el-text-color-primary);
        letter-spacing: -0.2px;
    }

    .post-text {
        font-size: 15px;
        line-height: 1.7;
        color: inherit;
        white-space: pre-wrap;
        margin: 0 0 14px;

        &.placeholder {
            color: var(--el-text-color-placeholder);
            font-style: italic;
        }
    }

    .tags-row {
        margin-bottom: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .hash-tag {
            color: var(--el-color-primary);
            font-size: 14px;
            font-weight: 600;
            padding: 4px 10px;
            background: rgba(var(--el-color-primary-rgb), 0.08);
            border-radius: 8px;
            transition: all 0.2s;

            &:hover {
                background: rgba(var(--el-color-primary-rgb), 0.12);
            }
        }
    }

    .meta-row {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .location {
            display: flex;
            align-items: center;
            gap: 4px;

            .location-icon {
                font-size: 14px;
            }
        }
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}

.tags-slide-enter-active,
.tags-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tags-slide-enter-from {
    opacity: 0;
    transform: translateX(-10px);
}

.tags-slide-leave-to {
    opacity: 0;
    transform: translateX(10px);
}

.mock-divider {
    margin: 10px 0;
    border-color: var(--el-border-color-extra-light);
}

.mock-comments {
    padding: 0 18px 24px;

    .comment-count {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 18px;
        font-weight: 600;
    }

    .empty-comment {
        height: 110px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-placeholder);
        font-size: 14px;
        gap: 10px;

        .iconify {
            font-size: 36px;
            opacity: 0.6;
        }
    }
}

.app-tabbar {
    height: 54px;
    border-top: 1px solid var(--el-border-color-extra-light);
    display: flex;
    align-items: center;
    padding: 0 18px;
    background: var(--el-bg-color);
    transition: all 0.3s;
    gap: 14px;

    .input-fake {
        flex: 1;
        height: 36px;
        background: var(--el-fill-color);
        border-radius: 18px;
        padding: 0 16px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;

        .emoji-icon {
            font-size: 18px;
            color: var(--el-text-color-placeholder);
        }

        &:active {
            background: var(--el-fill-color-dark);
        }
    }

    .action-icons {
        display: flex;
        gap: 18px;
        color: inherit;
        font-size: 24px;

        .icon-item {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            transition: all 0.2s;

            .count {
                font-size: 13px;
                font-weight: 600;
            }

            &:active {
                opacity: 0.6;
                transform: scale(0.95);
            }
        }
    }
}

@media screen and (max-width: 992px) {
    .preview-sticky-wrapper {
        position: static;
        margin-top: 40px;
    }
}
</style>
