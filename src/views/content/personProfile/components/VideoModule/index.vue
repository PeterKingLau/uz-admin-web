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
                    <div ref="videoWrapperRef" class="player-shell" :class="[videoFitClass, { 'is-watermarked': showWatermark }]">
                        <div class="player-bg" :style="bgStyle"></div>

                        <video
                            ref="playerRef"
                            :src="src"
                            class="video-element"
                            playsinline
                            autoplay
                            preload="auto"
                            controlslist="nodownload noremoteplayback"
                            @click="togglePlay"
                            @loadedmetadata="onLoadedMeta"
                            @timeupdate="onTimeUpdate"
                            @durationchange="onDurationChange"
                            @play="onPlay"
                            @pause="onPause"
                            @volumechange="onVolumeChange"
                            @ratechange="onRateChange"
                        ></video>

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
                                <div class="progress-container" ref="progressContainerRef" @mousemove="onProgressHover" @mouseleave="onProgressLeave">
                                    <div v-if="progressHover.visible" class="progress-hover-tooltip" :style="{ left: progressHover.left + 'px' }">
                                        {{ formatClock(isDraggingProgress ? progressDraft : progressHover.time) }}
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
                                        <div class="volume-control">
                                            <div class="volume-btn" @click="toggleMute">
                                                <Icon :icon="muted || volume === 0 ? 'mdi:volume-mute' : volume < 0.5 ? 'mdi:volume-low' : 'mdi:volume-high'" />
                                            </div>
                                            <div class="volume-slider-wrapper">
                                                <el-slider
                                                    v-model="volume"
                                                    :min="0"
                                                    :max="1"
                                                    :step="0.01"
                                                    :show-tooltip="false"
                                                    @input="applyVolume"
                                                    class="volume-slider"
                                                />
                                                <div class="volume-percent">{{ Math.round(volume * 100) }}%</div>
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
                                <el-avatar :size="48" :src="authorAvatar" class="author-avatar" />
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
                                    <el-tab-pane name="comments" label="评论" />
                                    <el-tab-pane v-if="showCollectionTab" name="collection" label="合集" />
                                </el-tabs>
                            </div>
                            <div class="panel-close" @click="commentPanelVisible = false">
                                <Icon icon="ep:close" />
                            </div>
                        </div>

                        <div class="comment-panel-body" ref="commentBodyRef" @scroll="handleCommentScroll">
                            <template v-if="activePanelTab === 'comments'">
                                <div class="comment-panel-count">全部评论 ({{ formatCount(localCommentCount) }})</div>
                                <div v-if="commentItems.length === 0 && !commentLoading" class="comment-empty">
                                    <Icon icon="mdi:comment-outline" class="empty-icon" />
                                    <span>暂无评论，快来抢沙发~</span>
                                </div>

                                <div v-for="(comment, index) in commentItems" :key="comment.id ?? index" class="comment-item">
                                    <el-avatar :size="36" :src="getCommentAvatar(comment)" class="comment-avatar" />
                                    <div class="comment-main">
                                        <div class="comment-user-info">
                                            <span class="comment-name">{{ getCommentName(comment) }}</span>
                                            <span class="comment-time">{{ formatCommentTime(comment.createTime) }}</span>
                                        </div>
                                        <div class="comment-content" @click="handleReplyToComment(comment)">
                                            {{ comment.content }}
                                        </div>

                                        <div class="comment-actions">
                                            <span class="action-text reply-btn" @click="handleReplyToComment(comment)">回复</span>
                                            <span
                                                v-if="canDeleteComment(comment)"
                                                class="action-text delete-btn danger"
                                                @click.stop="handleDeleteComment(comment)"
                                                >删除</span
                                            >
                                            <div
                                                v-if="Number(comment.replyCount || 0) > 0"
                                                class="action-text toggle-reply-btn"
                                                @click="toggleReplies(comment)"
                                            >
                                                <span class="divider"></span>
                                                <span>{{ resolveReplyState(comment).open ? '收起' : `展开 ${comment.replyCount} 条回复` }}</span>
                                                <Icon :icon="resolveReplyState(comment).open ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
                                            </div>
                                        </div>

                                        <div class="comment-replies" v-if="resolveReplyState(comment).open">
                                            <div v-for="(reply, rIndex) in resolveReplyState(comment).list" :key="reply.id ?? rIndex" class="reply-item">
                                                <el-avatar :size="24" :src="getCommentAvatar(reply)" class="reply-avatar" />
                                                <div class="reply-main">
                                                    <div class="reply-user-info">
                                                        <span class="reply-name">{{ getCommentName(reply) }}</span>
                                                        <span v-if="reply.replyUserNickName" class="reply-arrow">
                                                            <Icon icon="mdi:menu-right" />
                                                            <span class="target-name">{{ reply.replyUserNickName }}</span>
                                                        </span>
                                                    </div>
                                                    <div class="reply-content" @click="handleReplyToReply(reply, comment)">
                                                        {{ reply.content }}
                                                    </div>
                                                    <div class="reply-meta">
                                                        <span class="reply-time">{{ formatCommentTime(reply.createTime) }}</span>
                                                        <span class="action-text reply-btn" @click="handleReplyToReply(reply, comment)">回复</span>
                                                        <span
                                                            v-if="canDeleteComment(reply)"
                                                            class="action-text reply-btn delete-btn danger"
                                                            @click.stop="handleDeleteComment(reply, comment)"
                                                        >
                                                            删除
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div v-if="!resolveReplyState(comment).noMore" class="load-more-replies">
                                                <span class="load-more-text" @click="loadReplies(comment)">
                                                    {{ resolveReplyState(comment).loading ? '加载中...' : '查看更多回复' }}
                                                    <Icon icon="mdi:chevron-down" v-if="!resolveReplyState(comment).loading" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="commentLoading" class="comment-loading">
                                    <div class="loading-spinner"></div>
                                    <span>正在加载评论...</span>
                                </div>
                                <div v-if="commentNoMore && commentItems.length > 0" class="comment-end">- 到底了 -</div>
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
                                <div class="collection-panel-title">合集 · {{ activeCollectionName || '未命名合集' }}</div>
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
                                        </div>
                                        <div class="collection-info">
                                            <div class="collection-title">{{ resolveCollectionTitle(item) }}</div>
                                            <div class="collection-meta">{{ formatDate(item.createTime) }}</div>
                                        </div>
                                        <div v-if="isCurrentCollectionPost(item)" class="collection-playing">播放中</div>
                                    </button>
                                </div>
                            </template>
                        </div>

                        <div class="comment-panel-footer">
                            <div v-if="replyTarget" class="reply-context-bar">
                                <span class="reply-text">回复 @{{ replyTarget.replyUserName }}</span>
                                <div class="cancel-reply" @click="clearReplyTarget">
                                    <Icon icon="ep:close" />
                                </div>
                            </div>
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
                                    <Icon icon="mdi:send" />
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
import { parseTime } from '@/utils/utils'
import { getImgUrl } from '@/utils/img'
import { deleteComment, listCommentReplies, listTopComments } from '@/api/content/postComment'
import { getPostByCollection } from '@/api/content/collection'
import { POST_TYPE } from '@/utils/enum'
import useUserStore from '@/store/modules/user'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    src: { type: String, default: '' },
    post: { type: Object, default: () => ({}) },
    userInfo: { type: Object, default: () => ({}) },
    useTeleport: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'close', 'action', 'select-collection'])

