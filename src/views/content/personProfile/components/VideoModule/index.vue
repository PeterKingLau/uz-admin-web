<template>
    <component :is="teleportWrapper" v-bind="teleportAttrs">
        <div
            v-if="visible"
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
                            @loadedmetadata="onLoadedMeta"
                            @timeupdate="onTimeUpdate"
                            @durationchange="onDurationChange"
                            @play="onPlay"
                            @playing="onPlaying"
                            @pause="onPause"
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

                        <div v-if="showPauseOverlay" class="pause-overlay" @click.stop="togglePlay">
                            <Icon icon="mdi:play" class="pause-overlay-icon" />
                        </div>

                        <div class="top-bar" :class="{ 'hide-controls': !controlsVisible && isPlaying }">
                            <div class="close-btn" @click.stop="handleClose">
                                <Icon icon="ep:close" />
                            </div>
                        </div>

                        <div class="bottom-info-layer" :class="{ 'hide-controls': !controlsVisible && isPlaying }">
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
                                    class="progress-container"
                                    ref="progressContainerRef"
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
                                        @update:modelValue="onProgressDrag"
                                        @input="onProgressDrag"
                                        @change="onProgressCommit"
                                        class="progress-slider"
                                    />
                                </div>

                                <div class="control-row">
                                    <div class="left-controls">
                                        <div class="play-btn" @click="togglePlay">
                                            <Icon :icon="isPlaying ? 'mdi:pause' : 'mdi:play'" />
                                        </div>
                                        <div class="time-display">
                                            <span>{{ formatClock(currentTime) }}</span>
                                            <span class="sep">/</span>
                                            <span>{{ formatClock(duration) }}</span>
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
                                                    @input="applyVolume"
                                                    class="volume-slider"
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
                                                                v-for="r in rates"
                                                                :key="r"
                                                                class="speed-item"
                                                                :class="{ active: playbackRate === r }"
                                                                @click="applyRate(r)"
                                                            >
                                                                {{ r }}x
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="icon-btn" :class="{ disabled: !pipSupported }" @click="togglePiP" title="画中画">
                                            <Icon :icon="pipIcon" />
                                        </div>

                                        <div class="icon-btn" @click="toggleFullscreen" title="全屏">
                                            <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="right-sidebar">
                            <div class="sidebar-item avatar-wrapper">
                                <el-avatar :size="48" :src="authorAvatar" class="author-avatar" @click.stop="handleAvatarClick" />
                                <button v-if="showFollowBadge" type="button" class="follow-badge" @click.stop="handleToggleFollow" aria-label="关注">
                                    <Icon :icon="followBadgeIcon" />
                                </button>
                            </div>

                            <div class="sidebar-item" @click.stop="handleToggleLike">
                                <div class="icon-wrapper">
                                    <Icon icon="mdi:heart" :class="{ liked: isLiked }" />
                                </div>
                                <span class="count">{{ formatCount(postData.likeCount) }}</span>
                            </div>

                            <div class="sidebar-item" :class="{ active: commentPanelVisible }" @click.stop="toggleCommentPanel">
                                <div class="icon-wrapper">
                                    <Icon icon="mdi:comment-processing" />
                                </div>
                                <span class="count">{{ formatCount(localCommentCount) }}</span>
                            </div>

                            <div class="sidebar-item" @click.stop="handleToggleCollect">
                                <div class="icon-wrapper">
                                    <Icon icon="mdi:star" :class="{ collected: isCollected }" />
                                </div>
                                <span class="count">{{ formatCount(collectedCount) }}</span>
                            </div>

                            <div class="sidebar-item" @click.stop="openRepostDialog">
                                <div class="icon-wrapper">
                                    <Icon icon="mdi:share" />
                                </div>
                                <span class="count">{{ formatCount(postData.shareCount) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="comment-panel" :class="{ open: commentPanelVisible, 'with-collection': showCollectionTab }" @click.stop>
                        <div class="comment-panel-header">
                            <div class="header-left">
                                <el-tabs v-model="activePanelTab" class="panel-tabs" @tab-click="handlePanelTabClick">
                                    <el-tab-pane name="detail" label="详情" />
                                    <el-tab-pane name="comments" :label="`评论 ${formatCount(localCommentCount)}`" />
                                    <el-tab-pane v-if="showCollectionTab" name="collection" label="合集" />
                                </el-tabs>
                            </div>
                            <div class="panel-close" @click="commentPanelVisible = false">
                                <Icon icon="ep:close" />
                            </div>
                        </div>

                        <div class="comment-panel-body" ref="commentBodyRef" @scroll="handleCommentScroll">
                            <template v-if="activePanelTab === 'comments'">
                                <div v-if="commentItems.length === 0 && !commentLoading" class="comment-empty">
                                    <Icon icon="mdi:comment-outline" class="empty-icon" />
                                    <span>暂无评论，快来抢沙发~</span>
                                </div>

                                <div class="comment-list-wrapper">
                                    <div v-for="(comment, index) in commentItems" :key="comment.id ?? index" class="comment-item">
                                        <el-avatar :size="32" :src="getCommentAvatar(comment)" class="comment-avatar" />
                                        <div class="comment-main">
                                            <div class="comment-header">
                                                <span class="comment-name">{{ getCommentName(comment) }}</span>
                                                <span class="comment-time">{{ formatCommentTime(comment.createTime) }}</span>
                                            </div>
                                            <div class="comment-content" @click="handleReplyToComment(comment)">
                                                {{ comment.content }}
                                            </div>

                                            <div class="comment-footer">
                                                <div class="footer-actions">
                                                    <span class="action-btn" @click="handleReplyToComment(comment)">回复</span>
                                                    <span v-if="canDeleteComment(comment)" class="action-btn delete" @click.stop="handleDeleteComment(comment)"
                                                        >删除</span
                                                    >
                                                </div>

                                                <div v-if="Number(comment.replyCount || 0) > 0" class="expand-reply-btn" @click="toggleReplies(comment)">
                                                    <span class="line"></span>
                                                    <span>{{ resolveReplyState(comment).open ? '收起回复' : `展开 ${comment.replyCount} 条回复` }}</span>
                                                    <Icon
                                                        :icon="resolveReplyState(comment).open ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                                                        class="icon-chevron"
                                                    />
                                                </div>
                                            </div>

                                            <div class="comment-replies" v-if="resolveReplyState(comment).open">
                                                <div v-for="(reply, rIndex) in resolveReplyState(comment).list" :key="reply.id ?? rIndex" class="reply-item">
                                                    <el-avatar :size="24" :src="getCommentAvatar(reply)" class="reply-avatar" />
                                                    <div class="reply-main">
                                                        <div class="reply-header">
                                                            <span class="reply-name">{{ getCommentName(reply) }}</span>
                                                            <span v-if="reply.replyUserNickName" class="reply-target">
                                                                <Icon icon="mdi:menu-right" class="arrow-icon" />
                                                                <span>{{ reply.replyUserNickName }}</span>
                                                            </span>
                                                        </div>
                                                        <div class="reply-content" @click="handleReplyToReply(reply, comment)">
                                                            {{ reply.content }}
                                                        </div>
                                                        <div class="reply-footer">
                                                            <span class="reply-time">{{ formatCommentTime(reply.createTime) }}</span>
                                                            <span class="action-btn" @click="handleReplyToReply(reply, comment)">回复</span>
                                                            <span
                                                                v-if="canDeleteComment(reply)"
                                                                class="action-btn delete"
                                                                @click.stop="handleDeleteComment(reply, comment)"
                                                                >删除</span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>

                                                <div v-if="!resolveReplyState(comment).noMore" class="load-more-replies">
                                                    <span class="load-more-text" @click="loadReplies(comment)">
                                                        {{ resolveReplyState(comment).loading ? '正在加载...' : '查看更多回复' }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="commentLoading" class="comment-loading">
                                    <div class="loading-spinner"></div>
                                </div>
                                <div v-if="commentNoMore && commentItems.length > 0" class="comment-end">- 没有更多评论了 -</div>
                            </template>

                            <template v-else-if="activePanelTab === 'detail'">
                                <div class="detail-panel">
                                    <div class="detail-section">
                                        <div class="detail-label">正文</div>
                                        <div v-if="detailContent" class="detail-content-text">{{ detailContent }}</div>
                                        <div v-else class="detail-empty">暂无正文内容</div>
                                    </div>
                                    <div class="detail-section">
                                        <div class="detail-label">标签</div>
                                        <div v-if="detailTags.length" class="detail-tags">
                                            <span v-for="tag in detailTags" :key="tag" class="detail-tag">#{{ tag }}</span>
                                        </div>
                                        <div v-else class="detail-empty">暂无标签</div>
                                    </div>
                                </div>
                            </template>

                            <template v-else>
                                <div class="collection-panel-title">
                                    <Icon icon="mdi:playlist-play" class="collection-icon" />
                                    合集 · {{ activeCollectionName || '未命名合集' }}
                                </div>
                                <div v-if="collectionLoading" class="collection-loading">加载中...</div>
                                <div v-else-if="collectionVideoPosts.length === 0" class="collection-empty">暂无合集视频</div>
                                <div v-else class="collection-list">
                                    <button
                                        v-for="item in collectionVideoPosts"
                                        :key="getPostId(item) ?? item.id"
                                        type="button"
                                        class="collection-item"
                                        :class="{ active: isCurrentCollectionPost(item) }"
                                        @click="handleSelectCollectionPost(item)"
                                    >
                                        <div class="collection-thumb">
                                            <el-image
                                                v-if="resolveCollectionCover(item)"
                                                :src="resolveCollectionCover(item)"
                                                fit="cover"
                                                class="collection-cover"
                                            />
                                            <div v-else class="collection-thumb-empty">
                                                <Icon icon="mdi:video-outline" />
                                            </div>
                                            <div v-if="isCurrentCollectionPost(item)" class="playing-overlay">
                                                <div class="bar-anim"><span></span><span></span><span></span></div>
                                            </div>
                                        </div>
                                        <div class="collection-info">
                                            <div class="collection-title">{{ resolveCollectionTitle(item) }}</div>
                                            <div class="collection-meta">{{ formatDate(item.createTime) }}</div>
                                        </div>
                                    </button>
                                </div>
                            </template>
                        </div>

                        <div v-if="activePanelTab === 'comments'" class="comment-panel-footer">
                            <transition name="fade">
                                <div v-if="replyTarget" class="reply-context-bar">
                                    <div class="reply-info">
                                        <span class="prefix">回复</span>
                                        <span class="name">@{{ replyTarget.replyUserName }}</span>
                                    </div>
                                    <div class="cancel-reply" @click="clearReplyTarget">
                                        <Icon icon="ep:close" />
                                    </div>
                                </div>
                            </transition>
                            <div class="input-area">
                                <el-input
                                    ref="commentInputRef"
                                    v-model="commentDraft"
                                    type="textarea"
                                    :autosize="{ minRows: 1, maxRows: 4 }"
                                    maxlength="200"
                                    :placeholder="commentPlaceholder"
                                    class="comment-input"
                                    @keydown.enter.exact.prevent="submitComment"
                                />
                                <div class="send-btn" :class="{ disabled: !commentDraft.trim() }" @click="submitComment">
                                    <Icon icon="mdi:send" class="send-icon" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <el-dialog v-model="repostDialogVisible" append-to-body destroy-on-close width="520px" class="repost-dialog" @closed="repostContent = ''">
            <template #header>
                <div class="repost-dialog-title">转发内容</div>
            </template>
            <div class="repost-dialog-body">
                <el-input
                    ref="repostInputRef"
                    v-model="repostContent"
                    type="textarea"
                    :rows="8"
                    placeholder="写点什么吧..."
                    maxlength="2000"
                    show-word-limit
                    resize="none"
                    class="custom-textarea"
                />
            </div>
            <template #footer>
                <div class="repost-dialog-footer">
                    <el-button text @click="repostDialogVisible = false">取消</el-button>
                    <el-button type="primary" :disabled="!canSubmitRepost" @click="submitRepost">转发</el-button>
                </div>
            </template>
        </el-dialog>
    </component>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getImgUrl } from '@/utils/img'
import { deleteComment, listCommentReplies, listTopComments } from '@/api/content/postComment'
import { getPostByCollection } from '@/api/content/collection'
import useUserStore from '@/store/modules/user'
import {
    buildContentParts,
    clamp,
    clampRate,
    formatClock,
    formatCommentTime,
    formatCount,
    formatDate,
    getCommentAvatar,
    getCommentName,
    getPostId,
    isCollectionVideoPost,
    isTypingTarget,
    normalizeCollectionPosts,
    resolveActiveFlag,
    resolveCollectionCover,
    resolveCollectionId,
    resolveCollectionNameFromResponse,
    resolveCollectionTitle,
    resolveFollowFlag,
    resolveVideoPoster
} from '@/features/content/personProfile/videoModule/helpers'

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
    set: v => emit('update:modelValue', v)
})

