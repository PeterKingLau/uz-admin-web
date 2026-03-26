<template>
    <div class="app-container user-profile-page">
        <div class="profile-header">
            <div class="banner">
                <img :src="userInfo.bgImage || defaultBg" alt="banner" />
                <div class="banner-mask"></div>
            </div>
            <div class="user-info-wrapper">
                <div class="avatar-container">
                    <el-avatar :size="100" :src="userInfo.avatar" class="avatar-img" />
                </div>
                <div class="info-content">
                    <div class="name-row">
                        <span class="nickname">{{ userInfo.nickName }}</span>
                        <div class="tags"></div>
                    </div>
                    <div class="stat-row">
                        <template v-if="followStatsLoading && !hasFollowStatsCache">
                            <div class="stat-item skeleton">
                                <span class="num skeleton-text">--</span>
                                <span class="label">关注</span>
                            </div>
                            <div class="stat-divider"></div>
                            <div class="stat-item skeleton">
                                <span class="num skeleton-text">--</span>
                                <span class="label">粉丝</span>
                            </div>
                            <div class="stat-divider"></div>
                            <div class="stat-item skeleton">
                                <span class="num skeleton-text">--</span>
                                <span class="label">互关</span>
                            </div>
                        </template>
                        <template v-else>
                            <div class="stat-item" @click="openFollowDialog('following')">
                                <span class="num">{{ userInfo.following || 0 }}</span>
                                <span class="label">关注</span>
                            </div>
                            <div class="stat-divider"></div>
                            <div class="stat-item" @click="openFollowDialog('followers')">
                                <span class="num">{{ userInfo.followers || 0 }}</span>
                                <span class="label">粉丝</span>
                            </div>
                            <div class="stat-divider"></div>
                            <div class="stat-item" @click="openFollowDialog('mutual')">
                                <span class="num">{{ userInfo.mutualCount || 0 }}</span>
                                <span class="label">互关</span>
                            </div>
                        </template>
                    </div>
                    <div class="desc-row">
                        <p>{{ userInfo.signature || '暂时还没想到个性签名' }}</p>
                    </div>
                </div>
                <div class="action-btn">
                    <el-button type="primary" plain class="edit-btn" @click="goToProfile">编辑资料</el-button>
                </div>
            </div>
        </div>

        <ContentModule
            v-model="activeTab"
            :total="total"
            :like-count="likeTotal"
            :bookmark-count="bookmarkTotal"
            :post-list="postList"
            :collection-list="collectionList"
            :collection-loading="collectionLoading"
            :loading="loading"
            :no-more="noMore"
            :get-cover="getCover"
            :get-video-url="getVideoUrl"
            @tab-click="handleTabClick"
            @load-more="loadMore"
            @preview="handlePreview"
            @works-filter-change="handleWorksFilterChange"
            @collection-changed="handleCollectionChanged"
            @posts-deleted="handlePostsDeleted"
            @create-collection="handleCreateCollection"
        />

        <PostPreviewModal
            ref="previewModalRef"
            v-model="previewVisible"
            :post="previewPost"
            :media-list="previewMediaList"
            :tags="previewTags"
            :comments="previewComments"
            :comments-loading="previewCommentsLoading"
            :is-following="isPreviewFollowing"
            :is-liked="isPreviewLiked"
            :is-collected="isPreviewCollected"
            :follow-loading="previewFollowLoading"
            :like-loading="likeActionLoading"
            :bookmark-loading="bookmarkActionLoading"
            :repost-loading="repostActionLoading"
            :is-author-self="isPreviewAuthorSelf"
            v-model:commentDraft="commentDraft"
            :comment-placeholder="commentPlaceholder"
            :is-action-input-expanded="isActionInputExpanded"
            :format-relative-time="formatRelativeTime"
            :resolve-avatar="resolveAvatar"
            :get-comment-reply-count="getCommentReplyCount"
            :resolve-reply-state="resolveReplyState"
            :can-delete-comment="canDeleteComment"
            :is-delete-comment-loading="isDeleteCommentLoading"
            @close="closePreview"
            @follow="handlePreviewFollow"
            @action="handlePreviewAction"
            @reply-comment="handleReplyToComment"
            @reply-reply="handleReplyToReply"
            @toggle-replies="toggleCommentReplies"
            @load-replies="loadCommentReplies"
            @delete-comment="handleDeleteComment"
            @submit-comment="submitPreviewComment"
            @focus-comment="focusCommentInput"
            @blur-comment="handleActionInputBlur"
        />

        <FollowDialog
            ref="followDialogRef"
            v-model="followDialogVisible"
            v-model:activeTab="followActiveTab"
            :follow-stats="followStats"
            :follow-list="followList"
            :follow-loading="followLoading"
            :follow-no-more="followNoMore"
            :is-follow-action-loading="isFollowActionLoading"
            :toggle-follow="toggleFollow"
            @tab-click="handleFollowTabClick"
        />
    </div>
</template>

<script setup name="ViewsContentPersonProfile">
import { ref, reactive, onMounted, onActivated, onBeforeUnmount, nextTick, computed, watch, getCurrentInstance } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { addComment, bookmarkPost, likePost, listPostByApp, listPostByBookMark, listPostByLike, repostPost } from '@/api/content/post'
import { deleteComment, listCommentReplies, listTopComments } from '@/api/content/postComment'
import { addCollection, listMyCollections } from '@/api/content/collection'
import { listFollowers, listFollowing, listMutual, selectFollowNum, toggleFollowUser } from '@/api/content/userFollow'
import { getUserProfile } from '@/api/system/user'
import useUserStore from '@/store/modules/user'
import { useFollowStatsStore } from '@/store/modules/followStats'
import { getImgUrl } from '@/utils/img'
import { POST_TYPE } from '@/utils/enum'
import {
    appendPreviewComment,
    formatRelativeTime,
    getCommentId,
    getCommentReplyCount,
    getCommentUserId,
    normalizeCommentList,
    normalizeMediaUrls,
    resolvePreviewFollowState,
    setPreviewFollowState,
    toLocalDateTime
} from '@/utils/content/common'
import ContentModule from './components/ContentModule/index.vue'
import PostPreviewModal from './components/Modal/PostPreviewModal.vue'
import FollowDialog from './components/Dialog/FollowDialog.vue'
import defaultBg from '@/assets/images/bg_profile.jpeg'

