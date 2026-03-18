<template>
    <component :is="teleportWrapper" v-bind="teleportAttrs">
        <div
            v-show="visible"
            class="video-immersive-container"
            :class="{ 'page-mode': !props.useTeleport }"
            @click="handleClose"
            @mousemove="onMouseMove"
            @mouseleave="onMouseLeave"
        >
            <div class="stage" @click.stop>
                <div ref="playerFrameRef" class="player-frame" :class="{ 'comment-open': commentPanelVisible }">
                    <div
                        ref="videoWrapperRef"
                        class="player-shell"
                        :class="[videoFitClass, { 'is-watermarked': showWatermark, 'is-portrait-video': usePortraitGlass }]"
                        :style="playerShellStyle"
                        @click="togglePlay"
                    >
                        <div class="player-bg" :style="bgStyle"></div>
                        <div v-if="usePortraitGlass" class="portrait-glass-sides" aria-hidden="true">
                            <div class="glass-side left" :style="glassSideStyle"></div>
                            <div class="glass-side right" :style="glassSideStyle"></div>
                        </div>

                        <video
                            ref="playerRef"
                            :src="src"
                            :poster="videoPosterUrl || undefined"
                            class="video-element"
                            playsinline
                            autoplay
                            preload="auto"
                            controlslist="nodownload noremoteplayback"
                            @loadstart="onLoadStart"
                            @loadeddata="onLoadedData"
                            @loadedmetadata="onLoadedMeta"
                            @canplay="onCanPlay"
                            @timeupdate="onTimeUpdate"
                            @durationchange="onDurationChange"
                            @play="onPlay"
                            @playing="onPlaying"
                            @pause="onPause"
                            @waiting="onWaiting"
                            @stalled="onWaiting"
                            @seeking="onWaiting"
                            @volumechange="onVolumeChange"
                            @ratechange="onRateChange"
                        ></video>

                        <transition name="video-cover-fade">
                            <div v-if="videoCoverOverlayVisible && videoPosterUrl" class="video-cover-overlay" @click.stop="togglePlay">
                                <img :src="videoPosterUrl" alt="video cover" class="video-cover-image" />
                                <div class="video-cover-play">
                                    <Icon icon="mdi:play" />
                                </div>
                            </div>
                        </transition>

                        <transition name="video-buffer-fade">
                            <div v-if="showVideoBuffering" class="video-buffer-overlay" aria-live="polite">
                                <div class="video-buffer-indicator">
                                    <Icon icon="mdi:loading" class="buffer-icon" />
                                    <span>{{ hasRenderedFirstFrame ? '正在缓冲...' : '正在加载视频...' }}</span>
                                </div>
                            </div>
                        </transition>

                        <div v-if="showPauseOverlay && isPlayerUiReady" class="pause-overlay" @click.stop="togglePlay">
                            <Icon icon="mdi:play" class="pause-overlay-icon" />
                        </div>

                        <div class="top-bar" :class="{ 'hide-controls': !controlsVisible && isPlaying }">
                            <div class="close-btn" @click.stop="handleClose">
                                <Icon icon="ep:close" />
                            </div>
                        </div>

                        <div class="bottom-info-layer" :class="{ ready: isPlayerUiReady, 'hide-controls': isPlayerUiReady && !controlsVisible && isPlaying }">
                            <div class="info-content">
                                <div class="author-line">
                                    <div class="author-name">@{{ authorName }}</div>
                                    <span class="publish-time" @click.stop="openDetailPanel"> {{ formatDate(postData.createTime) }} </span>
                                </div>
                                <div class="video-desc">
                                    <span class="desc-text">
                                        <template v-for="(part, index) in contentParts" :key="index">
                                            <span v-if="part.isTag" class="hashtag">{{ part.text }}</span>
                                            <span v-else>{{ part.text }}</span>
                                        </template>
                                    </span>
                                </div>
                            </div>

                            <div class="controls-layer" @click.stop>
                                <div
                                    ref="progressContainerRef"
                                    class="progress-container"
                                    :class="{ disabled: !canSeekVideo }"
                                    @mousemove="onProgressHover"
                                    @mouseleave="onProgressLeave"
                                    @click="onProgressTrackClick"
                                >
                                    <div v-if="progressHover.visible" class="progress-hover-tooltip" :style="{ left: progressHover.left + 'px' }">
                                        <div class="progress-hover-time">{{ formatClock(isDraggingProgress ? progressDraft : progressHover.time) }}</div>
                                    </div>
                                    <el-slider
                                        :model-value="progressShown"
                                        :min="0"
                                        :max="progressMax"
                                        :step="0.1"
                                        :show-tooltip="false"
                                        :disabled="!canSeekVideo"
                                        class="progress-slider"
                                        @update:modelValue="onProgressDrag"
                                        @input="onProgressDrag"
                                        @change="onProgressCommit"
                                    />
                                </div>

                                <div class="control-row">
                                    <div class="left-controls">
                                        <div
                                            class="play-btn"
                                            :class="{ loading: isBufferingForControl, disabled: !canTogglePlayback }"
                                            @click="handlePlayControlClick"
                                        >
                                            <Icon v-if="isBufferingForControl" icon="mdi:loading" class="play-loading-icon" />
                                            <Icon v-else :icon="isPlaying ? 'mdi:pause' : 'mdi:play'" />
                                        </div>
                                        <div class="time-display" :class="{ pending: !hasDuration }">
                                            <span>{{ displayCurrentTime }}</span>
                                            <span class="sep">/</span>
                                            <span>{{ displayDuration }}</span>
                                        </div>
                                    </div>

                                    <div class="right-controls">
                                        <div class="volume-control" @mouseenter="openVolumePanel" @mouseleave="scheduleCloseVolumePanel">
                                            <div class="volume-btn" @click.stop="handleVolumeButtonClick">
                                                <Icon :icon="muted || volume === 0 ? 'mdi:volume-mute' : volume < 0.5 ? 'mdi:volume-low' : 'mdi:volume-high'" />
                                            </div>
                                            <div class="volume-slider-wrapper" :class="{ open: volumePanelVisible }">
                                                <el-slider
                                                    v-model="volume"
                                                    :min="0"
                                                    :max="1"
                                                    :step="0.01"
                                                    :show-tooltip="false"
                                                    class="volume-slider"
                                                    @input="applyVolume"
                                                />
                                                <div class="volume-value">{{ volumePercent }}</div>
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
                                                                @click="applyRate(rate)"
                                                            >
                                                                {{ rate }}x
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="icon-btn" :class="{ disabled: !pipSupported }" title="画中画" @click="togglePiP">
                                            <Icon :icon="pipIcon" />
                                        </div>

                                        <div class="icon-btn" title="全屏" @click="toggleFullscreen">
                                            <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="right-sidebar" :class="{ ready: isPlayerUiReady }">
                            <div class="sidebar-item avatar-wrapper">
                                <el-avatar :size="48" :src="authorAvatar" class="author-avatar" @click.stop="handleAvatarClick" />
                                <button v-if="showFollowBadge" type="button" class="follow-badge" aria-label="关注" @click.stop="handleToggleFollow">
                                    <Icon :icon="followBadgeIcon" />
                                </button>
                            </div>

                            <div class="sidebar-item" @click.stop="handleToggleLike">
                                <el-tooltip content="点赞" placement="left">
                                    <div class="icon-wrapper">
                                        <Icon icon="mdi:heart" :class="{ liked: isLiked }" />
                                    </div>
                                </el-tooltip>
                                <span class="count">{{ formatCount(postData.likeCount) }}</span>
                            </div>

                            <div class="sidebar-item" :class="{ active: commentPanelVisible }" @click.stop="toggleCommentPanel">
                                <el-tooltip content="评论" placement="left">
                                    <div class="icon-wrapper">
                                        <Icon icon="mdi:comment-processing" />
                                    </div>
                                </el-tooltip>
                                <span class="count">{{ formatCount(localCommentCount) }}</span>
                            </div>

                            <div class="sidebar-item" @click.stop="handleToggleCollect">
                                <el-tooltip content="收藏" placement="left">
                                    <div class="icon-wrapper">
                                        <Icon icon="mdi:star" :class="{ collected: isCollected }" />
                                    </div>
                                </el-tooltip>
                                <span class="count">{{ formatCount(collectedCount) }}</span>
                            </div>

                            <div class="sidebar-item" @click.stop="openRepostDialog">
                                <el-tooltip content="分享" placement="left">
                                    <div class="icon-wrapper">
                                        <Icon icon="mdi:share" />
                                    </div>
                                </el-tooltip>
                                <span class="count">{{ formatCount(postData.shareCount) }}</span>
                            </div>
                        </div>
                    </div>

                    <VideoCommentsPanel
                        ref="commentsPanelRef"
                        v-model:visible="commentPanelVisible"
                        v-model:activeTab="activePanelTab"
                        v-model:commentDraft="commentDraft"
                        :local-comment-count="localCommentCount"
                        :show-collection-tab="showCollectionTab"
                        :comment-items="commentItems"
                        :comment-loading="commentLoading"
                        :comment-no-more="commentNoMore"
                        :detail-content="detailContent"
                        :detail-tags="detailTags"
                        :active-collection-name="activeCollectionName"
                        :collection-loading="collectionLoading"
                        :collection-video-posts="collectionVideoPosts"
                        :comment-placeholder="commentPlaceholder"
                        :reply-target="replyTarget"
                        :can-delete-comment="canDeleteComment"
                        :resolve-reply-state="resolveReplyState"
                        :is-current-collection-post="isCurrentCollectionPost"
                        @tab-click="handlePanelTabClick"
                        @load-more-comments="loadMoreComments"
                        @reply-comment="handleReplyToComment"
                        @reply-reply="handleReplyToReply"
                        @delete-comment="handleDeleteComment"
                        @toggle-replies="toggleReplies"
                        @load-replies="loadReplies"
                        @clear-reply="clearReplyTarget"
                        @submit-comment="submitComment"
                        @select-collection="handleSelectCollectionPost"
                    />
                </div>
            </div>
        </div>

        <VideoRepostDialog v-model="repostDialogVisible" v-model:content="repostContent" :can-submit="canSubmitRepost" @submit="submitRepost" />
    </component>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getImgUrl } from '@/utils/img'