const postData = computed(() => props.post || {})

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
const followRequested = ref(false)
const showFollowCheck = ref(false)
let followCheckTimer = null
let followRequestResetTimer = null

const showFollowBadge = computed(() => !isAuthorSelf.value && (!isFollowing.value || showFollowCheck.value))
const followBadgeIcon = computed(() => (showFollowCheck.value ? 'mdi:check' : 'mdi:plus'))
const playerRef = ref(null)
const playerFrameRef = ref(null)
const videoWrapperRef = ref(null)
const commentInputRef = ref(null)

const showWatermark = ref(false)
const videoFitMode = ref('height')
const videoPillarSize = ref(0)
const isPortraitVideo = ref(false)
const commentPanelVisible = ref(false)
const commentDraft = ref('')
const commentBodyRef = ref(null)
const commentItems = ref([])
const commentLoading = ref(false)
const commentNoMore = ref(false)
const commentLastId = ref(undefined)
const commentLastCreateTime = ref(undefined)
const localCommentCount = ref(0)
const commentPageSize = 10
const replyStateMap = ref({})
const replyTarget = ref(null)
const deleteCommentLoading = reactive({})
const commentRefreshing = ref(false)
const repostDialogVisible = ref(false)
const repostContent = ref('')
const repostInputRef = ref(null)
const canSubmitRepost = computed(() => Boolean(repostContent.value.trim()))

