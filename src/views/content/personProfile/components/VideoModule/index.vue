<template>
    <teleport to="body">
        <div v-if="visible" class="video-immersive-container" @click="handleClose">
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

                        <div class="top-bar">
                            <div class="close-btn" @click.stop="handleClose">
                                <Icon icon="ep:close" />
                            </div>
                        </div>

                        <div class="bottom-info-layer">
                            <div class="info-content">
                                <div class="author-line">
                                    <div class="author-name">@{{ authorName }}</div>
                                    <span class="publish-time">{{ formatDate(postData.createTime) }}</span>
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
                                <div class="progress-container">
                                    <input
                                        class="progress"
                                        type="range"
                                        min="0"
                                        :max="progressMax"
                                        step="0.1"
                                        v-model="progressValue"
                                        @input="onSeekInput"
                                        @change="onSeekChange"
                                        :style="progressStyle"
                                    />
                                </div>

                                <div class="control-row">
                                    <div class="left-controls">
                                        <button class="btn icon" @click="togglePlay">
                                            <Icon :icon="isPlaying ? 'mdi:pause' : 'mdi:play'" />
                                        </button>

                                        <div class="time-display">
                                            <span>{{ formatClock(currentTime) }}</span>
                                            <span class="sep">/</span>
                                            <span>{{ formatClock(duration) }}</span>
                                        </div>
                                    </div>

                                    <div class="right-controls">
                                        <div class="volume-control">
                                            <button class="btn icon" @click="toggleMute">
                                                <Icon :icon="muted || volume === 0 ? 'mdi:volume-mute' : volume < 0.5 ? 'mdi:volume-low' : 'mdi:volume-high'" />
                                            </button>
                                            <div class="volume-slider-wrapper">
                                                <input
                                                    class="volume-slider"
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    v-model.number="volume"
                                                    @input="applyVolume"
                                                    :style="volumeStyle"
                                                />
                                            </div>
                                        </div>

                                        <div class="speed-control">
                                            <div class="speed-trigger">
                                                <span class="speed-text">{{ playbackRate }}x</span>
                                                <div class="speed-menu-wrapper">
                                                    <div class="speed-menu">
                                                        <div class="speed-list">
                                                            <button
                                                                v-for="r in rates"
                                                                :key="r"
                                                                class="speed-item"
                                                                :class="{ active: playbackRate === r }"
                                                                @click="applyRate(r)"
                                                            >
                                                                {{ r }}x
                                                            </button>
                                                        </div>
                                                        <div class="custom-speed">
                                                            <input
                                                                v-model="customRate"
                                                                class="custom-input"
                                                                placeholder="自定义"
                                                                type="number"
                                                                step="0.1"
                                                                @keyup.enter="applyRate(customRate)"
                                                            />
                                                            <button class="custom-btn" @click="applyRate(customRate)">确认</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button class="btn icon" :disabled="!pipSupported" @click="togglePiP" title="画中画">
                                            <Icon :icon="pipIcon" />
                                        </button>

                                        <button class="btn icon" @click="toggleFullscreen" title="全屏">
                                            <Icon :icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="comment-panel" :class="{ open: commentPanelVisible }" @click.stop>
                        <div class="comment-panel-header">
                            <div class="header-left">
                                <span class="title">全部评论</span>
                                <span class="count" v-if="postData.commentCount > 0">({{ formatCount(postData.commentCount) }})</span>
                            </div>
                            <button class="panel-close" @click="commentPanelVisible = false">
                                <Icon icon="ep:close" />
                            </button>
                        </div>

                        <div class="comment-panel-body" ref="commentBodyRef" @scroll="handleCommentScroll">
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
                                        <button class="action-btn reply-btn" @click="handleReplyToComment(comment)">回复</button>
                                        <button v-if="Number(comment.replyCount || 0) > 0" class="action-btn toggle-reply-btn" @click="toggleReplies(comment)">
                                            {{ resolveReplyState(comment).open ? '收起' : `展开 ${comment.replyCount} 条回复` }}
                                            <Icon :icon="resolveReplyState(comment).open ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
                                        </button>
                                    </div>

                                    <div class="comment-replies" v-if="resolveReplyState(comment).open">
                                        <div v-for="(reply, rIndex) in resolveReplyState(comment).list" :key="reply.id ?? rIndex" class="reply-item">
                                            <el-avatar :size="24" :src="getCommentAvatar(reply)" class="reply-avatar" />
                                            <div class="reply-main">
                                                <div class="reply-user-info">
                                                    <span class="reply-name">{{ getCommentName(reply) }}</span>
                                                    <span v-if="reply.replyUserNickName" class="reply-arrow">
                                                        <Icon icon="mdi:menu-right" />
                                                        {{ reply.replyUserNickName }}
                                                    </span>
                                                </div>
                                                <div class="reply-content" @click="handleReplyToReply(reply, comment)">
                                                    {{ reply.content }}
                                                </div>
                                                <div class="reply-meta">
                                                    <span class="reply-time">{{ formatCommentTime(reply.createTime) }}</span>
                                                    <button class="action-btn reply-btn" @click="handleReplyToReply(reply, comment)">回复</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-if="!resolveReplyState(comment).noMore" class="load-more-replies">
                                            <button @click="loadReplies(comment)" :disabled="resolveReplyState(comment).loading">
                                                {{ resolveReplyState(comment).loading ? '加载中...' : '查看更多回复' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="commentLoading" class="comment-loading">
                                <div class="loading-spinner"></div>
                                <span>正在加载评论...</span>
                            </div>
                            <div v-if="commentNoMore && commentItems.length > 0" class="comment-end">- 到底了 -</div>
                        </div>

                        <div class="comment-panel-footer">
                            <div v-if="replyTarget" class="reply-context-bar">
                                <span class="reply-text">回复 @{{ replyTarget.replyUserName }}</span>
                                <button class="cancel-reply" @click="clearReplyTarget">
                                    <Icon icon="ep:close" />
                                </button>
                            </div>
                            <div class="input-area">
                                <el-input
                                    ref="commentInputRef"
                                    v-model="commentDraft"
                                    type="textarea"
                                    :rows="1"
                                    :autosize="{ minRows: 1, maxRows: 4 }"
                                    maxlength="200"
                                    :placeholder="commentPlaceholder"
                                    class="comment-input"
                                    @keydown.enter.exact.prevent="submitComment"
                                />
                                <button class="send-btn" :disabled="!commentDraft.trim()" @click="submitComment">
                                    <Icon icon="mdi:send" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="right-sidebar">
                        <div class="sidebar-item avatar-wrapper">
                            <el-avatar :size="48" :src="authorAvatar" class="author-avatar" />
                        </div>

                        <div class="sidebar-item" @click.stop="emitAction('like')">
                            <div class="icon-wrapper">
                                <Icon icon="mdi:heart" :class="{ liked: postData.isLiked }" />
                            </div>
                            <span class="count">{{ formatCount(postData.likeCount) }}</span>
                        </div>

                        <div class="sidebar-item" :class="{ active: commentPanelVisible }" @click.stop="toggleCommentPanel">
                            <div class="icon-wrapper">
                                <Icon icon="mdi:comment-processing" />
                            </div>
                            <span class="count">{{ formatCount(postData.commentCount) }}</span>
                        </div>

                        <div class="sidebar-item" @click.stop="emitAction('collect')">
                            <div class="icon-wrapper">
                                <Icon icon="mdi:star" :class="{ collected: postData.isCollected }" />
                            </div>
                            <span class="count">{{ formatCount(postData.collectCount) }}</span>
                        </div>

                        <div class="sidebar-item" @click.stop="emitAction('share')">
                            <div class="icon-wrapper">
                                <Icon icon="mdi:share" />
                            </div>
                            <span class="count">{{ formatCount(postData.shareCount) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { parseTime } from '@/utils/ruoyi'
import { getImgUrl } from '@/utils/img'
import { listCommentReplies, listTopComments } from '@/api/content/postComment'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    src: { type: String, default: '' },
    post: { type: Object, default: () => ({}) },
    userInfo: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'close', 'action'])

const { proxy } = getCurrentInstance()

const visible = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})