const { proxy } = getCurrentInstance()
const userStore = useUserStore()

const teleportWrapper = computed(() => (props.useTeleport ? 'teleport' : 'div'))
const teleportAttrs = computed(() => (props.useTeleport ? { to: 'body' } : {}))

const visible = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})

const postData = computed(() => props.post || {})
const resolveActiveFlag = value => {
    if (typeof value === 'boolean') return value
    return value != null ? String(value) === '1' : false
}

const isLiked = computed(() =>
    resolveActiveFlag(postData.value?.like ?? postData.value?.isLiked ?? postData.value?.liked ?? postData.value?.likeStatus ?? postData.value?.isLike)
)
const isCollected = computed(() =>
    resolveActiveFlag(
        postData.value?.bookmark ?? postData.value?.isCollected ?? postData.value?.collected ?? postData.value?.collectStatus ?? postData.value?.isCollect
    )
)
const resolveFollowFlag = value => {
    if (typeof value === 'boolean') return value
    return value != null ? String(value) === '1' : false
}
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
const showPauseOverlay = computed(() => !isPlaying.value)

const duration = ref(0)
const currentTime = ref(0)

const isDraggingProgress = ref(false)
const progressDraft = ref(0)

const volume = ref(1)
const muted = ref(false)

const rates = [0.75, 1.0, 1.25, 1.5, 2.0]
const playbackRate = ref(1)