const isPlaying = ref(false)
const videoCoverOverlayVisible = ref(false)
const showPauseOverlay = computed(() => !isPlaying.value && !videoCoverOverlayVisible.value)

const duration = ref(0)
const currentTime = ref(0)

const isDraggingProgress = ref(false)
const progressDraft = ref(0)

const volume = ref(1)
const muted = ref(false)
const volumePanelVisible = ref(false)
const volumePercent = computed(() => Math.round((muted.value ? 0 : volume.value) * 100))

const rates = [0.75, 1.0, 1.25, 1.5, 2.0]
const playbackRate = ref(1)

const controlsVisible = ref(true)
let hideControlsTimer = null
let volumePanelHideTimer = null
let prevHtmlOverflow = ''
let prevBodyOverflow = ''
let prevHtmlScrollbarGutter = ''
let prevBodyScrollbarGutter = ''
let pageScrollLockedByPlayer = false

const pipSupported = ref(false)
const pipActive = ref(false)
const isFullscreen = ref(false)

const pipIcon = computed(() => (pipActive.value ? 'mdi:picture-in-picture-bottom-right' : 'mdi:picture-in-picture-bottom-right-outline'))

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

const collectedCount = computed(() => postData.value.bookmarkCount ?? postData.value.collectCount ?? 0)
const activePostId = computed(() => getPostId(postData.value))
const activeCollectionId = computed(() => resolveCollectionId(postData.value))
const resolveCollectionName = post =>
    post?.collectionName || post?.postCollectionDto?.collectionName || post?.collection?.name || post?.collection?.title || post?.collectionTitle || ''
const collectionNameFromApi = ref('')
const activeCollectionName = computed(() => collectionNameFromApi.value || resolveCollectionName(postData.value))
const showCollectionTab = computed(() => Boolean(activeCollectionId.value))
const activePanelTab = ref('comments')
const collectionPosts = ref([])
const collectionLoading = ref(false)
const collectionLoaded = ref(false)

const videoPosterUrl = computed(() => resolveVideoPoster(postData.value))

const collectionVideoPosts = computed(() => collectionPosts.value.filter(item => isCollectionVideoPost(item)))
const isCurrentCollectionPost = post => {
    const id = getPostId(post)
    if (id == null || activePostId.value == null) return false
    return String(id) === String(activePostId.value)
}

const loadCollectionPosts = async (force = false) => {
    if (collectionLoading.value) return
    if (!force && collectionLoaded.value) return
    const collectionId = activeCollectionId.value
    if (!collectionId) return
    collectionLoading.value = true
    try {
        const res = await getPostByCollection({ collectionId })
        collectionPosts.value = normalizeCollectionPosts(res)
        const resolvedName = resolveCollectionNameFromResponse(res)
        if (resolvedName) collectionNameFromApi.value = resolvedName
        collectionLoaded.value = true
    } catch (error) {
        console.error(error)
        collectionPosts.value = []
        collectionLoaded.value = false
    } finally {
        collectionLoading.value = false
    }
}

const getCommentId = comment => comment?.id ?? comment?.commentId ?? null
const getCommentUserId = comment => comment?.userId ?? comment?.user?.id ?? comment?.authorId ?? comment?.createBy ?? null
const canDeleteComment = comment => {
    const userId = currentUserId.value
    const commentUserId = getCommentUserId(comment)
    if (userId == null || commentUserId == null) return false
    return String(userId) === String(commentUserId)
}
const isDeleteCommentLoading = comment => {
    const commentId = getCommentId(comment)
    return commentId != null && Boolean(deleteCommentLoading[commentId])
}
const commentPlaceholder = computed(() => (replyTarget.value ? `回复 @${replyTarget.value.replyUserName}` : '善语结善缘，恶语伤人心'))

const ensureReplyState = commentId => {
    if (!commentId) return null
    if (!replyStateMap.value[commentId]) {
        replyStateMap.value[commentId] = {
            open: false,
            loading: false,
            noMore: false,
            lastId: undefined,
            lastCreateTime: undefined,
            list: []
        }
    }
    return replyStateMap.value[commentId]
}

const resolveReplyState = comment => {
    const commentId = getCommentId(comment)
    return ensureReplyState(commentId) || { open: false, loading: false, noMore: true, list: [] }
}

const findCommentById = commentId => commentItems.value.find(item => getCommentId(item) === commentId)

const clearReplyTarget = () => {
    replyTarget.value = null
}

const handleReplyToComment = comment => {
    const commentId = getCommentId(comment)
    if (!commentId) return
    replyTarget.value = {
        parentId: commentId,
        replyUserId: comment?.userId ?? comment?.user?.id ?? null,
        replyUserName: getCommentName(comment)
    }
    nextTick(() => commentInputRef.value?.focus?.())
}

const handleReplyToReply = (reply, parent) => {
    const parentId = getCommentId(parent)
    if (!parentId) return
    replyTarget.value = {
        parentId,
        replyUserId: reply?.userId ?? reply?.user?.id ?? null,
        replyUserName: getCommentName(reply)
    }
    nextTick(() => commentInputRef.value?.focus?.())
}

const resetComments = () => {
    commentItems.value = []
    commentLoading.value = false
    commentNoMore.value = false
    commentLastId.value = undefined
    commentLastCreateTime.value = undefined
    replyStateMap.value = {}
}

const loadTopComments = async ({ reset = false, silent = false } = {}) => {
    const postId = activePostId.value
    if (reset) {
        commentLastId.value = undefined
        commentLastCreateTime.value = undefined
        commentNoMore.value = false
        replyStateMap.value = {}
        if (!silent) commentItems.value = []
    }
    if (!postId) return
    if (!reset && commentNoMore.value) return
    if (silent) {
        if (commentRefreshing.value) return
        commentRefreshing.value = true
    } else {
        if (commentLoading.value || commentRefreshing.value) return
        commentLoading.value = true
    }
    try {
        const res = await listTopComments({
            postId,
            lastId: commentLastId.value,
            lastCreateTime: commentLastCreateTime.value,
            limit: commentPageSize
        })
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.rows) ? res.rows : []
        if (list.length) {
            commentItems.value = reset ? [...list] : [...commentItems.value, ...list]
            const lastItem = list[list.length - 1]
            commentLastId.value = lastItem?.id ?? commentLastId.value
            commentLastCreateTime.value = lastItem?.createTime ?? commentLastCreateTime.value
            if (list.length < commentPageSize) commentNoMore.value = true
        } else {
            if (reset) commentItems.value = []
            commentNoMore.value = true
        }
    } catch (error) {
        console.error(error)
    } finally {
        if (silent) commentRefreshing.value = false
        else commentLoading.value = false
    }
}

const handleCommentScroll = () => {
    if (activePanelTab.value !== 'comments') return
    const el = commentBodyRef.value
    if (!el || commentLoading.value || commentNoMore.value) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
        loadTopComments()
    }
}

