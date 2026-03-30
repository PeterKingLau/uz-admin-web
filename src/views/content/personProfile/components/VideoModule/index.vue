<template>
    <component :is="teleportWrapper" v-bind="teleportAttrs">
        <div
            v-show="visible"
            class="video-immersive-container"
            :class="{ 'page-mode': !props.useTeleport, 'is-audio-mode': isAudioMode }"
            @click="handleClose"
            @mousemove="onMouseMove"
            @mouseleave="onMouseLeave"
        >
            <div class="stage" @click.stop>
                <div ref="playerFrameRef" class="player-frame" :class="{ 'comment-open': commentPanelVisible }">
                    <div
                        ref="videoWrapperRef"
                        class="player-shell"
                        :class="[videoFitClass, { 'is-watermarked': showWatermark, 'is-portrait-video': usePortraitGlass, 'is-audio-mode': isAudioMode }]"
                        :style="playerShellStyle"
                        @click="togglePlay"
                        @contextmenu.prevent.stop
                    >
                        <div class="player-bg" :style="bgStyle"></div>
                        <div v-if="usePortraitGlass && !isAudioMode" class="portrait-glass-sides" aria-hidden="true">
                            <div class="glass-side left" :style="glassSideStyle"></div>
                            <div class="glass-side right" :style="glassSideStyle"></div>
                        </div>

                        <video
                            ref="playerRef"
                            :src="src"
                            :poster="videoPosterUrl || undefined"
                            class="video-element"
                            draggable="false"
                            playsinline
                            autoplay
                            preload="auto"
                            controlslist="nodownload noremoteplayback"
                            @contextmenu.prevent.stop
                            @dragstart.prevent
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
                            <div v-if="isAudioMode" class="audio-mode-overlay" @click.stop="togglePlay">
                                <div ref="audioModeCardRef" class="audio-mode-card" :class="{ dragging: isAudioDragging }" :style="audioCardStyle" @click.stop>
                                    <div class="audio-mode-top" @pointerdown="handleAudioDragStart">
                                        <div class="audio-mode-brand">
                                            <Icon icon="mdi:music-circle" class="audio-mode-brand-icon" />
                                            <span>音频播放</span>
                                        </div>
                                        <div class="audio-mode-actions">
                                            <button
                                                type="button"
                                                class="audio-mode-action-btn"
                                                aria-label="返回视频模式"
                                                @pointerdown.stop
                                                @click.stop="handleToggleAudioMode"
                                            >
                                                <Icon icon="mdi:arrow-expand-all" />
                                            </button>
                                            <button
                                                type="button"
                                                class="audio-mode-action-btn"
                                                aria-label="关闭播放器"
                                                @pointerdown.stop
                                                @click.stop="handleClose"
                                            >
                                                <Icon icon="mdi:close" />
                                            </button>
                                        </div>
                                    </div>
                                    <div class="audio-mode-main">
                                        <div class="audio-mode-cover">
                                            <img
                                                v-if="audioModeCoverUrl"
                                                :src="audioModeCoverUrl"
                                                alt="audio cover"
                                                class="audio-mode-cover-image"
                                                draggable="false"
                                                @contextmenu.prevent.stop
                                                @dragstart.prevent
                                            />
                                            <div v-else class="audio-mode-cover-fallback">
                                                <Icon icon="mdi:music-note" />
                                            </div>
                                        </div>
                                        <div class="audio-mode-content">
                                            <div class="audio-mode-title">{{ authorName }}</div>
                                            <div class="audio-mode-subline">
                                                <div class="audio-mode-desc">{{ audioModeDescription }}</div>
                                                <div class="audio-mode-status" :class="{ loading: showVideoBuffering }">
                                                    <transition name="audio-status-swap" mode="out-in">
                                                        <Icon v-if="showVideoBuffering" key="loading" icon="mdi:loading" class="audio-mode-status-icon" />
                                                        <span v-else key="dot" class="audio-mode-status-dot"></span>
                                                    </transition>
                                                    <transition name="audio-status-swap" mode="out-in">
                                                        <span :key="audioStatusText">{{ audioStatusText }}</span>
                                                    </transition>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="audio-mode-track" @click.stop="handleAudioProgressClick">
                                        <div class="audio-mode-track-fill" :style="{ width: `${audioModeProgressPercent}%` }"></div>
                                    </div>
                                    <div class="audio-mode-time">
                                        <span>{{ displayCurrentTime }}</span>
                                        <span>{{ displayDuration }}</span>
                                    </div>
                                    <div class="audio-mode-controls">
                                        <button type="button" class="audio-mode-control-btn" aria-label="后退15秒" @click.stop="seekRelative(-15)">
                                            <Icon icon="mdi:rewind-15" />
                                        </button>
                                        <button
                                            type="button"
                                            class="audio-mode-control-btn primary"
                                            :aria-label="isPlaying ? '暂停' : '播放'"
                                            @click.stop="handlePlayControlClick"
                                        >
                                            <transition name="audio-control-swap" mode="out-in">
                                                <Icon :key="playControlIcon" :icon="playControlIcon" />
                                            </transition>
                                        </button>
                                        <button type="button" class="audio-mode-control-btn" aria-label="前进15秒" @click.stop="seekRelative(15)">
                                            <Icon icon="mdi:fast-forward-15" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </transition>

                        <transition name="video-cover-fade">
                            <div
                                v-if="videoCoverOverlayVisible && videoPosterUrl"
                                class="video-cover-overlay"
                                @click.stop="togglePlay"
                                @contextmenu.prevent.stop
                            >
                                <img
                                    :src="videoPosterUrl"
                                    alt="video cover"
                                    class="video-cover-image"
                                    draggable="false"
                                    @contextmenu.prevent.stop
                                    @dragstart.prevent
                                />
                                <div class="video-cover-play">
                                    <Icon icon="mdi:play" />
                                </div>
                            </div>
                        </transition>

                        <transition name="video-buffer-fade">
                            <div v-if="showVideoBuffering && !isAudioMode" class="video-buffer-overlay" aria-live="polite">
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

                        <div
                            class="bottom-progress-layer"
                            :class="{ ready: isPlayerUiReady, 'hide-controls': isPlayerUiReady && !controlsVisible && isPlaying }"
                        >
                            <div
                                ref="progressContainerRef"
                                class="progress-container"
                                :class="{ disabled: !canSeekVideo }"
                                @mousemove="onProgressHover"
                                @mouseleave="onProgressLeave"
                                @click.stop="onProgressTrackClick"
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
                        </div>

                        <div class="bottom-info-layer" :class="{ ready: isPlayerUiReady, 'hide-controls': isPlayerUiReady && !controlsVisible && isPlaying }">
                            <div class="info-content">
                                <div class="author-line">
                                    <div class="author-name" @click.stop="openAuthorWorksPanel">@{{ authorName }}</div>
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
                        </div>

                        <div
                            class="bottom-controls-layer"
                            :class="{ ready: isPlayerUiReady, 'hide-controls': isPlayerUiReady && !controlsVisible && isPlaying }"
                        >
                            <div class="controls-layer" @click.stop>
                                <div class="control-row">
                                    <div class="left-controls">
                                        <div class="play-btn" :class="{ disabled: !canTogglePlayback }" @click="handlePlayControlClick">
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

                                        <div
                                            class="icon-btn"
                                            :class="{ active: isAudioMode, loading: audioModeBusy, rotating: isAudioMode }"
                                            @click="handleToggleAudioMode"
                                        >
                                            <Icon :icon="isAudioMode ? 'mdi:music-circle' : 'mdi:music-note-outline'" />
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

                            <div class="sidebar-item" :class="{ active: isAudioMode, disabled: audioModeBusy }" @click.stop="handleToggleAudioMode">
                                <el-tooltip content="转音频" placement="left">
                                    <div class="icon-wrapper">
                                        <Icon :icon="isAudioMode ? 'mdi:music-circle' : 'mdi:music-note-outline'" />
                                    </div>
                                </el-tooltip>
                            </div>
                        </div>
                    </div>

                    <VideoCommentsPanel
                        ref="commentsPanelRef"
                        v-model:visible="commentPanelVisible"
                        v-model:activeTab="activePanelTab"
                        v-model:commentDraft="commentDraft"
                        :local-comment-count="localCommentCount"
                        :show-author-works-tab="showAuthorWorksTab"
                        :author-name="authorPanelName"
                        :author-avatar="authorPanelAvatar"
                        :author-signature="authorPanelSignature"
                        :author-followers="authorPanelFollowers"
                        :author-liked-count="authorPanelLikedCount"
                        :author-works-loading="authorWorksLoading"
                        :author-works-no-more="authorWorksNoMore"
                        :author-video-posts="authorVideoPosts"
                        :show-follow-button="!isAuthorSelf"
                        :follow-button-label="showFollowCheck ? '已关注' : isFollowing ? '已关注' : '+ 关注'"
                        :follow-button-active="isFollowing || showFollowCheck"
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
                        @load-more-author-works="loadMoreAuthorWorks"
                        @reply-comment="handleReplyToComment"
                        @reply-reply="handleReplyToReply"
                        @delete-comment="handleDeleteComment"
                        @toggle-replies="toggleReplies"
                        @load-replies="loadReplies"
                        @clear-reply="clearReplyTarget"
                        @submit-comment="submitComment"
                        @toggle-follow-author="handleToggleFollow"
                        @select-collection="handleSelectCollectionPost"
                    />
                </div>
            </div>
        </div>

        <VideoRepostDialog v-model="repostDialogVisible" v-model:content="repostContent" :can-submit="canSubmitRepost" @submit="submitRepost" />
    </component>