const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const followStatsStore = useFollowStatsStore()
const VIDEO_PLAYER_CACHE_KEY = 'video-player-payload'

const activeTab = ref('works')
const loading = ref(false)
const noMore = ref(false)
const total = ref(0)
const likeTotal = ref(0)
const bookmarkTotal = ref(0)
const postList = ref([])
const collectionList = ref([])
const collectionLoading = ref(false)
const collectionLoaded = ref(false)
const collectionFetchedAt = ref(0)
const COLLECTION_CACHE_TTL = 60 * 1000
const createCollectionLoading = ref(false)
const profileInfo = ref({})
const followStats = ref({
    following: 0,
    followers: 0,
    mutualCount: 0
})

const followStatsLoading = computed(() => followStatsStore.isLoading(queryParams.targetUserId))
const hasFollowStatsCache = computed(() => followStatsStore.getCachedStats(queryParams.targetUserId) !== null)

const previewVisible = ref(false)
const previewPost = ref(null)
const previewFollowLoading = ref(false)
const likeActionLoading = ref(false)
const bookmarkActionLoading = ref(false)
const commentActionLoading = ref(false)
const repostActionLoading = ref(false)
const previewCommentsLoading = ref(false)
const commentDraft = ref('')
const previewModalRef = ref(null)
const isActionInputFocused = ref(false)
const deleteCommentLoading = reactive({})
const replyTarget = ref(null)
const replyStateMap = ref({})
const replyPageSize = 10

const followDialogVisible = ref(false)
const followActiveTab = ref('following')
const followList = ref([])
const followLoading = ref(false)
const followNoMore = ref(false)
const followDialogRef = ref(null)
const followLastId = ref(undefined)
const followPageSize = 20
const followTabSet = new Set(['following', 'followers', 'mutual'])
const followRequestId = ref(0)
const followActionLoading = reactive({})
let followObserver = null
let cleanupTimer = null

const queryParams = reactive({
    pageNum: 1,
    limit: 15,
    targetUserId: null,
    lastId: undefined,
    lastCreateTime: undefined,
    postType: undefined
})

const allowedPostTypes = [String(POST_TYPE.TEXT), String(POST_TYPE.IMAGE), String(POST_TYPE.VIDEO)]
const allowedPostTypeSet = new Set(allowedPostTypes)
const resolvePostType = value => {
    const fallback = allowedPostTypes.join(',')
    if (value === undefined || value === null || value === '') return fallback
    const normalized = String(value)
    return allowedPostTypeSet.has(normalized) ? normalized : fallback
}
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const clampStats = (following, followers, mutualCount) => {
    const followingCount = Math.max(0, Number(following) || 0)
    const followerCount = Math.max(0, Number(followers) || 0)
    const mutualCountValue = Math.max(0, Number(mutualCount) || 0)
    return { following: followingCount, followers: followerCount, mutualCount: Math.min(mutualCountValue, followingCount, followerCount) }
}

const normalizeSexValue = value => {
    if (value === null || value === undefined) return ''
    return String(value)
}

const userInfo = computed(() => {
    const profile = profileInfo.value || {}
    const avatar = profile.avatar ? getImgUrl(profile.avatar) : userStore.avatar || ''
    const stats = clampStats(followStats.value.following, followStats.value.followers, followStats.value.mutualCount)
    return {
        ...profile,
        nickName: profile.nickName || userStore.nickName || '未知用户',
        avatar,
        following: stats.following,
        followers: stats.followers,
        mutualCount: stats.mutualCount,
        likes: profile.likes ?? 0,
        likedCount: profile.likedCount ?? 0
    }
})

const normalizeFollowTab = value => (followTabSet.has(value) ? value : 'following')

const followApiMap = {
    following: listFollowing,
    followers: listFollowers,
    mutual: listMutual
}

const resolveFollowState = (item, activeTab) => {
    if (typeof item?.isFollowing === 'boolean') return item.isFollowing
    if (typeof item?.isFollow === 'boolean') return item.isFollow
    if (typeof item?.followed === 'boolean') return item.followed
    if (typeof item?.followStatus === 'boolean') return item.followStatus
    if (item?.followStatus != null) return String(item.followStatus) === '1'
    if (item?.isFollowing != null) return String(item.isFollowing) === '1'
    if (item?.isFollow != null) return String(item.isFollow) === '1'
    if (item?.followed != null) return String(item.followed) === '1'
    const relation = String(item?.relationType || '').toUpperCase()
    if (relation === 'MUTUAL' || relation === 'FOLLOWING') return true
    if (relation === 'FOLLOWER') return false
    return activeTab === 'following' || activeTab === 'mutual'
}

const normalizeFollowList = (list, activeTab) =>
    list.map(item => ({
        ...item,
        avatar: getImgUrl(item.avatar || ''),
        isFollowing: resolveFollowState(item, activeTab)
    }))

const getFollowTargetId = item => item?.userId ?? item?.id

const isFollowActionLoading = item => {
    const targetUserId = getFollowTargetId(item)
    if (targetUserId == null) return false
    return Boolean(followActionLoading[targetUserId])
}

