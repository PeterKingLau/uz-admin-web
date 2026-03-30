<template>
    <div class="preview-sticky-wrapper">
        <div class="preview-header">
            <div class="header-left">
                <Icon icon="mdi:cellphone-screenshot" class="header-icon" />
                <span class="label">实时预览</span>
                <el-tag v-if="props.batchPreviewEnabled" size="small" type="primary" effect="dark" class="batch-index-tag">
                    {{ props.batchPreviewIndex + 1 }} / {{ props.batchPreviewTotal }}
                </el-tag>
            </div>
            <div class="header-time">{{ props.currentTime }}</div>
        </div>

        <div class="mobile-frame">
            <div class="device-buttons">
                <div class="btn-mute"></div>
                <div class="btn-vol-up"></div>
                <div class="btn-vol-down"></div>
                <div class="btn-power"></div>
            </div>

            <div class="screen-content">
                <div class="status-bar">
                    <span class="time">{{ props.currentTime }}</span>
                    <div class="dynamic-island">
                        <div class="camera"></div>
                        <div class="sensor"></div>
                    </div>
                    <div class="status-icons">
                        <Icon icon="mdi:signal-cellular-3" />
                        <Icon icon="mdi:wifi" />
                        <Icon icon="mdi:battery-80" />
                    </div>
                </div>

                <div class="app-nav">
                    <Icon icon="mdi:chevron-left" class="nav-icon" />
                    <div class="user-brief">
                        <el-avatar :size="28" :src="props.userAvatar" class="nav-avatar" />
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
                                height="360px"
                                arrow="always"
                                class="media-carousel"
                            >
                                <el-carousel-item v-for="(url, index) in props.previewMediaList" :key="resolveMediaPreviewKey(url, index)">
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
                                <transition name="fade">
                                    <div v-if="showVideoCoverOverlay && props.previewVideoCoverUrl" class="video-cover-overlay" @click="startPreviewVideo">
                                        <img :src="props.previewVideoCoverUrl" alt="video cover" class="video-cover-image" />
                                        <div class="video-cover-play">
                                            <Icon icon="mdi:play" />
                                        </div>
                                    </div>
                                </transition>
                            </div>

                            <div class="indicator-dots" v-if="props.postType === POST_TYPE.IMAGE && props.previewMediaList.length > 1">
                                <span
                                    v-for="(url, i) in props.previewMediaList"
                                    :key="resolveMediaPreviewKey(url, i)"
                                    class="dot"
                                    :class="{ active: i === 0 }"
                                ></span>
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
                                <span v-for="(tag, index) in props.selectedTagNames" :key="resolveTagKey(tag, index)" class="hash-tag"> #{{ tag.name }} </span>
                            </div>
                        </transition>

                        <div class="meta-row">
                            <span class="date">刚刚发布</span>
                            <span class="location">
                                <Icon icon="mdi:map-marker" class="location-icon" />
                                四川 · 成都
                            </span>
                        </div>
                    </div>

                    <div class="mock-comments">
                        <div class="comment-count">全部评论 (0)</div>
                        <div class="empty-comment">
                            <Icon icon="mdi:comment-processing-outline" class="empty-icon" />
                            <span>成为第一个评论的人</span>
                        </div>
                    </div>
                </div>

                <div class="app-tabbar">
                    <div class="input-fake">
                        <Icon icon="mdi:pencil" class="edit-icon" />
                        <span>说点什么...</span>
                    </div>
                    <div class="action-icons">
                        <div class="icon-item">
                            <Icon icon="mdi:heart-outline" />
                            <span class="count">点赞</span>
                        </div>
                        <div class="icon-item">
                            <Icon icon="mdi:star-outline" />
                            <span class="count">收藏</span>
                        </div>
                        <div class="icon-item">
                            <Icon icon="mdi:comment-outline" />
                            <span class="count">评论</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsContentAddPostComponentsPostPreviewPanel' })
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
    batchPreviewEnabled: boolean
    batchPreviewIndex: number
    batchPreviewTotal: number
}>()

const previewVideoRef = ref<HTMLVideoElement>()
const showVideoCoverOverlay = ref(false)
const resolveMediaPreviewKey = (url: string, index: number) => {
    const normalizedUrl = String(url || '').trim()
    return normalizedUrl ? `media:${normalizedUrl}:${index}` : `media-index:${index}`
}
const resolveTagKey = (tag: TagItem, index: number) => {
    const tagId = String(tag?.id ?? '').trim()
    if (tagId) return `tag:${tagId}`
    const tagName = String(tag?.name ?? '').trim()
    return tagName ? `tag-name:${tagName}:${index}` : `tag-index:${index}`
}

const shouldShowCoverOverlay = () =>
    props.postType === POST_TYPE.VIDEO && Boolean(props.previewMediaList[0]) && Boolean(String(props.previewVideoCoverUrl || '').trim())

const resetVideoOverlay = async () => {
    showVideoCoverOverlay.value = shouldShowCoverOverlay()
    if (!previewVideoRef.value) return
    try {
        previewVideoRef.value.pause()
        previewVideoRef.value.currentTime = 0
    } catch {}
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
    } catch {}
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
@use '../../../../assets/styles/content/mobile-post-preview.scss' as preview;

@include preview.mobile-post-preview();
</style>