const loadReplies = async comment => {
    const postId = activePostId.value
    const parentId = getCommentId(comment)
    if (!postId || !parentId) return
    const state = ensureReplyState(parentId)
    if (!state || state.loading || state.noMore) return
    state.loading = true
    try {
        const res = await listCommentReplies({
            postId,
            parentId,
            lastId: state.lastId,
            lastCreateTime: state.lastCreateTime,
            limit: commentPageSize
        })
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.rows) ? res.rows : []
        if (list.length) {
            state.list = [...state.list, ...list]
            const lastItem = list[list.length - 1]
            state.lastId = lastItem?.id ?? state.lastId
            state.lastCreateTime = lastItem?.createTime ?? state.lastCreateTime
            if (list.length < commentPageSize) state.noMore = true
        } else {
            state.noMore = true
        }
    } catch (error) {
        console.error(error)
    } finally {
        state.loading = false
    }
}

const toggleReplies = comment => {
    const commentId = getCommentId(comment)
    const state = ensureReplyState(commentId)
    if (!state) return
    state.open = !state.open
    if (state.open && state.list.length === 0) {
        loadReplies(comment)
    }
}

const updateCommentCount = delta => {
    const next = Number(localCommentCount.value || 0) + delta
    localCommentCount.value = Math.max(0, next)
}

const resolveReplyRemoveCount = (commentId, comment) => {
    const rawCount = Number(comment?.replyCount || 0)
    const replyCount = Number.isFinite(rawCount) ? rawCount : 0
    const state = replyStateMap.value?.[commentId]
    const loadedCount = Array.isArray(state?.list) ? state.list.length : 0
    return Math.max(replyCount, loadedCount)
}

const removeLocalComment = (commentId, parent) => {
    const targetId = String(commentId)
    if (parent) {
        const parentId = getCommentId(parent)
        const state = ensureReplyState(parentId)
        if (state) {
            state.list = state.list.filter(item => String(getCommentId(item)) !== targetId)
        }
        parent.replyCount = Math.max(0, Number(parent.replyCount || 0) - 1)
        updateCommentCount(-1)
    } else {
        const comment = findCommentById(commentId)
        const removeReplies = resolveReplyRemoveCount(targetId, comment)
        commentItems.value = commentItems.value.filter(item => String(getCommentId(item)) !== targetId)
        if (replyStateMap.value?.[targetId]) {
            delete replyStateMap.value[targetId]
        }
        updateCommentCount(-(1 + Math.max(0, removeReplies)))
    }
}

const handleDeleteComment = async (comment, parent) => {
    const commentId = getCommentId(comment)
    if (!commentId || !canDeleteComment(comment) || isDeleteCommentLoading(comment)) return
    if (String(commentId).startsWith('local-')) {
        proxy?.$modal?.msgWarning?.('评论正在同步，请稍后重试')
        loadTopComments({ reset: true, silent: true })
        return
    }
    try {
        await proxy?.$modal?.confirm?.('确认删除该评论？', '提示', {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            lockScroll: false
        })
    } catch {
        return
    }
    deleteCommentLoading[commentId] = true
    try {
        await deleteComment({ id: commentId, userId: currentUserId.value ?? undefined })
        removeLocalComment(commentId, parent)
        proxy?.$modal?.msgSuccess?.('删除成功')
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('删除失败')
    } finally {
        deleteCommentLoading[commentId] = false
    }
}