const isMutualLikeRow = item => {
    if (followActiveTab.value === 'mutual') return true
    const relation = String(item?.relationType || item?.relation || item?.followRelation || '').toUpperCase()
    if (relation === 'MUTUAL' || relation === 'EACH_OTHER' || relation === 'BOTH') return true
    if (item?.isMutual != null) return String(item.isMutual) === '1' || item.isMutual === true
    if (item?.mutual != null) return String(item.mutual) === '1' || item.mutual === true
    return false
}

const syncMutualCountFromListIfNeeded = () => {
    if (!followDialogVisible.value) return
    if (followActiveTab.value !== 'mutual') return
    const stats = clampStats(followStats.value.following, followStats.value.followers, followList.value.length)
    followStats.value = { ...followStats.value, mutualCount: stats.mutualCount }
}

const resetFollowList = () => {
    followList.value = []
    followLastId.value = undefined
    followNoMore.value = false
    followLoading.value = false
    followRequestId.value += 1
}

const getFollowList = async () => {
    if (followLoading.value || followNoMore.value) return
    followLoading.value = true
    const requestId = followRequestId.value
    const activeTab = followActiveTab.value

    try {
        const api = followApiMap[activeTab]
        const response = await api({
            lastId: followLastId.value,
            size: followPageSize
        })
        const responseList = Array.isArray(response?.data) ? response.data : Array.isArray(response?.rows) ? response.rows : []
        if (requestId !== followRequestId.value || !followDialogVisible.value) return

        if (responseList.length > 0) {
            const normalized = normalizeFollowList(responseList, activeTab)
            followList.value = [...followList.value, ...normalized]
            followLastId.value = responseList[responseList.length - 1]?.id
            if (responseList.length < followPageSize) followNoMore.value = true
            syncMutualCountFromListIfNeeded()
        } else {
            followNoMore.value = true
            syncMutualCountFromListIfNeeded()
        }
    } catch (error) {
        console.error(error)
        if (requestId === followRequestId.value) followNoMore.value = true
    } finally {
        if (requestId === followRequestId.value) followLoading.value = false
    }
}

const loadMoreFollow = () => {
    if (!followNoMore.value) getFollowList()
}

const handleFollowIntersect = entries => {
    if (!entries?.some(entry => entry.isIntersecting)) return
    if (!followNoMore.value && !followLoading.value) loadMoreFollow()
}

const setupFollowObserver = async () => {
    if (followObserver) followObserver.disconnect()
    await nextTick()
    const listRef = followDialogRef.value?.followListRef?.value
    const triggerRef = followDialogRef.value?.followTriggerRef?.value
    if (!listRef || !triggerRef) return
    followObserver = new IntersectionObserver(handleFollowIntersect, {
        root: listRef,
        rootMargin: '0px 0px 120px 0px',
        threshold: 0.01
    })
    followObserver.observe(triggerRef)
}

watch(followDialogVisible, visible => {
    if (visible) setupFollowObserver()
    else {
        followObserver?.disconnect()
        followObserver = null
    }
})

watch(
    () => followLoading.value,
    next => {
        const triggerRef = followDialogRef.value?.followTriggerRef?.value
        if (!next && followObserver && triggerRef) {
            followObserver.unobserve(triggerRef)
            followObserver.observe(triggerRef)
        }
    }
)

watch(previewVisible, visible => {
    isBodyScrollLocked.value = visible
})

const handleFollowTabClick = tab => {
    const nextTab = normalizeFollowTab(tab?.props?.name ?? tab?.paneName ?? followActiveTab.value)
    if (nextTab !== followActiveTab.value) followActiveTab.value = nextTab
    if (!followDialogVisible.value) return
    getFollowStats()
    resetFollowList()
    getFollowList()
}

const removeRowFromFollowList = targetUserId => {
    followList.value = followList.value.filter(row => getFollowTargetId(row) !== targetUserId)
    syncMutualCountFromListIfNeeded()
}

const resolveNextRelationType = (item, nowFollowing) => {
    const relation = String(item?.relationType || '').toUpperCase()
    if (nowFollowing) {
        if (relation === 'FOLLOWER' || relation === 'MUTUAL') return 'MUTUAL'
        return 'FOLLOWING'
    }
    if (relation === 'MUTUAL') return 'FOLLOWER'
    return 'NONE'
}

const toggleFollow = async item => {
    const targetUserId = getFollowTargetId(item)
    if (!targetUserId || isFollowActionLoading(item)) return
    followActionLoading[targetUserId] = true

    const wasFollowing = Boolean(item.isFollowing)
    const active = followActiveTab.value
    const wasMutual = isMutualLikeRow(item)
    const nowFollowing = !wasFollowing

    try {
        await toggleFollowUser({ targetUserId })
        item.isFollowing = nowFollowing
        item.relationType = resolveNextRelationType(item, nowFollowing)

        let nextFollowing = followStats.value.following
        let nextMutual = followStats.value.mutualCount

        if (active === 'following') {
            nextFollowing = Math.max(0, Number(nextFollowing || 0) + (nowFollowing ? 1 : -1))
            if (!nowFollowing && wasMutual) nextMutual = Math.max(0, Number(nextMutual || 0) - 1)
        } else if (active === 'mutual') {
            nextFollowing = Math.max(0, Number(nextFollowing || 0) + (nowFollowing ? 1 : -1))
            if (!nowFollowing) nextMutual = Math.max(0, Number(nextMutual || 0) - 1)
        } else if (active === 'followers') {
            if (nowFollowing) {
                nextFollowing = Math.max(0, Number(nextFollowing || 0) + 1)
                nextMutual = Math.max(0, Number(nextMutual || 0) + 1)
            } else {
                nextFollowing = Math.max(0, Number(nextFollowing || 0) - 1)
                if (wasMutual) nextMutual = Math.max(0, Number(nextMutual || 0) - 1)
            }
        }

        const stats = clampStats(nextFollowing, followStats.value.followers, nextMutual)
        followStats.value = { ...followStats.value, following: stats.following, mutualCount: stats.mutualCount }

        followStatsStore.setCachedStats(queryParams.targetUserId, followStats.value)

        if (wasFollowing && (active === 'following' || active === 'mutual')) {
            removeRowFromFollowList(targetUserId)
        } else if (active === 'mutual' && !nowFollowing) {
            removeRowFromFollowList(targetUserId)
        }

        getFollowStats()
    } catch (error) {
        console.error(error)
    } finally {
        followActionLoading[targetUserId] = false
    }
}