const controlsVisible = ref(true)
let hideControlsTimer = null

const clampRate = v => {
    const n = Number(v)
    if (!Number.isFinite(n)) return 1
    return Math.min(8, Math.max(0.1, n))
}

const pipSupported = ref(false)
const pipActive = ref(false)
const isFullscreen = ref(false)

const pipIcon = computed(() => (pipActive.value ? 'mdi:picture-in-picture-bottom-right' : 'mdi:picture-in-picture-bottom-right-outline'))

const authorName = computed(() => postData.value.nickName || postData.value.authorName || props.userInfo?.nickName || '未知用户')

const authorAvatar = computed(() => {
    const avatar = postData.value.avatar || props.userInfo?.avatar || ''
    return getImgUrl(avatar)
})
const collectedCount = computed(() => postData.value.bookmarkCount ?? postData.value.collectCount ?? 0)

const formatCount = num => {
    const n = Number(num || 0)
    if (!n) return '0'
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
    return String(n)
}

const formatDate = time => {
    if (!time) return ''
    return parseTime(time, '{m}-{d}') || ''
}

const getPostId = post => post?.postId ?? post?.id ?? null
const activePostId = computed(() => getPostId(postData.value))
const resolveCollectionId = post => post?.collectionId ?? post?.postCollectionDto?.collectionId ?? post?.collection?.id ?? null
const activeCollectionId = computed(() => resolveCollectionId(postData.value))
const resolveCollectionName = post =>
    post?.collectionName || post?.postCollectionDto?.collectionName || post?.collection?.name || post?.collection?.title || post?.collectionTitle || ''
const collectionNameFromApi = ref('')
const resolveCollectionNameFromResponse = res => {
    const data = res?.data ?? res ?? {}
    const collection =
        data?.collection ??
        data?.collectionInfo ??
        data?.collectionDetail ??
        data?.collectionDto ??
        data?.collectionVO ??
        data?.collectionEntity ??
        data?.info ??
        data?.detail ??
        null
    const name =
        data?.collectionName ||
        data?.collectionTitle ||
        data?.title ||
        collection?.name ||
        collection?.title ||
        collection?.collectionName ||
        collection?.collectionTitle ||
        ''
    return String(name || '').trim()
}
const activeCollectionName = computed(() => collectionNameFromApi.value || resolveCollectionName(postData.value))
const showCollectionTab = computed(() => Boolean(activeCollectionId.value))
const activePanelTab = ref('comments')
const collectionPosts = ref([])
const collectionLoading = ref(false)
const collectionLoaded = ref(false)

const getCommentName = comment => comment?.nickName || comment?.userName || comment?.authorName || comment?.nickname || comment?.user?.nickName || '用户'

const getCommentAvatar = comment => {
    const avatar = comment?.avatar || comment?.userAvatar || comment?.user?.avatar || ''
    return getImgUrl(avatar)
}

const formatCommentTime = time => {
    if (!time) return ''
    const date = new Date(time)
    const now = new Date()
    const diff = (now - date) / 1000

    if (diff < 60) return '刚刚'
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
    if (diff < 86400 * 3) return Math.floor(diff / 86400) + '天前'
    return parseTime(time, '{m}-{d}') || ''
}