const contentParts = computed(() => buildContentParts(postData.value?.content || ''))
const detailContent = computed(() => String(postData.value?.content ?? '').trim())
const detailTags = computed(() => {
    const raw = postData.value
    const tags = []
    if (Array.isArray(raw?.tags)) {
        raw.tags.forEach(tag => {
            const name = tag?.tagName ?? tag?.name ?? tag?.label ?? tag?.title ?? ''
            const text = String(name || '').trim()
            if (text) tags.push(text)
        })
    }
    if (Array.isArray(raw?.tagList)) {
        raw.tagList.forEach(tag => {
            const name = tag?.tagName ?? tag?.name ?? tag?.label ?? tag?.title ?? ''
            const text = String(name || '').trim()
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
    const s = String(resolveBackgroundUrl() || '').trim()
    if (!s) return {}
    return { backgroundImage: `url(${s})` }
})

const glassSideStyle = computed(() => {
    const bg = String(resolveBackgroundUrl() || videoPosterUrl.value || '').trim()
    if (!bg) return {}
    return { backgroundImage: `url(${bg})` }
})

const playerShellStyle = computed(() => ({
    '--pillar-size': `${Math.max(0, Math.round(videoPillarSize.value))}px`
}))

const usePortraitGlass = computed(() => isPortraitVideo.value && videoPillarSize.value > 20)

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

const videoFitClass = computed(() => (videoFitMode.value === 'width' ? 'fit-width' : 'fit-height'))

const progressMax = computed(() => (duration.value > 0 ? duration.value : 0))

const progressShown = computed(() => (isDraggingProgress.value ? progressDraft.value : currentTime.value))

const progressContainerRef = ref(null)
const progressHover = reactive({ visible: false, time: 0, left: 0 })

const calcHoverLeftByTime = sec => {
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

const onProgressHover = event => {
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

const onProgressDrag = v => {
    const sec = Number(v || 0)
    isDraggingProgress.value = true
    progressDraft.value = sec
    progressHover.time = sec
    const left = calcHoverLeftByTime(sec)
    if (left != null) progressHover.left = left
    progressHover.visible = true
}

const commitProgressSeek = sec => {
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

const onProgressCommit = v => {
    const sec = Number(v || 0)
    isDraggingProgress.value = false
    progressDraft.value = sec
    commitProgressSeek(sec)
}

const onProgressTrackClick = event => {
    const target = event?.target
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

const applyRate = val => {
    const el = playerRef.value
    if (!el) return
    const next = clampRate(val ?? playbackRate.value ?? 1)
    playbackRate.value = next
    el.playbackRate = next
}

const applyVolume = () => {
    const el = playerRef.value
    if (!el) return
    const v = Math.min(1, Math.max(0, Number(volume.value)))
    el.volume = v
    if (v > 0 && el.muted) el.muted = false
}

const toggleMute = () => {
    const el = playerRef.value
    if (!el) return
    el.muted = !el.muted
    muted.value = el.muted
}

const handleVolumeButtonClick = () => {
    openVolumePanel()
    toggleMute()
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

const safePlay = async el => {
    if (!el?.play) return
    try {
        const result = el.play()
        if (result?.catch) await result
    } catch (error) {
        if (error?.name === 'AbortError') return
        console.error(error)
    }
}

const togglePlay = () => {
    const el = playerRef.value
    if (!el) return
    if (el.paused) safePlay(el)
    else el.pause?.()
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
    videoCoverOverlayVisible.value = false
}

const onPause = () => {
    isPlaying.value = false
    const el = playerRef.value
    if (!el) return
    if (Number(el.currentTime || 0) <= 0.08 && videoPosterUrl.value) {
        videoCoverOverlayVisible.value = true
    }
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
    } catch (e) {
        console.error(e)
    } finally {
        isFullscreen.value = Boolean(document.fullscreenElement)
        nextTick(() => updateWatermarkAndFit())
    }
}

const togglePiP = async () => {
    const el = playerRef.value
    if (!el || !document.pictureInPictureEnabled) return
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture()
            pipActive.value = false
        } else {
            await el.requestPictureInPicture()
            pipActive.value = true
        }
    } catch (e) {
        console.error(e)
        pipActive.value = Boolean(document.pictureInPictureElement)
    }
}

const handleClose = () => {
    emit('update:modelValue', false)
    emit('close')
}

const emitAction = (type, payload) => {
    emit('action', type, payload)
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
    if (path) return { path }

    return null
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

const openRepostDialog = () => {
    repostContent.value = ''
    repostDialogVisible.value = true
    nextTick(() => repostInputRef.value?.focus?.())
}

const submitRepost = () => {
    const content = repostContent.value.trim()
    if (!content) {
        proxy?.$modal?.msgWarning?.('请输入转发内容')
        return
    }
    emitAction('share', { content })
    repostDialogVisible.value = false
}

const toggleCommentPanel = () => {
    commentPanelVisible.value = !commentPanelVisible.value
    if (commentPanelVisible.value) {
        nextTick(() => commentInputRef.value?.focus?.())
        if (activePanelTab.value === 'collection' && showCollectionTab.value) {
            loadCollectionPosts()
        }
        return
    }
    clearReplyTarget()
    commentDraft.value = ''
    activePanelTab.value = 'comments'
}

const openDetailPanel = () => {
    commentPanelVisible.value = true
    activePanelTab.value = 'detail'
}

const submitComment = () => {
    const content = String(commentDraft.value || '').trim()
    if (!content) return
    const now = new Date()
    const parentId = replyTarget.value?.parentId ?? null
    const replyUserId = replyTarget.value?.replyUserId ?? null
    const replyUserName = replyTarget.value?.replyUserName ?? ''
    const draftItem = {
        id: `local-${now.getTime()}`,
        userId: props.userInfo?.id ?? props.userInfo?.userId ?? null,
        content,
        userName: props.userInfo?.nickName || props.userInfo?.userName || '',
        nickName: props.userInfo?.nickName || '',
        createTime: now.toISOString(),
        avatar: props.userInfo?.avatar || '',
        userAvatar: props.userInfo?.avatar || '',
        user: {
            avatar: props.userInfo?.avatar || ''
        }
    }
    if (parentId) {
        const parent = findCommentById(parentId)
        if (parent) {
            parent.replyCount = Number(parent.replyCount || 0) + 1
            const state = ensureReplyState(parentId)
            if (state) {
                state.open = true
                state.list = [
                    ...state.list,
                    {
                        ...draftItem,
                        parentId,
                        replyUserId,
                        replyUserNickName: replyUserName
                    }
                ]
            }
        }
    } else {
        commentItems.value = [draftItem, ...commentItems.value]
    }
    emitAction('comment', {
        content,
        parentCommentId: parentId,
        replyUserId,
        onSuccess: () => loadTopComments({ reset: true, silent: true })
    })
    commentDraft.value = ''
    clearReplyTarget()
}

const onKeydown = e => {
    if (!visible.value) return
    if (e.code !== 'Space' && e.key !== ' ') return
    if (isTypingTarget(e.target)) return
    e.preventDefault()
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
        } catch (e) {
            console.error(e)
        }
    }
    isPlaying.value = false
    showWatermark.value = false
    videoPillarSize.value = 0
    isPortraitVideo.value = false
    pipActive.value = false
    commentPanelVisible.value = false
    commentDraft.value = ''
    clearReplyTarget()

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
    if (!visible.value || !props.src) return
    await nextTick()
    const el = playerRef.value
    if (!el) return
    syncPiPSupport()
    window.addEventListener('resize', handleResize)
    document.addEventListener('fullscreenchange', handleResize)
    window.addEventListener('keydown', onKeydown)
    lockPageScroll()
    el.playbackRate = Number(playbackRate.value || 1)
    el.volume = Math.min(1, Math.max(0, Number(volume.value)))
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

watch(isPlaying, val => {
    if (val) {
        resetHideTimer()
    } else {
        controlsVisible.value = true
        if (hideControlsTimer) clearTimeout(hideControlsTimer)
    }
})

const seekTo = seconds => {
    const el = playerRef.value
    if (!el) return
    const v = Math.min(Number(el.duration || 0), Math.max(0, Number(seconds || 0)))
    el.currentTime = v
    currentTime.value = v
}

defineExpose({ seekTo })

watch(
    () => [visible.value, props.src],
    ([v]) => {
        if (v) initPlayer()
        else stopPlayer()
    },
    { immediate: true }
)

watch(
    () => [visible.value, props.src, videoPosterUrl.value],
    ([v]) => {
        videoCoverOverlayVisible.value = Boolean(v && videoPosterUrl.value)
    },
    { immediate: true }
)

watch(
    () => [commentPanelVisible.value, activePostId.value],
    ([open, postId], [prevOpen, prevPostId]) => {
        if (!postId) return
        if (!open) {
            if (postId !== prevPostId) resetComments()
            return
        }
        if (postId !== prevPostId || commentItems.value.length === 0) {
            loadTopComments({ reset: true })
        }
    }
)

watch(
    () => commentPanelVisible.value,
    open => {
        if (!open) {
            clearReplyTarget()
            commentDraft.value = ''
            activePanelTab.value = 'comments'
        }
    }
)

watch(
    () => activeCollectionId.value,
    () => {
        collectionPosts.value = []
        collectionLoaded.value = false
        collectionNameFromApi.value = ''
        if (!showCollectionTab.value) activePanelTab.value = 'comments'
    }
)

const setPanelTab = value => {
    if (activePanelTab.value === value) return
    activePanelTab.value = value
    if (value === 'collection' && showCollectionTab.value) {
        loadCollectionPosts()
    }
}

const handlePanelTabClick = tab => {
    const next = tab?.props?.name ?? tab?.paneName ?? activePanelTab.value
    setPanelTab(next)
}

const handleSelectCollectionPost = post => {
    if (isCurrentCollectionPost(post)) return
    emit('select-collection', post)
}
watch(
    () => [activePostId.value, postData.value?.commentCount],
    ([, count]) => {
        const next = Number(count ?? 0)
        localCommentCount.value = Number.isFinite(next) ? next : 0
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    if (followCheckTimer) clearTimeout(followCheckTimer)
    if (followRequestResetTimer) clearTimeout(followRequestResetTimer)
    clearVolumePanelHideTimer()
    stopPlayer()
})
</script>

<style scoped lang="scss">
@use '@/features/content/personProfile/videoModule/theme.scss' as videoTheme;

$color-bg: var(--vm-color-black);
$color-bg-panel: var(--vm-panel-bg-soft);
$color-bg-soft: var(--vm-white-5);
$color-bg-input: var(--vm-white-8);
$color-text-primary: var(--vm-white-90);
$color-text-secondary: var(--vm-white-70);
$color-text-muted: var(--vm-white-40);
$color-border: var(--vm-white-8);
$color-accent: var(--vm-color-accent);
$color-accent-hover: var(--vm-color-accent-hover);
$color-gold: var(--el-color-warning);

.video-immersive-container {
    @include videoTheme.video-module-theme-vars;

    position: fixed;
    inset: 0;
    background: $color-bg;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

    &.page-mode {
        position: relative;
        width: 100%;
        height: 100vh;
        z-index: 0;
    }
}

.stage {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.player-frame {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    overflow: hidden;
    background: $color-bg;
}

.player-shell {
    position: relative;
    flex: 1;
    height: 100%;
    overflow: hidden;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    --pillar-size: 0px;
}

.player-bg {
    position: absolute;
    inset: -40px;
    background-position: center;
    background-size: cover;
    filter: blur(60px) brightness(0.3);
    opacity: 0.6;
    transform: scale(1.2);
    pointer-events: none;
    z-index: 0;
}

.video-element {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    z-index: 2;
}

.player-shell.fit-height .video-element {
    width: auto;
    height: 100%;
    max-width: 100%;
}

.portrait-glass-sides {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
}

.glass-side {
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--pillar-size);
    background-position: center;
    background-size: cover;
    filter: blur(24px) brightness(0.5);
    opacity: 0.9;
    transform: scale(1.1);

    &.left {
        left: 0;
    }
    &.right {
        right: 0;
        transform: scale(1.1) scaleX(-1);
    }
}

.video-cover-overlay {
    position: absolute;
    inset: 0;
    z-index: 3;
    background: var(--vm-color-black);
    display: flex;
    align-items: center;
    justify-content: center;

    .video-cover-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        opacity: 0.8;
    }

    .video-cover-play {
        position: absolute;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--vm-black-40);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: var(--vm-color-white);
        border: 1px solid var(--vm-white-10);
    }
}

.pause-overlay {
    position: absolute;
    inset: 0;
    z-index: 8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: var(--vm-black-24);

    .pause-overlay-icon {
        width: 88px;
        height: 88px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        color: var(--vm-color-white);
        background: var(--vm-white-12);
        border: 1px solid var(--vm-white-24);
        backdrop-filter: blur(12px) saturate(150%);
        -webkit-backdrop-filter: blur(12px) saturate(150%);
        box-shadow:
            0 8px 20px var(--vm-black-35),
            inset 0 1px 0 var(--vm-white-25);
        transition:
            transform 0.2s,
            background 0.2s,
            border-color 0.2s;
    }

    &:hover .pause-overlay-icon {
        transform: scale(1.1);
        background: var(--vm-white-18);
        border-color: var(--vm-white-35);
    }
}

.top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 24px 32px;
    z-index: 10;
    background: linear-gradient(to bottom, var(--vm-black-60) 0%, transparent 100%);
    opacity: 1;
    transition: opacity 0.3s;
    pointer-events: none;

    &.hide-controls {
        opacity: 0;
    }

    .close-btn {
        pointer-events: auto;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--vm-white-10);
        border: 1px solid var(--vm-white-20);
        box-shadow: 0 4px 10px var(--vm-black-24);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--vm-color-white);
        font-size: 24px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
            background: var(--vm-white-20);
        }
    }
}