const getCover = item => {
    const mediaList = getMediaList(item)
    return mediaList[0] || ''
}

const getVideoUrl = item => {
    const mediaList = getMediaList(item)
    return mediaList[1] || mediaList[0] || ''
}

const getMediaList = item => {
    if (Array.isArray(item.mediaList) && item.mediaList.length > 0) return item.mediaList
    return normalizeMediaUrls(item.mediaUrls || item.fileList || item.files || [])
}

const previewMediaList = computed(() => {
    const post = previewPost.value
    if (!post) return []
    return getMediaList(post)
})

const previewTags = computed(() => {
    const post = previewPost.value
    if (!post) return []
    if (Array.isArray(post.tags)) {
        return post.tags.map(tag => tag?.tagName ?? tag?.name ?? tag?.label).filter(item => Boolean(item))
    }
    if (typeof post.tagStr === 'string') {
        return post.tagStr
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    }
    return []
})

const previewComments = computed(() => {
    const post = previewPost.value
    if (!post) return []
    const list = post.comments ?? post.commentList ?? post.topComments ?? []
    return Array.isArray(list) ? list : []
})

const resolveAvatar = avatar => getImgUrl(avatar || '')
const getCommentName = comment => comment?.nickName || comment?.userName || comment?.username || comment?.authorName || '用户'
const canDeleteComment = comment => {
    const commentUserId = getCommentUserId(comment)
    if (userStore.id == null) return false
    return String(userStore.id) === String(commentUserId)
}
const isDeleteCommentLoading = comment => {
    const commentId = getCommentId(comment)
    return commentId != null && Boolean(deleteCommentLoading[commentId])
}
const ensureReplyState = commentId => {
    if (!commentId) return null
    if (!replyStateMap.value[commentId]) {
        replyStateMap.value[commentId] = {
            open: false,
            loading: false,
            list: [],
            noMore: true,
            lastId: undefined,
            lastCreateTime: undefined
        }
    }
    return replyStateMap.value[commentId]
}
const resolveReplyState = comment => {
    const commentId = getCommentId(comment)
    return ensureReplyState(commentId) || { open: false, loading: false, list: [], noMore: true }
}

const resolveReplyRemoveCount = (commentId, comment) => {
    const rawCount = Number(comment?.replyCount || 0)
    const replyCount = Number.isFinite(rawCount) ? rawCount : 0
    const state = replyStateMap.value?.[commentId]
    const loadedCount = Array.isArray(state?.list) ? state.list.length : 0
    return Math.max(replyCount, loadedCount)
}

const removePreviewComment = (post, commentId) => {
    if (!post) return
    const targetId = String(commentId)
    if (Array.isArray(post.commentList)) {
        post.commentList = post.commentList.filter(item => String(getCommentId(item)) !== targetId)
        return
    }
    if (Array.isArray(post.comments)) {
        post.comments = post.comments.filter(item => String(getCommentId(item)) !== targetId)
        return
    }
    if (Array.isArray(post.topComments)) {
        post.topComments = post.topComments.filter(item => String(getCommentId(item)) !== targetId)
    }
}

const removeLocalComment = (commentId, parent) => {
    const post = previewPost.value
    if (!post) return
    const targetId = String(commentId)
    if (parent) {
        const parentId = getCommentId(parent)
        const state = ensureReplyState(parentId)
        if (state) {
            state.list = state.list.filter(item => String(getCommentId(item)) !== targetId)
        }
        parent.replyCount = Math.max(0, Number(parent.replyCount || 0) - 1)
        post.commentCount = Math.max(0, Number(post.commentCount || 0) - 1)
    } else {
        const comment = previewComments.value.find(item => String(getCommentId(item)) === targetId)
        const removeReplies = resolveReplyRemoveCount(targetId, comment)
        removePreviewComment(post, targetId)
        if (replyStateMap.value?.[targetId]) {
            delete replyStateMap.value[targetId]
        }
        post.commentCount = Math.max(0, Number(post.commentCount || 0) - (1 + Math.max(0, removeReplies)))
    }
    updatePostInList(getPreviewPostId(post), { commentCount: post.commentCount })
}

const getPostAuthorId = post => post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? null

const isSelfAuthorPost = post => {
    const authorUserId = getPostAuthorId(post)
    if (authorUserId == null || userStore.id == null) return false
    return String(authorUserId) === String(userStore.id)
}

const isPreviewFollowing = computed(() => {
    if (isSelfAuthorPost(previewPost.value)) return false
    return resolvePreviewFollowState(previewPost.value)
})
const isPreviewLiked = computed(() => Boolean(previewPost.value?.isLiked ?? previewPost.value?.like))
const isPreviewCollected = computed(() => Boolean(previewPost.value?.isCollected ?? previewPost.value?.bookmark))
const canSubmitComment = computed(() => Boolean(commentDraft.value.trim()))
const isActionInputExpanded = computed(() => isActionInputFocused.value)
const commentPlaceholder = computed(() => (replyTarget.value ? `回复 @${replyTarget.value.replyUserName}` : '说点什么...'))

const resolvePostId = post => post?.postId ?? post?.id ?? null