</template>

<script setup>
defineOptions({ name: 'ViewsContentPersonProfileComponentsVideoModule' })
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const authorInfoRef = computed(() => props.authorInfo || {})
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
    playControlIcon,
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
} = useVideoPlayerControls({
    visible,
    src: srcRef,
    videoPosterUrl
})

const isAudioMode = ref(false)
const audioModeBusy = ref(false)
const audioModeCardRef = ref(null)
const isAudioDragging = ref(false)
const audioDragOffsetX = ref(0)
const audioDragOffsetY = ref(0)
const audioDragStartX = ref(0)
const audioDragStartY = ref(0)
const audioDragOriginX = ref(0)
const audioDragOriginY = ref(0)

const panelAuthorName = computed(() => {
    const p = postData.value || {}
    const a = props.authorInfo || {}
    return p.nickName || p.authorName || p.userName || p.username || p.author?.nickName || p.user?.nickName || a.nickName || a.userName || a.name || '未知用户'
})

const panelAuthorAvatar = computed(() => {
    const p = postData.value || {}
    const a = props.authorInfo || {}
    const avatar = p.avatar || p.userAvatar || p.authorAvatar || p.author?.avatar || p.user?.avatar || a.avatar || a.userAvatar || ''
    return getImgUrl(avatar)
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
    showAuthorWorksTab,
    authorPanelName,
    authorPanelAvatar,
    authorPanelSignature,
    authorPanelFollowers,
    authorPanelLikedCount,
    authorWorksLoading,
    authorWorksNoMore,
    authorVideoPosts,
    activeCollectionName,
    showCollectionTab,
    collectionLoading,
    collectionVideoPosts,
    canDeleteComment,
    resolveReplyState,
    loadMoreComments,
    loadMoreAuthorWorks,
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
    openAuthorWorksPanel,
    submitComment,
    handlePanelTabClick,
    handleSelectCollectionPost,
    isCurrentCollectionPost
} = useVideoCommentsPanel({
    visible,
    postData,
    userInfo: userInfoRef,
    authorInfo: authorInfoRef,
    authorUserId,
    authorName: panelAuthorName,
    authorAvatar: panelAuthorAvatar,
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

const audioModeCoverUrl = computed(() => String(resolveBackgroundUrl() || videoPosterUrl.value || '').trim())
const audioModeDescription = computed(() => {
    const content = String(postData.value?.content ?? '').trim()
    if (content) return content
    return '已切换为后台音频播放模式'
})
const audioModeProgressPercent = computed(() => {
    const max = Number(progressMax.value || 0)
    if (!max) return 0
    return Math.max(0, Math.min(100, (Number(progressShown.value || 0) / max) * 100))
})
const audioStatusText = computed(() => {
    if (showVideoBuffering.value) return '加载中'
    return isPlaying.value ? '播放中' : '已暂停'
})
const audioCardStyle = computed(() => ({
    transform: `translate3d(${audioDragOffsetX.value}px, ${audioDragOffsetY.value}px, 0)`
}))

const getAudioViewportPadding = () => (window.innerWidth <= 768 ? 12 : 20)
const resetAudioCardPosition = () => {
    audioDragOffsetX.value = 0
    audioDragOffsetY.value = 0
}
const clampAudioCardOffset = (x, y) => {
    const cardEl = audioModeCardRef.value
    if (!cardEl) return { x, y }

    const padding = getAudioViewportPadding()
    const minX = -Math.max(0, window.innerWidth - padding * 2 - cardEl.offsetWidth)
    const minY = -Math.max(0, window.innerHeight - padding * 2 - cardEl.offsetHeight)

    return {
        x: Math.max(minX, Math.min(0, x)),
        y: Math.max(minY, Math.min(0, y))
    }
}
const syncAudioCardPosition = () => {
    const next = clampAudioCardOffset(audioDragOffsetX.value, audioDragOffsetY.value)
    audioDragOffsetX.value = next.x
    audioDragOffsetY.value = next.y
}
const removeAudioDragListeners = () => {
    window.removeEventListener('pointermove', handleAudioDragMove)
    window.removeEventListener('pointerup', handleAudioDragEnd)
    window.removeEventListener('pointercancel', handleAudioDragEnd)
}
const handleAudioDragMove = event => {
    if (!isAudioDragging.value) return

    const next = clampAudioCardOffset(
        audioDragOriginX.value + (event.clientX - audioDragStartX.value),
        audioDragOriginY.value + (event.clientY - audioDragStartY.value)
    )
    audioDragOffsetX.value = next.x
    audioDragOffsetY.value = next.y
}
const handleAudioDragEnd = () => {
    if (!isAudioDragging.value) return
    isAudioDragging.value = false
    removeAudioDragListeners()
}
const handleAudioDragStart = event => {
    if (!isAudioMode.value || audioModeBusy.value) return
    if (event.button != null && event.button !== 0) return

    isAudioDragging.value = true
    audioDragStartX.value = event.clientX
    audioDragStartY.value = event.clientY
    audioDragOriginX.value = audioDragOffsetX.value
    audioDragOriginY.value = audioDragOffsetY.value

    window.addEventListener('pointermove', handleAudioDragMove)
    window.addEventListener('pointerup', handleAudioDragEnd)
    window.addEventListener('pointercancel', handleAudioDragEnd)
    event.preventDefault()
}

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

const seekRelative = delta => {
    const base = Number(progressShown.value || 0)
    seekTo(base + Number(delta || 0))
}

const handleAudioProgressClick = event => {
    const target = event.currentTarget
    const max = Number(progressMax.value || 0)
    if (!target || !max) return
    const rect = target.getBoundingClientRect()
    if (!rect.width) return
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    seekTo(max * ratio)
}

const handleToggleAudioMode = async () => {
    if (audioModeBusy.value) return
    audioModeBusy.value = true
    const next = !isAudioMode.value
    try {
        isAudioMode.value = next
        if (next) {
            resetAudioCardPosition()
            await nextTick()
            syncAudioCardPosition()
            if (pipActive.value) {
                await exitPiP()
            }
            return
        }
    } finally {
        audioModeBusy.value = false
    }
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

watch(isAudioMode, async value => {
    if (!value) {
        handleAudioDragEnd()
        resetAudioCardPosition()
        return
    }
    await nextTick()
    syncAudioCardPosition()
})

watch(
    () => [visible.value, srcRef.value],
    ([nextVisible]) => {
        if (nextVisible) return
        handleAudioDragEnd()
        isAudioMode.value = false
        audioModeBusy.value = false
        resetAudioCardPosition()
    }
)

defineExpose({ seekTo })

onMounted(() => {
    window.addEventListener('resize', syncAudioCardPosition)
})

onBeforeUnmount(() => {
    removeAudioDragListeners()
    window.removeEventListener('resize', syncAudioCardPosition)
    if (followCheckTimer) clearTimeout(followCheckTimer)
    if (followRequestResetTimer) clearTimeout(followRequestResetTimer)
})
</script>

<style scoped lang="scss">
@use './styles.scss' as *;
</style>