const parseMediaRaw = raw => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed) return []
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed)
                return Array.isArray(parsed) ? parsed : [parsed]
            } catch {
                return trimmed
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean)
            }
        }
        return trimmed
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    }
    if (typeof raw === 'object') return [raw]
    return []
}

const resolveMediaList = post => [
    ...parseMediaRaw(post?.mediaUrls),
    ...parseMediaRaw(post?.mediaList),
    ...parseMediaRaw(post?.files),
    ...parseMediaRaw(post?.resources),
    ...parseMediaRaw(post?.videos)
]

const resolveMediaUrl = url => (url ? getImgUrl(url) : '')

const isVideoUrl = url => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url || '')

const resolveCollectionVideoUrl = post => {
    const direct = post?.videoUrl || post?.video || post?.url || post?.src || ''
    if (direct) return resolveMediaUrl(direct)
    const list = resolveMediaList(post)
    const normalized = list
        .map(item => {
            if (typeof item === 'string') return item
            return item?.url || item?.src || item?.path || item?.fileUrl || ''
        })
        .filter(Boolean)
    const candidate = normalized.find(isVideoUrl) || normalized[0] || ''
    return resolveMediaUrl(candidate)
}

const resolveCollectionCover = post => {
    const cover = post?.cover || post?.coverUrl || post?.thumbnail || post?.poster || post?.image || post?.coverImage || ''
    if (cover) return resolveMediaUrl(cover)
    const list = resolveMediaList(post)
    const candidate = list
        .map(item => {
            if (typeof item === 'string') return item
            return item?.cover || item?.coverUrl || item?.thumbnail || item?.poster || item?.image || item?.url || item?.src || item?.path || ''
        })
        .filter(Boolean)[0]
    return resolveMediaUrl(candidate || '')
}

const resolveCollectionTitle = post => {
    const title = post?.title || post?.postTitle || post?.content || post?.description || ''
    const text = String(title || '').trim()
    return text || '未命名视频'
}

const isCollectionVideoPost = post => String(post?.postType ?? '') === POST_TYPE.VIDEO || Boolean(resolveCollectionVideoUrl(post))

const collectionVideoPosts = computed(() => collectionPosts.value.filter(item => isCollectionVideoPost(item)))
const isCurrentCollectionPost = post => {
    const id = getPostId(post)
    if (id == null || activePostId.value == null) return false
    return String(id) === String(activePostId.value)
}

const normalizeCollectionPosts = res => {
    const data = res?.data ?? res?.rows ?? res?.list ?? res?.records ?? []
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.posts)) return data.posts
    if (Array.isArray(res?.posts)) return res.posts
    return []
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

const buildContentParts = content => {
    const text = String(content || '')
    if (!text) return []
    const regex = /#[^#\s]+/g
    const parts = []
    let lastIndex = 0
    let match
    while ((match = regex.exec(text))) {
        if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), isTag: false })
        parts.push({ text: match[0], isTag: true })
        lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isTag: false })
    return parts.length ? parts : [{ text, isTag: false }]
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