const updatePostInList = (postId, patch) => {
    if (!postId) return
    const targetId = String(postId)
    const index = postList.value.findIndex(item => String(resolvePostId(item)) === targetId)
    if (index === -1) return
    postList.value[index] = { ...postList.value[index], ...patch }
}

const removePostFromList = postId => {
    if (!postId) return false
    const targetId = String(postId)
    const nextList = postList.value.filter(item => String(resolvePostId(item)) !== targetId)
    if (nextList.length === postList.value.length) return false
    postList.value = nextList
    return true
}

const handlePostsDeleted = payload => {
    const ids = Array.isArray(payload?.ids) ? payload.ids : Array.isArray(payload) ? payload : []
    if (!ids.length) return
    const idSet = new Set(ids.map(id => String(id)))
    const nextList = postList.value.filter(item => !idSet.has(String(resolvePostId(item))))
    const removed = postList.value.length - nextList.length
    if (!removed) return
    postList.value = nextList
    if (payload?.tab === 'likes') {
        likeTotal.value = Math.max(0, likeTotal.value - removed)
    } else if (payload?.tab === 'bookmarks') {
        bookmarkTotal.value = Math.max(0, bookmarkTotal.value - removed)
    } else {
        total.value = Math.max(0, total.value - removed)
    }
}

const getPreviewPostId = post => resolvePostId(post)

const updateLikeTotal = delta => {
    if (!delta) return
    likeTotal.value = Math.max(0, Number(likeTotal.value || 0) + delta)
}

const updateBookmarkTotal = delta => {
    if (!delta) return
    bookmarkTotal.value = Math.max(0, Number(bookmarkTotal.value || 0) + delta)
}

const getPreviewTargetUserId = post =>
    post?.targetUserId ?? post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? userStore.id ?? null

const isPreviewAuthorSelf = computed(() => {
    const post = previewPost.value
    if (!post) return false
    return isSelfAuthorPost(post)
})

const buildPreviewComment = content => ({
    id: `local-${Date.now()}`,
    content,
    userId: userStore.id,
    userName: userStore.nickName || userStore.name || '用户',
    nickName: userStore.nickName || userStore.name || '用户',
    avatar: userInfo.value?.avatar || userStore.avatar || '',
    createTime: toLocalDateTime()
})

const normalizePostFlags = item => {
    const resolveActiveFlag = value => {
        if (typeof value === 'boolean') return value
        if (value != null) return String(value) === '1'
        return false
    }
    const likeValue = item?.like ?? item?.isLiked ?? item?.liked ?? item?.likeStatus ?? item?.isLike
    const bookmarkValue = item?.bookmark ?? item?.isCollected ?? item?.collected ?? item?.collectStatus ?? item?.isCollect
    const like = resolveActiveFlag(likeValue)
    const bookmark = resolveActiveFlag(bookmarkValue)
    const follow = isSelfAuthorPost(item) ? false : resolvePreviewFollowState(item)
    const normalizedLike = activeTab.value === 'likes' ? true : like
    const normalizedBookmark = activeTab.value === 'bookmarks' ? true : bookmark
    return {
        ...item,
        like: normalizedLike,
        isLiked: normalizedLike,
        bookmark: normalizedBookmark,
        isCollected: normalizedBookmark,
        follow,
        isFollow: follow,
        isFollowing: follow,
        followed: follow,
        followStatus: follow ? '1' : '0'
    }
}

const syncFollowStateForUser = (userId, nextFollowing) => {
    if (userId == null) return
    const target = String(userId)
    postList.value.forEach(item => {
        const itemUserId = getPostAuthorId(item)
        if (itemUserId == null || String(itemUserId) !== target) return
        setPreviewFollowState(item, nextFollowing)
    })
}

const getList = async () => {
    if (loading.value) return
    loading.value = true
    try {
        const params = {
            limit: queryParams.limit,
            targetUserId: queryParams.targetUserId,
            lastId: queryParams.lastId,
            lastCreateTime: queryParams.lastCreateTime,
            postType: resolvePostType(queryParams.postType)
        }
        const response =
            activeTab.value === 'likes'
                ? await listPostByLike(params)
                : activeTab.value === 'bookmarks'
                  ? await listPostByBookMark(params)
                  : await listPostByApp(params)
        const responseList = Array.isArray(response?.data) ? response.data : Array.isArray(response?.rows) ? response.rows : []
        let hasNonVideo = false
        if (responseList.length > 0) {
            const filteredList = responseList.filter(item => allowedPostTypeSet.has(String(item?.postType)))
            hasNonVideo = filteredList.length !== responseList.length
            const normalizedList = filteredList.map(item => ({
                ...normalizePostFlags(item),
                mediaList: normalizeMediaUrls(item.mediaUrls || item.fileList || item.files || [])
            }))
            postList.value = [...postList.value, ...normalizedList]
            const lastItem = responseList[responseList.length - 1]
            queryParams.lastId = lastItem.id
            queryParams.lastCreateTime = lastItem.createTime
            if (responseList.length < queryParams.limit) noMore.value = true
        } else {
            noMore.value = true
        }
        const totalFromResponse = response?.total ?? response?.data?.total ?? response?.count
        const nextTotal = hasNonVideo ? postList.value.length : Number.isFinite(Number(totalFromResponse)) ? Number(totalFromResponse) : postList.value.length
        if (activeTab.value === 'likes') {
            likeTotal.value = nextTotal
        } else if (activeTab.value === 'bookmarks') {
            bookmarkTotal.value = nextTotal
        } else {
            total.value = nextTotal
        }
    } catch (error) {
        console.error(error)
        noMore.value = true
    } finally {
        loading.value = false
    }
}

const resolveTotalFromResponse = (response, fallback = 0) => {
    const totalFromResponse = response?.total ?? response?.data?.total ?? response?.count
    const nextTotal = Number(totalFromResponse)
    if (Number.isFinite(nextTotal)) return nextTotal
    return fallback
}