import useUserStore from '@/store/modules/user'
import {
    buildContentParts,
    formatClock,
    formatCount,
    formatDate,
    resolveActiveFlag,
    resolveFollowFlag,
    resolveVideoPoster
} from '@/features/content/personProfile/videoModule/helpers'
import { useVideoCommentsPanel } from '@/features/content/personProfile/videoModule/composables/useVideoCommentsPanel'
import { useVideoPlayerControls } from '@/features/content/personProfile/videoModule/composables/useVideoPlayerControls'
import VideoCommentsPanel from './components/VideoCommentsPanel.vue'
import VideoRepostDialog from './components/VideoRepostDialog.vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    src: { type: String, default: '' },
    post: { type: Object, default: () => ({}) },
    userInfo: { type: Object, default: () => ({}) },
    authorInfo: { type: Object, default: () => ({}) },
    useTeleport: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'close', 'action', 'select-collection'])

const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const router = useRouter()

const teleportWrapper = computed(() => (props.useTeleport ? 'teleport' : 'div'))
const teleportAttrs = computed(() => (props.useTeleport ? { to: 'body' } : {}))
const visible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

const postData = computed(() => props.post || {})
const userInfoRef = computed(() => props.userInfo || {})
const srcRef = computed(() => props.src || '')
const videoPosterUrl = computed(() => resolveVideoPoster(postData.value))