.right-sidebar {
    position: absolute;
    right: 24px;
    bottom: 100px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
    pointer-events: none;

    .sidebar-item {
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;

        .icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--vm-white-8);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            color: var(--vm-color-white);
            transition: all 0.2s;
            margin-bottom: 4px;

            &:hover {
                background: var(--vm-white-15);
                transform: scale(1.05);
            }
            &:active {
                transform: scale(0.95);
            }

            .liked {
                color: $color-accent;
            }
            .collected {
                color: $color-gold;
            }
        }

        .count {
            font-size: 13px;
            color: var(--vm-color-white);
            text-shadow: 0 1px 2px var(--vm-black-50);
            font-weight: 500;
        }

        &.avatar-wrapper {
            margin-bottom: 8px;
            position: relative;

            .author-avatar {
                border: 2px solid var(--vm-color-white);
                transition: transform 0.2s;
                &:hover {
                    transform: scale(1.05);
                }
            }

            .follow-badge {
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 20px;
                height: 20px;
                background: var(--el-color-danger);
                border-radius: 50%;
                color: var(--vm-color-white);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                border: none;
                cursor: pointer;
                box-shadow: 0 2px 4px var(--vm-black-24);

                &:hover {
                    background: var(--el-color-danger-light-3);
                }
            }
        }

        &.active .icon-wrapper {
            background: var(--vm-white-90);
            color: var(--vm-color-black);
        }
    }
}

.bottom-info-layer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 24px 32px;
    background: linear-gradient(to top, var(--vm-black-85) 0%, var(--vm-black-40) 60%, transparent 100%);
    z-index: 15;
    transition: opacity 0.3s;
    display: flex;
    flex-direction: column;
    gap: 16px;

    &.hide-controls {
        opacity: 0;
        pointer-events: none;
    }

    .info-content {
        max-width: 65%;
        color: var(--vm-color-white);
        margin-bottom: 8px;

        .author-line {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .author-name {
                font-size: 18px;
                font-weight: 700;
                text-shadow: 0 1px 2px var(--vm-black-50);
            }

            .publish-time {
                font-size: 13px;
                color: var(--vm-white-70);
            }
        }

        .video-desc {
            font-size: 15px;
            line-height: 1.5;
            color: var(--vm-white-92);
            text-shadow: 0 1px 2px var(--vm-black-50);

            .hashtag {
                color: $color-text-primary;
                font-weight: 600;
                margin-right: 4px;
            }
        }
    }
}