const updateWatermarkAndFit = () => {
    const wrapper = videoWrapperRef.value
    const videoEl = playerRef.value
    if (!wrapper || !videoEl) {
        showWatermark.value = false
        videoFitMode.value = 'height'
        return
    }
    const containerWidth = wrapper.clientWidth || 0
    const containerHeight = wrapper.clientHeight || 0
    const vw = videoEl.videoWidth || 0
    const vh = videoEl.videoHeight || 0
    if (!containerWidth || !containerHeight || !vw || !vh) {
        showWatermark.value = false
        return
    }
    const containerRatio = containerWidth / containerHeight
    const videoRatio = vw / vh
    showWatermark.value = Math.abs(containerRatio - videoRatio) > 0.12
    videoFitMode.value = videoRatio >= containerRatio ? 'width' : 'height'
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

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

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

const formatClock = s => {
    const sec = Math.max(0, Math.floor(Number(s) || 0))
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const r = sec % 60
    const mm = String(m).padStart(2, '0')
    const rr = String(r).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${rr}` : `${m}:${rr.padStart(2, '0')}`
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

const onProgressCommit = v => {
    const el = playerRef.value
    const sec = Number(v || 0)
    isDraggingProgress.value = false
    progressDraft.value = sec
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

const onPause = () => {
    isPlaying.value = false
}

const onVolumeChange = () => {
    const el = playerRef.value
    if (!el) return
    muted.value = Boolean(el.muted)
    volume.value = Number(el.volume ?? 1)
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

const isTypingTarget = el => {
    if (!el) return false
    const tag = String(el.tagName || '').toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
    if (el.isContentEditable) return true
    return false
}

const onKeydown = e => {
    if (!visible.value) return
    if (e.code !== 'Space' && e.key !== ' ') return
    if (isTypingTarget(e.target)) return
    e.preventDefault()
    togglePlay()
}

const stopPlayer = () => {
    const el = playerRef.value
    if (!el) return
    try {
        el.pause?.()
    } catch (e) {
        console.error(e)
    }
    isPlaying.value = false
    showWatermark.value = false
    pipActive.value = false
    commentPanelVisible.value = false
    commentDraft.value = ''
    clearReplyTarget()

    isDraggingProgress.value = false
    progressDraft.value = 0
    progressHover.visible = false

    window.removeEventListener('resize', handleResize)
    document.removeEventListener('fullscreenchange', handleResize)
    window.removeEventListener('keydown', onKeydown)
    if (hideControlsTimer) {
        clearTimeout(hideControlsTimer)
        hideControlsTimer = null
    }
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
    stopPlayer()
})
</script>

<style scoped lang="scss">
.video-immersive-container {
    position: fixed;
    inset: 0;
    background: #000;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;

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
    padding: 24px;
    box-sizing: border-box;
}

.player-frame {
    position: relative;
    height: 100%;
    width: 100%;
    max-width: 1200px;
    display: flex;
    overflow: hidden;
    border-radius: 12px;
    background: #000;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    transition: all 0.3s ease;
}

.player-shell {
    position: relative;
    flex: 1;
    height: 100%;
    overflow: hidden;
    min-width: 0;
    cursor: default;
}

.player-bg {
    position: absolute;
    inset: -40px;
    background-position: center;
    background-size: cover;
    filter: blur(40px) brightness(0.4);
    opacity: 0.5;
    transform: scale(1.1);
    pointer-events: none;
    z-index: 0;
}

.video-element {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    z-index: 1;
}

.pause-overlay {
    position: absolute;
    inset: 0;
    z-index: 8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
}

.pause-overlay-icon {
    font-size: 72px;
    color: rgba(255, 255, 255, 0.92);
    filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.45));
    transition:
        transform 0.2s ease,
        opacity 0.2s ease;
}

.pause-overlay:hover .pause-overlay-icon {
    transform: scale(1.08);
}

.top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
    z-index: 10;
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.3s ease;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, transparent 100%);

    &.hide-controls {
        opacity: 0;
    }
}

.close-btn {
    pointer-events: auto;
    width: 44px;
    height: 44px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
    }
}

.right-sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 20px;
    width: 60px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;
    justify-content: flex-end;
    padding-bottom: 120px;
    z-index: 13;
    transition: opacity 0.2s ease;
    pointer-events: none;
}

.comment-open .right-sidebar {
    opacity: 0;
    pointer-events: none;
}

.sidebar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    color: #fff;
    pointer-events: auto;

    &.active .icon-wrapper {
        color: #face15;
    }
}

.avatar-wrapper {
    position: relative;
}

.follow-badge {
    position: absolute;
    left: 50%;
    bottom: -10px;
    transform: translateX(-50%);
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: #ff4d4f;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    pointer-events: auto;
    transition:
        transform 0.2s ease,
        background 0.2s ease,
        color 0.2s ease;
}

.follow-badge:hover {
    transform: translateX(-50%) scale(1.05);
}

.icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
    }

    .liked {
        color: #ff2c55;
    }
    .collected {
        color: #face15;
    }
}

.count {
    font-size: 13px;
    font-weight: 500;
    margin-top: 6px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.author-avatar {
    border: 2px solid rgba(255, 255, 255, 0.8);
    transition: transform 0.2s;

    &:hover {
        transform: scale(1.05);
    }
}

.bottom-info-layer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9;
    padding: 0 32px 24px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
    display: flex;
    flex-direction: column;
    gap: 16px;
    opacity: 1;
    transition: opacity 0.3s ease;

    &.hide-controls {
        opacity: 0;
        pointer-events: none;
    }
}

.info-content {
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    max-width: 80%;
    margin-bottom: 8px;
}

.author-line {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.author-name {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.publish-time {
    opacity: 0.7;
    font-size: 13px;
    cursor: pointer;

    &:hover {
        opacity: 1;
    }
}

.desc-text {
    font-size: 15px;
    line-height: 1.6;
    opacity: 0.95;

    .hashtag {
        color: #face15;
        font-weight: 500;
        margin-right: 6px;
    }
}

.controls-layer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: auto;
}

.progress-container {
    width: 100%;
    position: relative;
}

.progress-slider {
    width: 100%;
    height: 4px;
}

.progress-hover-tooltip {
    position: absolute;
    bottom: 14px;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

:deep(.progress-slider .el-slider__runway) {
    background: rgba(255, 255, 255, 0.25);
    height: 4px;
    margin: 0;
}

:deep(.progress-slider .el-slider__bar) {
    background: #fff;
    height: 4px;
}

:deep(.progress-slider .el-slider__button-wrapper) {
    top: -15px;
}

:deep(.progress-slider .el-slider__button) {
    border: none;
    width: 12px;
    height: 12px;
    background: #fff;
    transform: scale(0);
    transition: transform 0.2s;
}

.progress-container:hover :deep(.el-slider__button) {
    transform: scale(1);
}

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
}

.left-controls {
    display: flex;
    align-items: center;
    gap: 16px;
}

.play-btn {
    color: #fff;
    font-size: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }
}

.time-display {
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    display: flex;
    gap: 4px;

    .sep {
        opacity: 0.5;
    }
}

.right-controls {
    display: flex;
    align-items: center;
    gap: 20px;
}

.volume-control {
    display: flex;
    align-items: center;
    position: relative;
    height: 100%;

    .volume-btn {
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        z-index: 2;
    }

    .volume-slider-wrapper {
        width: 0;
        opacity: 0;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
        margin-left: 0;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        height: 32px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding-right: 12px;
    }

    &:hover .volume-slider-wrapper {
        width: 110px;
        opacity: 1;
        margin-left: 8px;
        padding-left: 12px;
    }
}

.volume-slider {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;
}

:deep(.volume-slider .el-slider__runway) {
    background: rgba(255, 255, 255, 0.3);
    height: 3px;
    margin: 0;
}

:deep(.volume-slider .el-slider__bar) {
    background: #face15;
    height: 3px;
}

:deep(.volume-slider .el-slider__button) {
    width: 10px;
    height: 10px;
    border: none;
}

:deep(.volume-slider .el-slider__button-wrapper) {
    top: 50%;
    transform: translate(-50%, -50%);
}

.volume-percent {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.75);
    font-weight: 600;
    white-space: nowrap;
    line-height: 1;
}

.speed-control {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
}

.speed-trigger {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 4px;
    position: relative;
}

.speed-menu-wrapper {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding-bottom: 16px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
}

.speed-trigger:hover .speed-menu-wrapper {
    opacity: 1;
    visibility: visible;
}

.speed-menu {
    background: rgba(28, 28, 30, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    width: 120px;

    .speed-options {
        display: flex;
        flex-direction: column-reverse;
        gap: 2px;
    }

    .speed-item {
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
        padding: 8px;
        text-align: center;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }

        &.active {
            color: #face15;
            font-weight: 600;
        }
    }
}

.icon-btn {
    color: #fff;
    font-size: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    opacity: 0.9;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }

    &.disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
}

.comment-panel {
    width: 0;
    height: 100%;
    background: rgba(24, 24, 28, 0.98);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &.open {
        width: 400px;
        opacity: 1;
    }
}

.comment-panel.with-collection.open {
    width: 460px;
}

.comment-panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
        display: flex;
        align-items: baseline;
        gap: 10px;
    }

    .title {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
    }

    .count {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
    }

    .panel-close {
        color: rgba(255, 255, 255, 0.6);
        font-size: 20px;
        cursor: pointer;
        transition: color 0.2s;
        border: none;
        background: transparent;
        padding: 0;

        &:hover {
            color: #fff;
        }
    }
}

.panel-tabs {
    :deep(.el-tabs__header) {
        margin: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
        display: none;
    }

    :deep(.el-tabs__item) {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        font-weight: 600;
        padding: 0 8px;
        height: auto;
        line-height: 1.2;
        transition: color 0.2s ease;
    }

    :deep(.el-tabs__item.is-active) {
        color: #fff;
    }

    :deep(.el-tabs__active-bar) {
        background: #face15;
        height: 2px;
        border-radius: 2px;
    }
}

.comment-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px;

    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
    }
}

.comment-panel-count {
    padding: 16px 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
}

.detail-panel {
    padding: 16px 0 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.detail-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.detail-label {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
}

.detail-content-text {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    white-space: pre-wrap;
}

.detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.detail-tag {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(250, 206, 21, 0.16);
    color: #face15;
}

.detail-empty {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
}

.collection-panel-title {
    padding: 16px 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.collection-loading,
.collection-empty {
    padding-top: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgba(255, 255, 255, 0.4);
    gap: 10px;
    font-size: 14px;
}

.collection-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;
}

.collection-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 10px 12px;
    color: #fff;
    cursor: pointer;
    text-align: left;
    transition:
        border-color 0.2s ease,
        background 0.2s ease,
        transform 0.2s ease;
}

.collection-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
}

.collection-item.active {
    border-color: rgba(250, 206, 21, 0.6);
    background: rgba(250, 206, 21, 0.12);
}

.collection-thumb {
    width: 68px;
    height: 42px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.collection-cover {
    width: 100%;
    height: 100%;
    display: block;
}

.collection-thumb-empty {
    color: rgba(255, 255, 255, 0.5);
    font-size: 20px;
}

.collection-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.collection-title {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.collection-meta {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
}

.collection-playing {
    font-size: 11px;
    color: #face15;
    font-weight: 600;
    flex-shrink: 0;
}

.comment-empty {
    padding-top: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgba(255, 255, 255, 0.4);
    gap: 12px;
    font-size: 14px;

    .empty-icon {
        font-size: 48px;
        opacity: 0.5;
    }
}

.comment-item {
    display: flex;
    gap: 12px;
    padding: 16px 0;

    .comment-avatar {
        flex-shrink: 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .comment-main {
        flex: 1;
        min-width: 0;
    }

    .comment-user-info {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 4px;

        .comment-name {
            font-size: 13px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.6);
        }

        .comment-time {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.3);
        }
    }

    .comment-content {
        font-size: 14px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.9);
        white-space: pre-wrap;
        word-break: break-all;
        margin-bottom: 8px;
        cursor: pointer;
    }

    .comment-actions {
        display: flex;
        gap: 16px;
        margin-bottom: 4px;

        .action-text {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            transition: color 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 500;

            &:hover {
                color: #face15;
            }

            &.delete-btn {
                color: rgba(255, 255, 255, 0.5);
            }

            &.delete-btn:hover {
                color: #ff6b6b;
            }

            &.danger {
                color: #ff6b6b;
            }

            &.danger:hover {
                color: #ff9a9a;
            }
        }

        .divider {
            width: 12px;
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
            margin-right: 4px;
        }
    }

    .comment-replies {
        margin-top: 8px;
        padding-left: 16px;
        border-left: 2px solid rgba(255, 255, 255, 0.15);
        display: flex;
        flex-direction: column;
        gap: 12px;

        .reply-item {
            display: flex;
            gap: 10px;

            .reply-avatar {
                flex-shrink: 0;
            }

            .reply-main {
                flex: 1;

                .reply-user-info {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 2px;
                    display: flex;
                    align-items: center;

                    .reply-arrow {
                        display: flex;
                        align-items: center;
                        margin-left: 4px;
                        color: rgba(255, 255, 255, 0.3);
                        font-size: 14px;
                    }

                    .target-name {
                        color: #face15;
                        margin-left: 2px;
                        font-weight: 500;
                    }
                }

                .reply-content {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.85);
                    line-height: 1.4;
                    margin-bottom: 4px;
                    cursor: pointer;
                }

                .reply-meta {
                    display: flex;
                    gap: 12px;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.4);
                    align-items: center;

                    .reply-btn {
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.6);
                        cursor: pointer;
                        &:hover {
                            color: #face15;
                        }

                        &.delete-btn {
                            color: rgba(255, 255, 255, 0.5);
                        }

                        &.delete-btn:hover {
                            color: #ff6b6b;
                        }

                        &.danger {
                            color: #ff6b6b;
                        }

                        &.danger:hover {
                            color: #ff9a9a;
                        }
                    }
                }
            }
        }

        .load-more-replies {
            padding-top: 4px;
            .load-more-text {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: color 0.2s;
                font-weight: 500;

                &:hover {
                    color: #face15;
                }
            }
        }
    }
}

.comment-loading,
.comment-end {
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-top-color: #face15;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.comment-panel-footer {
    padding: 16px 20px;
    background: rgba(24, 24, 28, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.06);

    .reply-context-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.05);
        padding: 6px 10px;
        border-radius: 6px;
        margin-bottom: 10px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);

        .cancel-reply {
            cursor: pointer;
            display: flex;
            &:hover {
                color: #fff;
            }
        }
    }

    .input-area {
        display: flex;
        gap: 10px;
        align-items: flex-end;

        :deep(.el-textarea__inner) {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            color: #fff;
            padding: 4px 10px;
            min-height: 28px !important;
            line-height: 18px;
            font-size: 14px;
            outline: none;
            box-shadow: none;

            &:focus {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(255, 255, 255, 0.2);
            }

            &::-webkit-scrollbar {
                display: none;
            }
        }

        .send-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #face15;
            color: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;

            &.disabled {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.3);
                cursor: not-allowed;
            }

            &:not(.disabled):hover {
                transform: scale(1.05);
                background: #fbd63d;
            }
        }
    }
}

.repost-dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.repost-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.repost-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.custom-textarea {
    :deep(.el-textarea__inner) {
        border-radius: 12px;
        padding: 16px;
        font-size: 15px;
        line-height: 1.6;
        border: 1px solid var(--el-border-color);
        background-color: var(--el-input-bg-color, var(--el-fill-color-blank));
        color: var(--el-text-color-primary);
        box-shadow: none;
        transition: all 0.3s;

        &::placeholder {
            color: var(--el-text-color-placeholder);
        }

        &:focus {
            background-color: var(--el-bg-color);
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
        }
    }
}

@media (max-width: 768px) {
    .player-frame {
        flex-direction: column;
        width: 100%;
        height: 100%;
        border-radius: 0;
    }

    .player-shell {
        border-radius: 0;
    }

    .comment-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100% !important;
        height: 70vh;
        border-radius: 16px 16px 0 0;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

        &.open {
            transform: translateY(0);
            width: 100%;
        }
    }

    .right-sidebar {
        right: 12px;
        bottom: 80px;
        padding-bottom: 0;
    }
}
</style>