const isLiked = computed(() =>
    resolveActiveFlag(postData.value?.like ?? postData.value?.isLiked ?? postData.value?.liked ?? postData.value?.likeStatus ?? postData.value?.isLike)
)
const isCollected = computed(() =>
    resolveActiveFlag(
        postData.value?.bookmark ?? postData.value?.isCollected ?? postData.value?.collected ?? postData.value?.collectStatus ?? postData.value?.isCollect
    )
)
const isFollowing = computed(() =>
    resolveFollowFlag(
        postData.value?.follow ??
            postData.value?.isFollow ??
            postData.value?.isFollowing ??
            postData.value?.followed ??
            postData.value?.followStatus ??
            postData.value?.following
    )
)
const currentUserId = computed(() => props.userInfo?.id ?? props.userInfo?.userId ?? userStore.id ?? userStore.userId ?? null)
const authorUserId = computed(
    () => postData.value?.userId ?? postData.value?.authorId ?? postData.value?.createBy ?? postData.value?.user?.id ?? postData.value?.author?.id ?? null
)
const isAuthorSelf = computed(() => {
    const currentId = currentUserId.value
    const authorId = authorUserId.value
    if (currentId == null || authorId == null) return false
    return String(currentId) === String(authorId)
})

const emitAction = (type, payload) => {
    emit('action', type, payload)
}