.controls-layer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: auto;

    .progress-container {
        width: 100%;
        height: 16px;
        display: flex;
        align-items: center;
        position: relative;
        cursor: pointer;

        .progress-slider {
            width: 100%;
            height: 16px;
            --el-slider-height: 4px;
            --el-slider-button-size: 5px;
            --el-slider-button-wrapper-size: 16px;
            --el-slider-button-wrapper-offset: -6px;
            --el-color-primary: #9ea3ad;
            --el-slider-main-bg-color: #9ea3ad;
            --el-slider-runway-bg-color: #5e636f;

            :deep(.el-slider__runway) {
                border-radius: 2px;
                margin: 0;
            }

            :deep(.el-slider__bar) {
                border-radius: 2px;
            }

            :deep(.el-slider__button) {
                background: #d7dae0;
                border: none;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
                transform: scale(0);
                transition: transform 0.1s;
            }

            :deep(.el-slider__button-wrapper) {
                top: calc((var(--el-slider-height) - var(--el-slider-button-wrapper-size)) / 2);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
            }

            :deep(.el-slider__button-wrapper::after) {
                content: none;
            }

            :deep(.el-slider__button:hover),
            :deep(.el-slider__button.hover),
            :deep(.el-slider__button.dragging) {
                transform: scale(1);
            }
        }

        &:hover :deep(.el-slider__button) {
            transform: scale(1);
        }

        .progress-hover-tooltip {
            position: absolute;
            bottom: calc(100% + 2px);
            transform: translateX(-50%);
            background: var(--vm-black-80);
            color: var(--vm-color-white);
            padding: 3px 6px;
            border-radius: 3px;
            box-shadow: 0 4px 10px var(--vm-black-35);
            pointer-events: none;
            z-index: 12;

            .progress-hover-time {
                font-size: 11px;
                line-height: 1;
                font-weight: 500;
                text-shadow: 0 1px 2px var(--vm-black-60);
            }
        }
    }

    .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 40px;

        .left-controls,
        .right-controls {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .play-btn {
            color: var(--vm-color-white);
            font-size: 28px;
            cursor: pointer;
            &:hover {
                opacity: 0.8;
            }
        }

        .time-display {
            font-size: 13px;
            color: var(--vm-white-85);
            font-feature-settings: 'tnum';

            .sep {
                margin: 0 4px;
                color: var(--vm-white-45);
            }
        }

        .volume-control {
            display: flex;
            align-items: center;
            position: relative;
            z-index: 24;
            height: 32px;
            border-radius: 16px;
            padding: 0 8px;
            background: rgba(26, 28, 36, 0.56);
            border: 1px solid var(--vm-white-10);
            backdrop-filter: blur(8px);
            transition: background 0.2s;

            &:hover {
                background: rgba(30, 33, 44, 0.7);
            }

            .volume-btn {
                font-size: 22px;
                color: #d4d7de;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                z-index: 1;
                width: 22px;
                height: 22px;

                &:hover {
                    opacity: 0.9;
                }
            }

            .volume-slider-wrapper {
                width: 0;
                opacity: 0;
                overflow: hidden;
                margin-left: 0;
                transition:
                    width 0.2s ease,
                    opacity 0.2s ease,
                    margin-left 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                pointer-events: none;
                position: relative;
                z-index: 1;

                &.open {
                    width: 106px;
                    opacity: 1;
                    overflow: visible;
                    margin-left: 8px;
                    pointer-events: auto;
                }
            }

            .volume-slider {
                flex: 1;
                width: 100%;
                min-width: 0;
                height: 20px;
                --el-slider-height: 3px;
                --el-slider-button-size: 6px;
                --el-slider-button-wrapper-size: 18px;
                --el-slider-button-wrapper-offset: -7.5px;
                --el-color-primary: #9ea3ad;
                --el-slider-main-bg-color: #9ea3ad;
                --el-slider-runway-bg-color: #5e636f;

                :deep(.el-slider__runway) {
                    border-radius: 2px;
                    margin: 0;
                }

                :deep(.el-slider__bar) {
                    border-radius: 2px;
                }

                :deep(.el-slider__button-wrapper) {
                    top: calc((var(--el-slider-height) - var(--el-slider-button-wrapper-size)) / 2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                }

                :deep(.el-slider__button-wrapper::after) {
                    content: none;
                }

                :deep(.el-slider__button) {
                    border: none;
                    background-color: #d7dae0;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
                }
            }

            .volume-value {
                width: 22px;
                font-size: 11px;
                line-height: 1;
                font-weight: 600;
                color: #c8ccd4;
                text-align: center;
                flex-shrink: 0;
                user-select: none;
            }
        }

        .speed-control {
            font-size: 14px;
            font-weight: 600;
            color: var(--vm-color-white);
            cursor: pointer;
            position: relative;

            .speed-trigger:hover .speed-menu-wrapper {
                opacity: 1;
                visibility: visible;
                transform: translateX(-50%) translateY(0);
            }

            .speed-menu-wrapper {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%) translateY(10px);
                padding-bottom: 12px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s;

                .speed-menu {
                    background: var(--vm-panel-bg-soft);
                    backdrop-filter: blur(10px);
                    border-radius: 8px;
                    padding: 4px;

                    .speed-item {
                        padding: 8px 16px;
                        color: var(--vm-white-75);
                        font-size: 13px;
                        cursor: pointer;
                        border-radius: 4px;

                        &:hover {
                            background: var(--vm-white-10);
                            color: var(--vm-color-white);
                        }
                        &.active {
                            color: $color-accent;
                        }
                    }
                }
            }
        }

        .icon-btn {
            font-size: 22px;
            color: var(--vm-color-white);
            cursor: pointer;
            &:hover {
                opacity: 0.8;
            }
            &.disabled {
                opacity: 0.3;
                cursor: default;
            }
        }
    }
}