const postData = computed(() => props.post || {})
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
const commentPageSize = 10
const replyStateMap = ref({})
const replyTarget = ref(null)

const isPlaying = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const seeking = ref(false)

const volume = ref(1)
const muted = ref(false)

const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
const playbackRate = ref(1)
const customRate = ref('')
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

const getCommentId = comment => comment?.id ?? comment?.commentId ?? null
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

const loadTopComments = async ({ reset = false } = {}) => {
    const postId = activePostId.value
    if (reset) resetComments()
    if (!postId || commentLoading.value || commentNoMore.value) return
    commentLoading.value = true
    try {
        const res = await listTopComments({
            postId,
            lastId: commentLastId.value,
            lastCreateTime: commentLastCreateTime.value,
            limit: commentPageSize
        })
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.rows) ? res.rows : []
        if (list.length) {
            commentItems.value = [...commentItems.value, ...list]
            const lastItem = list[list.length - 1]
            commentLastId.value = lastItem?.id ?? commentLastId.value
            commentLastCreateTime.value = lastItem?.createTime ?? commentLastCreateTime.value
            if (list.length < commentPageSize) commentNoMore.value = true
        } else {
            commentNoMore.value = true
        }
    } catch (error) {
        console.error(error)
    } finally {
        commentLoading.value = false
    }
}