const commentsPanelRef = ref(null)
const focusCommentInput = () => {
    nextTick(() => commentsPanelRef.value?.focusInput?.())
}

const {
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
    isPlaying,
    controlsVisible,
    isDraggingProgress,
    progressDraft,
    progressHover,
    progressShown,
    progressMax,
    canSeekVideo,
    canTogglePlayback,
    isBufferingForControl,
    hasRenderedFirstFrame,
    hasDuration,
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
} = useVideoPlayerControls({
    visible,
    src: srcRef,
    videoPosterUrl
})

const {
    commentPanelVisible,
    commentDraft,
    commentItems,
    commentLoading,
    commentNoMore,
    localCommentCount,
    commentPlaceholder,
    replyTarget,
    repostDialogVisible,
    repostContent,
    canSubmitRepost,
    activePanelTab,
    activeCollectionName,
    showCollectionTab,
    collectionLoading,
    collectionVideoPosts,
    canDeleteComment,
    resolveReplyState,
    loadMoreComments,
    handleReplyToComment,
    handleReplyToReply,
    toggleReplies,
    loadReplies,
    handleDeleteComment,
    clearReplyTarget,
    openRepostDialog,
    submitRepost,
    toggleCommentPanel,
    openDetailPanel,
    submitComment,
    handlePanelTabClick,
    handleSelectCollectionPost,
    isCurrentCollectionPost
} = useVideoCommentsPanel({
    visible,
    postData,
    userInfo: userInfoRef,
    currentUserId,
    proxy,
    focusCommentInput,
    emitAction,
    emitSelectCollection: post => emit('select-collection', post)
})

const followRequested = ref(false)
const showFollowCheck = ref(false)
let followCheckTimer = null
let followRequestResetTimer = null

const showFollowBadge = computed(() => !isAuthorSelf.value && (!isFollowing.value || showFollowCheck.value))
const followBadgeIcon = computed(() => (showFollowCheck.value ? 'mdi:check' : 'mdi:plus'))
const collectedCount = computed(() => postData.value.bookmarkCount ?? postData.value.collectCount ?? 0)

const authorName = computed(() => {
    const p = postData.value || {}
    const a = props.authorInfo || {}
    return p.nickName || p.authorName || p.userName || p.username || p.author?.nickName || p.user?.nickName || a.nickName || a.userName || a.name || '未知用户'
})

const authorAvatar = computed(() => {
    const p = postData.value || {}
    const a = props.authorInfo || {}
    const avatar = p.avatar || p.userAvatar || p.authorAvatar || p.author?.avatar || p.user?.avatar || a.avatar || a.userAvatar || ''
    return getImgUrl(avatar)
})