.comment-panel {
    position: relative;
    width: 0;
    height: 100%;
    background: $color-bg-panel;
    backdrop-filter: blur(40px) saturate(180%);
    border-left: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

    &.open {
        width: 420px;
    }
    &.with-collection.open {
        width: 480px;
    }

    .comment-panel-header {
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        border-bottom: 1px solid $color-border;
        background: var(--vm-panel-bg-soft);
        flex-shrink: 0;

        .panel-tabs {
            :deep(.el-tabs__item) {
                color: $color-text-secondary;
                font-weight: 500;
                font-size: 15px;
                padding: 0 16px;
                transition: color 0.2s;

                &.is-active {
                    color: $color-text-primary;
                    font-weight: 600;
                }
                &:hover {
                    color: var(--vm-color-white);
                }
            }
            :deep(.el-tabs__active-bar) {
                background-color: $color-accent;
                height: 3px;
                border-radius: 3px;
            }
            :deep(.el-tabs__nav-wrap::after) {
                display: none;
            }
        }

        .panel-close {
            color: $color-text-secondary;
            font-size: 20px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: transparent;
            transition: all 0.2s;

            &:hover {
                background: var(--vm-white-10);
                color: var(--vm-color-white);
            }
        }
    }

    .comment-panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        scrollbar-width: thin;
        scrollbar-color: var(--vm-white-20) transparent;
        display: flex;
        flex-direction: column;

        &::-webkit-scrollbar {
            width: 6px;
        }
        &::-webkit-scrollbar-thumb {
            background: var(--vm-white-20);
            border-radius: 3px;
        }
    }

    .comment-list-wrapper {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .comment-item {
        display: flex;
        gap: 12px;

        .comment-avatar {
            flex-shrink: 0;
            border: 1px solid var(--vm-white-10);
        }
        .comment-main {
            flex: 1;
            min-width: 0;
        }

        .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 6px;

            .comment-name {
                font-size: 13px;
                font-weight: 600;
                color: var(--vm-white-85);
            }
            .comment-time {
                font-size: 11px;
                color: $color-text-muted;
            }
        }

        .comment-content {
            font-size: 14px;
            line-height: 1.5;
            color: $color-text-primary;
            margin-bottom: 8px;
            white-space: pre-wrap;
            cursor: pointer;
        }

        .comment-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .footer-actions {
                display: flex;
                gap: 16px;
            }

            .action-btn {
                font-size: 12px;
                color: $color-text-secondary;
                cursor: pointer;
                font-weight: 500;
                &:hover {
                    color: var(--vm-color-white);
                }
                &.delete:hover {
                    color: $color-accent;
                }
            }

            .expand-reply-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: $color-text-secondary;
                cursor: pointer;
                background: var(--vm-white-5);
                padding: 2px 8px;
                border-radius: 12px;
                transition: background 0.2s;

                &:hover {
                    background: var(--vm-white-10);
                    color: var(--vm-color-white);
                }
                .line {
                    width: 12px;
                    height: 1px;
                    background: $color-text-muted;
                }
            }
        }

        .comment-replies {
            margin-top: 12px;
            padding: 12px;
            background: $color-bg-soft;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 16px;

            .reply-item {
                display: flex;
                gap: 10px;

                .reply-avatar {
                    flex-shrink: 0;
                }
                .reply-main {
                    flex: 1;
                }

                .reply-header {
                    font-size: 12px;
                    margin-bottom: 4px;
                    .reply-name {
                        font-weight: 600;
                        color: var(--vm-white-75);
                    }
                    .reply-target {
                        color: $color-text-muted;
                        display: inline-flex;
                        align-items: center;
                        margin-left: 6px;
                        .arrow-icon {
                            font-size: 14px;
                            margin: 0 2px;
                        }
                        span {
                            color: $color-text-secondary;
                        }
                    }
                }

                .reply-content {
                    font-size: 13px;
                    color: $color-text-primary;
                    margin-bottom: 6px;
                    line-height: 1.4;
                    cursor: pointer;
                }

                .reply-footer {
                    display: flex;
                    gap: 12px;
                    font-size: 11px;
                    color: $color-text-muted;

                    .action-btn {
                        cursor: pointer;
                        &:hover {
                            color: var(--vm-color-white);
                        }
                    }
                    .delete:hover {
                        color: $color-accent;
                    }
                }
            }

            .load-more-replies {
                padding-top: 4px;
                font-size: 12px;
                color: $color-accent;
                cursor: pointer;
                font-weight: 500;
                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }

    .comment-panel-footer {
        padding: 16px 20px;
        background: var(--vm-panel-bg-soft);
        border-top: 1px solid $color-border;
        flex-shrink: 0;

        .reply-context-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--vm-white-10);
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            font-size: 12px;
            color: var(--vm-white-85);

            .name {
                font-weight: 600;
                margin-left: 4px;
            }
            .cancel-reply {
                cursor: pointer;
                color: $color-text-muted;
                &:hover {
                    color: var(--vm-color-white);
                }
            }
        }

        .input-area {
            display: flex;
            gap: 12px;
            align-items: flex-end;

            .comment-input {
                :deep(.el-textarea__inner) {
                    background: $color-bg-input;
                    border: 1px solid transparent;
                    border-radius: 20px;
                    padding: 10px 16px;
                    color: var(--vm-color-white);
                    font-size: 14px;
                    line-height: 1.5;
                    box-shadow: none;
                    transition: all 0.2s;

                    &:focus {
                        background: var(--vm-white-10);
                        border-color: var(--vm-white-20);
                    }
                }
            }

            .send-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, $color-accent, var(--vm-color-accent-hover));
                color: var(--vm-color-white);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                flex-shrink: 0;
                transition:
                    transform 0.2s,
                    opacity 0.2s;

                &:hover {
                    transform: scale(1.05);
                }
                &.disabled {
                    background: var(--vm-white-10);
                    color: var(--vm-white-30);
                    cursor: default;
                    transform: none;
                }
            }
        }
    }

    .collection-panel-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--vm-color-white);
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        .collection-icon {
            color: $color-accent;
            font-size: 18px;
        }
    }

    .collection-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .collection-item {
            display: flex;
            gap: 12px;
            padding: 8px;
            border-radius: 8px;
            background: transparent;
            border: 1px solid transparent;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background: var(--vm-white-5);
            }
            &.active {
                background: var(--vm-accent-soft-light);
                border-color: var(--vm-accent-soft-strong);
            }

            .collection-thumb {
                width: 88px;
                height: 50px;
                border-radius: 6px;
                overflow: hidden;
                background: var(--vm-white-15);
                position: relative;

                .collection-cover {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .playing-overlay {
                    position: absolute;
                    inset: 0;
                    background: var(--vm-black-50);
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    .bar-anim {
                        display: flex;
                        gap: 2px;
                        height: 12px;
                        align-items: flex-end;

                        span {
                            width: 3px;
                            background: $color-accent;
                            animation: soundbar 0.8s ease-in-out infinite;
                            &:nth-child(1) {
                                height: 60%;
                                animation-delay: 0s;
                            }
                            &:nth-child(2) {
                                height: 100%;
                                animation-delay: 0.2s;
                            }
                            &:nth-child(3) {
                                height: 50%;
                                animation-delay: 0.4s;
                            }
                        }
                    }
                }
            }

            .collection-info {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;

                .collection-title {
                    font-size: 13px;
                    color: var(--vm-white-90);
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .collection-meta {
                    font-size: 11px;
                    color: $color-text-muted;
                }
            }
        }
    }

    .detail-panel {
        .detail-section {
            margin-bottom: 20px;
            &:last-child {
                margin-bottom: 0;
            }
            .detail-label {
                font-size: 12px;
                font-weight: 700;
                color: $color-text-muted;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .detail-content-text {
                font-size: 14px;
                line-height: 1.6;
                color: $color-text-secondary;
            }
            .detail-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                .detail-tag {
                    font-size: 12px;
                    color: $color-accent;
                    background: var(--vm-accent-soft-light);
                    padding: 4px 10px;
                    border-radius: 4px;
                }
            }
        }
    }
}

.comment-empty,
.collection-empty,
.collection-loading,
.comment-loading,
.comment-end {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    min-height: 200px;
    color: $color-text-muted;
    font-size: 13px;
    gap: 12px;

    .empty-icon {
        font-size: 48px;
        opacity: 0.3;
    }
    .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--vm-white-10);
        border-top-color: $color-accent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
@keyframes soundbar {
    0%,
    100% {
        height: 30%;
    }
    50% {
        height: 100%;
    }
}

.repost-dialog {
    :deep(.el-dialog) {
        background: var(--el-bg-color-overlay);
        border-radius: 12px;
    }
    :deep(.el-dialog__header) {
        margin: 0;
        padding: 20px;
        border-bottom: 1px solid var(--el-border-color);
    }
    :deep(.el-dialog__title) {
        color: var(--el-text-color-primary);
        font-size: 16px;
    }
    :deep(.el-dialog__body) {
        padding: 20px;
    }
    :deep(.el-dialog__footer) {
        padding: 20px;
        border-top: 1px solid var(--el-border-color);
    }
    :deep(.el-button--text) {
        color: var(--el-text-color-secondary);
        &:hover {
            color: var(--el-text-color-primary);
        }
    }
}

@media (max-width: 768px) {
    .player-frame {
        flex-direction: column;
    }
    .comment-panel {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100% !important;
        height: 75%;
        border-radius: 16px 16px 0 0;
        transform: translateY(100%);
        opacity: 1;

        &.open {
            transform: translateY(0);
        }
    }
    .right-sidebar {
        bottom: 120px;
        right: 16px;
    }
}
</style>