const resolveTotalFromListResponse = (response, fallback = 0) => {
    const responseList = Array.isArray(response?.data) ? response.data : Array.isArray(response?.rows) ? response.rows : []
    const filteredList = responseList.filter(item => allowedPostTypeSet.has(String(item?.postType)))
    const hasNonVideo = filteredList.length !== responseList.length
    const resolvedTotal = resolveTotalFromResponse(response, Number.NaN)
    if (!hasNonVideo && Number.isFinite(resolvedTotal)) return resolvedTotal
    if (filteredList.length > 0) return filteredList.length
    if (Number.isFinite(resolvedTotal)) return resolvedTotal
    return fallback
}

const loadInitialTabTotals = async () => {
    const params = {
        limit: queryParams.limit,
        lastId: queryParams.lastId,
        lastCreateTime: queryParams.lastCreateTime,
        postType: resolvePostType(queryParams.postType)
    }
    if (queryParams.targetUserId !== null && queryParams.targetUserId !== undefined && queryParams.targetUserId !== '') {
        params.targetUserId = queryParams.targetUserId
    }
    try {
        const [likeResponse, bookmarkResponse] = await Promise.all([listPostByLike(params), listPostByBookMark(params)])
        likeTotal.value = resolveTotalFromListResponse(likeResponse, likeTotal.value)
        bookmarkTotal.value = resolveTotalFromListResponse(bookmarkResponse, bookmarkTotal.value)
    } catch (error) {
        console.error(error)
    }
}

const shouldUseCollectionCache = () => collectionLoaded.value && Date.now() - collectionFetchedAt.value < COLLECTION_CACHE_TTL

const getCollectionList = async (force = false) => {
    if (collectionLoading.value) return
    if (!force && shouldUseCollectionCache()) return
    collectionLoading.value = true
    try {
        const response = await listMyCollections()
        const responseList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
        collectionList.value = responseList
        collectionLoaded.value = true
        collectionFetchedAt.value = Date.now()
    } catch (error) {
        console.error(error)
    } finally {
        collectionLoading.value = false
    }
}

const loadCommentReplies = async comment => {
    const postId = getPreviewPostId(previewPost.value)
    const parentId = getCommentId(comment)
    if (!postId || !parentId) return
    const state = ensureReplyState(parentId)
    if (!state || state.loading || state.noMore) return
    state.loading = true
    try {
        const response = await listCommentReplies({
            postId,
            parentId,
            lastId: state.lastId,
            lastCreateTime: state.lastCreateTime,
            limit: replyPageSize
        })
        const list = normalizeCommentList(response)
        state.list = [...state.list, ...list]
        const lastItem = list[list.length - 1]
        if (lastItem) {
            state.lastId = lastItem?.id ?? state.lastId
            state.lastCreateTime = lastItem?.createTime ?? state.lastCreateTime
        }
        state.noMore = list.length < replyPageSize
    } catch (error) {
        console.error(error)
        state.noMore = true
    } finally {
        state.loading = false
    }
}

const toggleCommentReplies = comment => {
    const commentId = getCommentId(comment)
    if (!commentId) return
    const state = ensureReplyState(commentId)
    if (!state) return
    state.open = !state.open
    if (state.open && state.list.length === 0) {
        state.noMore = false
        loadCommentReplies(comment)
    }
}

const loadPreviewComments = async (post, options = {}) => {
    const postId = getPreviewPostId(post)
    if (!postId) return
    replyStateMap.value = {}
    if (!options.silent) previewCommentsLoading.value = true
    try {
        const response = await listTopComments({ postId, limit: 20 })
        const list = normalizeCommentList(response)
        const totalCount = response?.total ?? response?.data?.total ?? response?.count
        if (previewPost.value && String(getPreviewPostId(previewPost.value)) === String(postId)) {
            previewPost.value.commentList = list
            if (Number.isFinite(Number(totalCount))) {
                previewPost.value.commentCount = Number(totalCount)
            }
        }
    } catch (error) {
        console.error(error)
    } finally {
        if (!options.silent) previewCommentsLoading.value = false
    }
}

const clearReplyTarget = () => {
    replyTarget.value = null
}

const handleDeleteComment = async (comment, parent) => {
    const commentId = getCommentId(comment)
    if (!commentId || !canDeleteComment(comment) || isDeleteCommentLoading(comment)) return
    if (String(commentId).startsWith('local-')) {
        proxy?.$modal?.msgWarning?.('评论正在同步，请稍后重试')
        loadPreviewComments(previewPost.value, { silent: true })
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
        await deleteComment({ id: commentId, userId: userStore.id || undefined })
        removeLocalComment(commentId, parent)
        proxy?.$modal?.msgSuccess?.('删除成功')
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('删除失败')
    } finally {
        deleteCommentLoading[commentId] = false
    }
}

const handleReplyToComment = comment => {
    const commentId = getCommentId(comment)
    if (!commentId) return
    replyTarget.value = {
        parentId: commentId,
        replyUserId: comment?.userId ?? comment?.user?.id ?? comment?.authorId ?? comment?.createBy ?? null,
        replyUserName: getCommentName(comment)
    }
    nextTick(() => {
        previewModalRef.value?.focusInput?.()
    })
}

const handleReplyToReply = (reply, parent) => {
    const parentId = getCommentId(parent)
    if (!parentId) return
    replyTarget.value = {
        parentId,
        replyUserId: reply?.userId ?? reply?.user?.id ?? reply?.authorId ?? reply?.createBy ?? null,
        replyUserName: getCommentName(reply)
    }
    nextTick(() => {
        previewModalRef.value?.focusInput?.()
    })
}