const contentParts = computed(() => buildContentParts(postData.value?.content || ''))
const detailContent = computed(() => String(postData.value?.content ?? '').trim())
const detailTags = computed(() => {
    const raw = postData.value
    const tags = []

    if (Array.isArray(raw?.tags)) {
        raw.tags.forEach(tag => {
            const text = String(tag?.tagName ?? tag?.name ?? tag?.label ?? tag?.title ?? '').trim()
            if (text) tags.push(text)
        })
    }
    if (Array.isArray(raw?.tagList)) {
        raw.tagList.forEach(tag => {
            const text = String(tag?.tagName ?? tag?.name ?? tag?.label ?? tag?.title ?? '').trim()
            if (text) tags.push(text)
        })
    }
    if (typeof raw?.tagStr === 'string') {
        raw.tagStr
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
            .forEach(item => tags.push(item))
    }
    if (Array.isArray(raw?.tagNames)) {
        raw.tagNames.forEach(item => {
            const text = String(item || '').trim()
            if (text) tags.push(text)
        })
    }
    if (tags.length === 0) {
        const matches = String(raw?.content ?? '').match(/#[^#\s]+/g) || []
        matches
            .map(item => item.replace(/^#/, '').trim())
            .filter(Boolean)
            .forEach(item => tags.push(item))
    }

    return Array.from(new Set(tags))
})

const resolveBackgroundUrl = () => {
    const list = Array.isArray(postData.value?.mediaList) ? postData.value.mediaList : []
    if (list.length > 1) return list[0]
    if (list.length === 1 && list[0] && list[0] !== props.src) return list[0]
    const fallback = postData.value?.cover || postData.value?.coverUrl || postData.value?.thumbnail || postData.value?.poster
    if (!fallback) return ''
    return getImgUrl(fallback)
}

const bgStyle = computed(() => {
    const background = String(resolveBackgroundUrl() || '').trim()
    return background ? { backgroundImage: `url(${background})` } : {}
})

const glassSideStyle = computed(() => {
    const background = String(resolveBackgroundUrl() || videoPosterUrl.value || '').trim()
    return background ? { backgroundImage: `url(${background})` } : {}
})

const handleClose = () => {
    emit('update:modelValue', false)
    emit('close')
}

const resolvePersonProfileTarget = () => {
    const routes = router.getRoutes()
    const routeByComponent = routes.find(route => {
        const component = route.components?.default ?? route.component
        if (!component) return false
        const text = String(component)
        return text.includes('content/personProfile') || text.includes('personProfile/index')
    })
    if (routeByComponent) {
        return routeByComponent.name ? { name: routeByComponent.name } : { path: routeByComponent.path }
    }

    const routeByMeta = routes.find(route => route.meta?.pageKey === 'personProfile' || route.meta?.profileType === 'self')
    if (routeByMeta) {
        return routeByMeta.name ? { name: routeByMeta.name } : { path: routeByMeta.path }
    }

    const pathCandidates = ['/content/personProfile', '/content/person-profile', '/content/profile']
    const path = pathCandidates.find(candidate => routes.some(route => route.path === candidate))
    return path ? { path } : null
}

const handleAvatarClick = () => {
    const targetUserId = authorUserId.value
    if (targetUserId == null || targetUserId === '') return

    const targetUserIdText = String(targetUserId)
    const selfUserId = currentUserId.value
    if (selfUserId != null && String(selfUserId) === targetUserIdText) {
        const selfTarget = resolvePersonProfileTarget()
        if (selfTarget) {
            router.push(selfTarget)
            return
        }
    }

    router.push({ path: '/content/userProfile', query: { userId: targetUserIdText } })
}

const handleToggleFollow = () => {
    if (isAuthorSelf.value) return
    if (!isFollowing.value) {
        followRequested.value = true
        showFollowCheck.value = false
        if (followRequestResetTimer) clearTimeout(followRequestResetTimer)
        followRequestResetTimer = setTimeout(() => {
            followRequested.value = false
        }, 2000)
    }
    emitAction('follow', { active: !isFollowing.value })
}

const handleToggleLike = () => {
    emitAction('like', { active: !isLiked.value })
}

const handleToggleCollect = () => {
    emitAction('collect', { active: !isCollected.value })
}

watch(isFollowing, value => {
    if (!followRequested.value || !value) return
    followRequested.value = false
    showFollowCheck.value = true
    if (followCheckTimer) clearTimeout(followCheckTimer)
    followCheckTimer = setTimeout(() => {
        showFollowCheck.value = false
    }, 800)
})

defineExpose({ seekTo })

onBeforeUnmount(() => {
    if (followCheckTimer) clearTimeout(followCheckTimer)
    if (followRequestResetTimer) clearTimeout(followRequestResetTimer)
})
</script>

<style scoped lang="scss">
@use './styles.scss' as *;
</style>