const handleCommentScroll = () => {
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

const bgStyle = computed(() => {
    const s = String(props.src || '').trim()
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
const progressValue = computed({
    get: () => (seeking.value ? progressTemp.value : currentTime.value),
    set: v => {
        progressTemp.value = Number(v || 0)
    }
})
const progressTemp = ref(0)
const progressStyle = computed(() => {
    const max = progressMax.value || 1
    const val = progressValue.value
    const percentage = (val / max) * 100
    return {
        backgroundSize: `${percentage}% 100%`
    }
})

const volumeStyle = computed(() => {
    const percentage = volume.value * 100
    return {
        backgroundSize: `${percentage}% 100%`
    }
})

const formatClock = s => {
    const sec = Math.max(0, Math.floor(Number(s) || 0))
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const r = sec % 60
    const mm = String(m).padStart(2, '0')
    const rr = String(r).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${rr}` : `${m}:${rr.padStart(2, '0')}`
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

const togglePlay = () => {
    const el = playerRef.value
    if (!el) return
    if (el.paused) el.play?.()
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
    syncPiPSupport()
    updateWatermarkAndFit()
}

const onTimeUpdate = () => {
    const el = playerRef.value
    if (!el) return
    if (!seeking.value) currentTime.value = Number(el.currentTime || 0)
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

const onSeekInput = e => {
    seeking.value = true
    const v = Number(e?.target?.value || 0)
    progressTemp.value = v
}

const onSeekChange = e => {
    const el = playerRef.value
    if (!el) return
    const v = Number(e?.target?.value || 0)
    el.currentTime = Math.min(Number(el.duration || 0), Math.max(0, v))
    currentTime.value = Number(el.currentTime || 0)
    seeking.value = false
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

const toggleCommentPanel = () => {
    commentPanelVisible.value = !commentPanelVisible.value
    if (commentPanelVisible.value) {
        nextTick(() => commentInputRef.value?.focus?.())
        return
    }
    clearReplyTarget()
    commentDraft.value = ''
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
        createTime: now.toISOString()
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
    emitAction('comment', { content, parentCommentId: parentId, replyUserId })
    commentDraft.value = ''
    clearReplyTarget()
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
    seeking.value = false
    showWatermark.value = false
    pipActive.value = false
    commentPanelVisible.value = false
    commentDraft.value = ''
    clearReplyTarget()
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('fullscreenchange', handleResize)
}

const initPlayer = async () => {
    if (!visible.value || !props.src) return
    await nextTick()
    const el = playerRef.value
    if (!el) return
    syncPiPSupport()
    window.addEventListener('resize', handleResize)
    document.addEventListener('fullscreenchange', handleResize)
    el.playbackRate = Number(playbackRate.value || 1)
    el.volume = Math.min(1, Math.max(0, Number(volume.value)))
    updateWatermarkAndFit()
    try {
        await el.play?.()
    } catch (e) {
        console.error(e)
    }
}

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
    }
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

onBeforeUnmount(() => {
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
    transition: transform 0.3s ease;

    &.comment-open {
        .player-shell {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }
        .right-sidebar {
            opacity: 0;
            pointer-events: none;
        }
    }
}

.player-shell {
    position: relative;
    flex: 1;
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    transition: border-radius 0.3s ease;
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

.top-bar {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 10;
    pointer-events: none;
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
    right: -80px;
    width: 60px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;
    justify-content: flex-end;
    padding-bottom: 120px;
    z-index: 13;
    transition: opacity 0.2s ease;
}

.sidebar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    color: #fff;

    &.active .icon-wrapper {
        color: #face15;
    }
}

.icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(4px);
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
    padding: 24px 32px 16px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-content {
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    max-width: 80%;
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

/* 控制栏重构 */
.controls-layer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: auto;
    opacity: 0;
    transition: opacity 0.3s;
}

.player-shell:hover .controls-layer {
    opacity: 1;
}

.progress-container {
    width: 100%;
}

.progress {
    width: 100%;
    height: 4px;
    appearance: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    cursor: pointer;
    background-image: linear-gradient(#fff, #fff);
    background-repeat: no-repeat;
    transition: height 0.1s;

    &:hover {
        height: 6px;
    }

    &::-webkit-slider-thumb {
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        transform: scale(0);
        transition: transform 0.1s;
    }

    &:hover::-webkit-slider-thumb {
        transform: scale(1);
    }
}

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.left-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.right-controls {
    display: flex;
    align-items: center;
    gap: 16px;
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

.btn.icon {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    background: transparent;
    color: #fff;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
}

.volume-control {
    display: flex;
    align-items: center;
    position: relative;

    &:hover .volume-slider-wrapper {
        width: 80px;
        opacity: 1;
        padding-left: 8px;
    }
}

.volume-slider-wrapper {
    width: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
}

.volume-slider {
    width: 80px;
    height: 4px;
    appearance: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    background-image: linear-gradient(#fff, #fff);
    background-repeat: no-repeat;
    cursor: pointer;

    &::-webkit-slider-thumb {
        appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #fff;
    }
}

.speed-control {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
}

.speed-trigger {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0 4px;
    height: 100%;
}

.speed-text {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    transition: color 0.2s;
}

.speed-trigger:hover .speed-text {
    color: #face15;
}

.speed-menu-wrapper {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding-bottom: 12px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease 0.1s;
}

.speed-trigger:hover .speed-menu-wrapper {
    opacity: 1;
    pointer-events: auto;
    transition-delay: 0s;
}

.speed-menu {
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 120px;
}

.speed-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
}

.speed-item {
    background: transparent;
    border: none;
    color: #ccc;
    font-size: 12px;
    padding: 6px 4px;
    border-radius: 4px;
    cursor: pointer;
    text-align: center;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }

    &.active {
        color: #face15;
        font-weight: 600;
        background: rgba(250, 206, 21, 0.1);
    }
}

.custom-speed {
    display: flex;
    gap: 4px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-input {
    flex: 1;
    width: 0;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    color: #fff;
    padding: 4px;
    font-size: 12px;
    text-align: center;

    &:focus {
        outline: 1px solid #face15;
    }
}

.custom-btn {
    background: #face15;
    color: #000;
    border: none;
    border-radius: 4px;
    padding: 0 8px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
        background: #fbd63d;
    }
}

.comment-panel {
    width: 400px;
    height: 100%;
    background: rgba(24, 24, 28, 0.98);
    backdrop-filter: blur(20px);
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateX(0);
    width: 0;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.open {
        width: 400px;
        opacity: 1;
    }
}

.comment-panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
    }

    .count {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        margin-left: 6px;
    }

    .panel-close {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;

        &:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }
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
        margin-bottom: 6px;
        cursor: pointer;
    }

    .comment-actions {
        display: flex;
        gap: 16px;

        .action-btn {
            background: transparent;
            border: none;
            padding: 0;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: color 0.2s;

            &:hover {
                color: #face15;
            }

            &.toggle-reply-btn {
                display: flex;
                align-items: center;
                gap: 2px;
            }
        }
    }

    .comment-replies {
        margin-top: 12px;
        padding-left: 12px;
        border-left: 2px solid rgba(255, 255, 255, 0.1);
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
                    color: rgba(255, 255, 255, 0.3);

                    .reply-btn:hover {
                        color: #face15;
                        cursor: pointer;
                    }
                }
            }
        }

        .load-more-replies button {
            background: transparent;
            border: none;
            color: #face15;
            font-size: 12px;
            cursor: pointer;
            padding: 4px 0;

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
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
            background: transparent;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 2px;
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
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid transparent;
            border-radius: 18px;
            color: #fff;
            padding: 8px 12px;
            min-height: 36px !important;
            line-height: 20px;
            font-size: 14px;

            &:focus {
                background: rgba(255, 255, 255, 0.1);
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
            border: none;
            background: #face15;
            color: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;

            &:disabled {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.3);
                cursor: not-allowed;
            }

            &:not(:disabled):hover {
                transform: scale(1.05);
                background: #fbd63d;
            }
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
        }
    }

    .right-sidebar {
        right: 12px;
        bottom: 80px;
        padding-bottom: 0;
    }
}
</style>