const handleCreateCollection = async payload => {
    if (createCollectionLoading.value) return
    const title = String(payload?.title || '').trim()
    const description = String(payload?.desc || '').trim()
    const coverUrl = String(payload?.coverUrl || '').trim()
    if (!title || !coverUrl) {
        proxy?.$modal?.msgWarning?.('请完善合集信息')
        return
    }
    createCollectionLoading.value = true
    proxy?.$modal?.loading?.('正在创建合集...')
    try {
        await addCollection({
            title,
            coverUrl,
            description,
            sortType: 0
        })
        proxy?.$modal?.msgSuccess?.('创建成功')
        getCollectionList(true)
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('创建失败')
    } finally {
        proxy?.$modal?.closeLoading?.()
        createCollectionLoading.value = false
    }
}

const getProfile = async () => {
    try {
        const response = await getUserProfile()
        const responseData = response?.data ?? {}
        const profile = responseData.user ?? responseData
        profileInfo.value = {
            ...profile,
            sex: normalizeSexValue(profile.sex ?? profile.gender ?? responseData.sex ?? responseData.gender)
        }
        const resolvedUserId = profile.userId ?? profile.id ?? responseData.userId ?? responseData.id ?? null
        if (resolvedUserId != null && resolvedUserId !== '' && queryParams.targetUserId !== resolvedUserId) {
            queryParams.targetUserId = resolvedUserId
            loadInitialTabTotals()
        }
    } catch (error) {
        console.error(error)
    }
}

const getFollowStats = async () => {
    const userId = queryParams.targetUserId
    if (!userId) return

    const cached = followStatsStore.getCachedStats(userId)
    if (cached) {
        followStats.value = cached
    } else {
        followStatsStore.setLoading(userId, true)
    }

    try {
        const response = await selectFollowNum({ targetUserId: userId })
        const responseData = response?.data ?? {}
        const followingCountRaw = responseData.followerCount ?? 0
        const followersCountRaw = responseData.fans ?? 0
        const mutualCountRaw = responseData.eachOtherCount ?? 0
        const useMutualListCount = followDialogVisible.value && followActiveTab.value === 'mutual'
        const mutualFrom = useMutualListCount ? followList.value.length : mutualCountRaw
        const stats = clampStats(followingCountRaw, followersCountRaw, mutualFrom)

        followStats.value = stats
        followStatsStore.setCachedStats(userId, stats)

        syncMutualCountFromListIfNeeded()
    } catch (error) {
        console.error(error)
    } finally {
        followStatsStore.setLoading(userId, false)
    }
}

const loadMore = () => {
    if (!noMore.value) getList()
}

const handleTabClick = tab => {
    const nextTab = tab?.props?.name ?? activeTab.value
    if (nextTab !== activeTab.value) {
        activeTab.value = nextTab
    }
    postList.value = []
    noMore.value = false
    queryParams.lastId = undefined
    queryParams.lastCreateTime = undefined
    getList()
}

const handleWorksFilterChange = value => {
    if (value === 'collection') getCollectionList()
}

const handleCollectionChanged = () => getCollectionList(true)

const handlePreview = item => {
    if (!item) return
    if (item.postType === POST_TYPE.VIDEO) {
        const src = getVideoUrl(item)
        const postId = item?.postId ?? item?.id
        if (!src || postId == null) return
        const normalized = normalizePostFlags(item)
        const cacheKey = `${VIDEO_PLAYER_CACHE_KEY}:${postId}`
        proxy?.$cache?.session?.setJSON?.(cacheKey, {
            id: postId,
            src,
            post: normalized,
            userInfo: userInfo.value,
            from: route.fullPath
        })
        router.push({ name: 'VideoPlayer', params: { id: postId }, query: { from: route.fullPath } })
        return
    }

    previewPost.value = normalizePostFlags(item)
    commentDraft.value = ''
    isActionInputFocused.value = false
    previewVisible.value = true
    loadPreviewComments(previewPost.value)
}

const resetPreview = () => {
    previewPost.value = null
    commentDraft.value = ''
    isActionInputFocused.value = false
    previewCommentsLoading.value = false
    replyStateMap.value = {}
    replyTarget.value = null
}

const closePreview = () => {
    previewVisible.value = false
    resetPreview()
}

const focusCommentInput = () => {
    isActionInputFocused.value = true
    nextTick(() => {
        previewModalRef.value?.focusInput?.()
    })
}

const handleActionInputBlur = () => {
    isActionInputFocused.value = false
    clearReplyTarget()
}

const submitPreviewComment = async () => {
    const post = previewPost.value
    if (!post || commentActionLoading.value) return
    const content = commentDraft.value.trim()
    if (!content) return
    const postId = getPreviewPostId(post)
    const targetUserId = getPreviewTargetUserId(post)
    if (!postId || !targetUserId) return
    const parentCommentId = replyTarget.value?.parentId ?? null
    const replyUserId = replyTarget.value?.replyUserId ?? null
    const replyUserName = replyTarget.value?.replyUserName ?? ''
    const draftComment = {
        ...buildPreviewComment(content),
        parentId: parentCommentId,
        replyUserId,
        replyUserNickName: replyUserName
    }
    post.commentCount = Number(post.commentCount || 0) + 1
    if (parentCommentId) {
        const parent = previewComments.value.find(item => String(getCommentId(item)) === String(parentCommentId))
        if (parent) {
            parent.replyCount = Number(parent.replyCount || 0) + 1
            const state = ensureReplyState(parentCommentId)
            if (state) {
                state.open = true
                state.list = [...state.list, draftComment]
            }
        }
    } else {
        appendPreviewComment(post, draftComment)
    }
    commentDraft.value = ''
    isActionInputFocused.value = false
    clearReplyTarget()
    updatePostInList(postId, { commentCount: post.commentCount })
    commentActionLoading.value = true
    try {
        await addComment({
            postId,
            targetUserId,
            content,
            parentCommentId: parentCommentId || undefined,
            replyUserId: replyUserId || undefined
        })
        loadPreviewComments(post, { silent: true })
    } catch (error) {
        console.error(error)
    } finally {
        commentActionLoading.value = false
    }
}

const handlePreviewAction = async type => {
    const post = previewPost.value
    if (!post) return
    const postId = getPreviewPostId(post)
    if (!postId) return

    if (type === 'like') {
        const targetUserId = getPreviewTargetUserId(post)
        if (!targetUserId) return
        if (likeActionLoading.value) return
        likeActionLoading.value = true
        const wasLiked = Boolean(post.isLiked ?? post.like)
        try {
            const response = await likePost({ postId, targetUserId })
            const activeState = response?.data?.active
            const nextLiked = typeof activeState === 'boolean' ? activeState : !wasLiked
            if (nextLiked !== wasLiked) {
                post.isLiked = nextLiked
                post.like = nextLiked
                const nextCount = Number(post.likeCount || 0) + (nextLiked ? 1 : -1)
                post.likeCount = Math.max(0, nextCount)
                updateLikeTotal(nextLiked ? 1 : -1)
            }
            updatePostInList(postId, {
                isLiked: nextLiked,
                like: nextLiked,
                likeCount: post.likeCount
            })
            if (activeTab.value === 'likes' && !nextLiked) {
                const removed = removePostFromList(postId)
                if (removed) {
                    if (!noMore.value) getList()
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            likeActionLoading.value = false
        }
    }

    if (type === 'collect') {
        const targetUserId = getPreviewTargetUserId(post)
        if (!targetUserId) return
        if (bookmarkActionLoading.value) return
        bookmarkActionLoading.value = true
        const wasCollected = Boolean(post.isCollected ?? post.bookmark)
        try {
            const response = await bookmarkPost({ postId, targetUserId })
            const activeState = response?.data?.active
            const nextCollected = typeof activeState === 'boolean' ? activeState : !wasCollected
            if (nextCollected !== wasCollected) {
                post.isCollected = nextCollected
                post.bookmark = nextCollected
                const baseCount = Number(post.bookmarkCount ?? post.collectCount ?? 0)
                const nextCount = baseCount + (nextCollected ? 1 : -1)
                post.bookmarkCount = Math.max(0, nextCount)
                if (post.collectCount != null) post.collectCount = post.bookmarkCount
                updateBookmarkTotal(nextCollected ? 1 : -1)
            }
            updatePostInList(postId, {
                isCollected: nextCollected,
                bookmark: nextCollected,
                bookmarkCount: post.bookmarkCount
            })
            if (activeTab.value === 'bookmarks' && !nextCollected) {
                const removed = removePostFromList(postId)
                if (removed) {
                    if (!noMore.value) getList()
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            bookmarkActionLoading.value = false
        }
    }

    if (type === 'share') {
        if (repostActionLoading.value) return
        let content = ''
        try {
            const promptResult = await proxy?.$modal?.prompt?.('请输入转发内容')
            content = String(promptResult?.value ?? '').trim()
        } catch {
            return
        }
        if (!content) return
        repostActionLoading.value = true
        try {
            await repostPost({ originalPostId: postId, content })
            post.repostCount = Number(post.repostCount || 0) + 1
            if (post.shareCount != null) post.shareCount = Number(post.shareCount || 0) + 1
        } catch (error) {
            console.error(error)
        } finally {
            repostActionLoading.value = false
        }
    }
}

const handlePreviewFollow = async () => {
    const post = previewPost.value
    if (!post || previewFollowLoading.value || isPreviewAuthorSelf.value) return
    const targetUserId = getPreviewTargetUserId(post)
    if (!targetUserId) return
    const wasFollowing = isPreviewFollowing.value
    previewFollowLoading.value = true
    try {
        await toggleFollowUser({ targetUserId })
        setPreviewFollowState(post, !wasFollowing)
        syncFollowStateForUser(targetUserId, !wasFollowing)
    } catch (error) {
        console.error(error)
    } finally {
        previewFollowLoading.value = false
    }
}

const goToProfile = () => {
    router.push({ name: 'Profile' })
}

const syncSelfTargetUserId = () => {
    const nextId = userStore.id
    if (nextId == null || nextId === '') return false
    if (String(queryParams.targetUserId) === String(nextId)) return false
    queryParams.targetUserId = nextId
    return true
}

const openFollowDialog = type => {
    followActiveTab.value = normalizeFollowTab(type)
    followDialogVisible.value = true
    getFollowStats()
    resetFollowList()
    getFollowList()
}

onMounted(() => {
    syncSelfTargetUserId()
    getProfile()
    getFollowStats()
    loadInitialTabTotals()
    getList()

    cleanupTimer = setInterval(() => {
        followStatsStore.clearExpiredCache()
    }, 60 * 1000)
})

onActivated(() => {
    syncSelfTargetUserId()
    getProfile()
    getFollowStats()
    loadInitialTabTotals()
})

watch(
    () => userStore.id,
    () => {
        if (!syncSelfTargetUserId()) return
        followStatsStore.clearCache(queryParams.targetUserId)
        collectionList.value = []
        collectionLoaded.value = false
        collectionFetchedAt.value = 0
        getProfile()
        getFollowStats()
        loadInitialTabTotals()
        getList()
    }
)

onBeforeUnmount(() => {
    followObserver?.disconnect()
    followObserver = null
    isBodyScrollLocked.value = false

    if (cleanupTimer !== null) {
        clearInterval(cleanupTimer)
        cleanupTimer = null
    }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/content/profile-shared.scss' as profile;

@include profile.profile-header;
@include profile.profile-skeleton;
</style>
