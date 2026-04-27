<template>
    <div class="client-profile-page">
        <ClientHeader :show-search="false" @brand-click="goDiscover" />

        <main class="page-main">
            <div class="main-inner">
                <aside class="left-sidebar">
                    <div class="sidebar-sticky-container">
                        <nav class="sidebar-nav">
                            <button
                                v-for="item in sideNavItems"
                                :key="item.key"
                                class="nav-item"
                                :class="{ active: item.key === activeSideKey }"
                                @click="handleSideNavClick(item.key)"
                            >
                                <Icon :icon="item.icon" class="nav-icon" />
                                <span class="nav-label">{{ item.label }}</span>
                            </button>
                        </nav>

                        <div class="sidebar-footer">
                            <div class="tips-card">
                                <h3 class="tips-title">个人主页</h3>
                                <ul class="tips-list">
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:image-multiple-outline" />
                                        </div>
                                        <span>集中查看你发布的作品</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:heart-outline" />
                                        </div>
                                        <span>整理喜欢和收藏的内容</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:account-group-outline" />
                                        </div>
                                        <span>关注粉丝数据一目了然</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>

                <section class="content-area">
                    <ProfileHeader
                        :cover-url="profileCover"
                        :avatar="displayAvatar"
                        :name="displayName"
                        :bio="displaySignature"
                        :stats="statItems"
                        :is-self="isSelfProfile"
                        :is-following="isProfileFollowing"
                        :follow-loading="profileFollowLoading"
                        @edit="handleEditProfile"
                        @follow="handleProfileFollow"
                        @stat-click="handleProfileStatClick"
                    />

                    <div class="profile-feed">
                        <ProfileTabs v-model="activeTab" :tabs="tabItems" />

                        <ProfileContentGrid
                            :items="postList"
                            :loading="loading"
                            :loading-more="loadingMore"
                            :no-more="noMore"
                            :empty-text="emptyText"
                            :empty-icon="emptyIcon"
                            @preview="openPost"
                            @load-more="loadMore"
                        />
                    </div>
                </section>
            </div>
        </main>

        <PostPreviewModal
            ref="previewModalRef"
            v-model="previewVisible"
            :post="previewPost"
            :media-list="previewMediaList"
            :tags="previewTags"
            :comments="previewComments"
            :comments-loading="previewCommentsLoading"
            :is-following="false"
            :is-liked="isPreviewLiked"
            :is-collected="false"
            :follow-loading="false"
            :like-loading="false"
            :bookmark-loading="false"
            :repost-loading="false"
            :is-author-self="isSelfProfile"
            v-model:commentDraft="commentDraft"
            :comment-placeholder="commentPlaceholder"
            :is-action-input-expanded="isActionInputFocused"
            :format-relative-time="formatRelativeTime"
            :resolve-avatar="resolveAvatar"
            :get-comment-reply-count="getCommentReplyCount"
            :resolve-reply-state="resolveReplyState"
            :can-delete-comment="canDeleteComment"
            :is-delete-comment-loading="isDeleteCommentLoading"
            @close="closePreview"
            @action="handlePreviewAction"
            @focus-comment="focusCommentInput"
            @blur-comment="handleActionInputBlur"
            @submit-comment="submitPreviewComment"
            @reply-comment="handleReplyComment"
            @reply-reply="handleReplyReply"
            @toggle-replies="toggleCommentReplies"
            @load-replies="loadCommentReplies"
            @delete-comment="noop"
            @follow="noop"
        />

        <ProfileFollowDialog
            v-model="followDialogVisible"
            v-model:active-tab="followActiveTab"
            :follow-stats="followStats"
            :follow-list="followList"
            :follow-loading="followLoading"
            :follow-no-more="followNoMore"
            :is-follow-action-loading="isFollowActionLoading"
            :toggle-follow="toggleFollowInDialog"
            :resolve-avatar="resolveAvatar"
            @tab-change="handleFollowTabChange"
            @load-more="loadMoreFollowList"
            @select-user="handleSelectFollowUser"
        />

        <ProfileEditDialog v-if="isSelfProfile" v-model="editDialogVisible" :profile="profileInfo" @saved="handleProfileSaved" />
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientProfile' })
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getClientUserProfile } from '@/api/client/profile'
import { addComment, likePost, listPostByApp, listPostByBookMark, listPostByLike } from '@/api/content/post'
import { listCommentReplies, listTopComments } from '@/api/content/postComment'
import { listFollowers, listFollowing, selectFollowNum, toggleFollowUser } from '@/api/content/userFollow'
import ClientHeader from '@/views/client/components/ClientHeader.vue'
import PostPreviewModal from '@/views/content/personProfile/components/Modal/PostPreviewModal.vue'
import ProfileContentGrid from './components/ProfileContentGrid.vue'
import ProfileEditDialog from './components/ProfileEditDialog.vue'
import ProfileFollowDialog from './components/ProfileFollowDialog.vue'
import ProfileHeader from './components/ProfileHeader.vue'
import ProfileTabs from './components/ProfileTabs.vue'
import useSettingsStore from '@/store/modules/settings'
import useUserStore from '@/store/modules/user'
import { POST_TYPE } from '@/utils/enum'
import { buildTextCoverDataUrl } from '@/utils/textCover'
import {
    getCommentId,
    getCommentReplyCount as resolveCommentReplyCount,
    getCommentUserId,
    normalizeCommentList,
    parseMediaRaw,
    resolveFollowFlag,
    resolveMediaUrl as resolveCommonMediaUrl
} from '@/utils/content/common'
import { decodeClientUserId, getClientUserProfileRoute } from '@/utils/routeAccess'
import defaultAvatar from '@/assets/images/profile.jpg'
import defaultBg from '@/assets/images/bg_profile.jpeg'

type ProfileTabKey = 'works' | 'likes' | 'bookmarks'
type FollowTabKey = 'following' | 'followers'

const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const userStore = useUserStore()

const activeTab = ref<ProfileTabKey>('works')
const loading = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)
const loadError = ref(false)
const profileInfo = ref<Record<string, any>>({})
const followStats = ref({
    following: 0,
    followers: 0
})
const postList = ref<any[]>([])
const totalMap = ref<Record<ProfileTabKey, number>>({
    works: 0,
    likes: 0,
    bookmarks: 0
})
const query = ref({
    limit: 15,
    lastId: undefined as number | undefined,
    lastCreateTime: undefined as string | undefined
})

const previewVisible = ref(false)
const previewPost = ref<any | null>(null)
const previewModalRef = ref<{ focusInput?: () => void } | null>(null)
const commentDraft = ref('')
const isActionInputFocused = ref(false)
const previewCommentsLoading = ref(false)
const replyStateMap = ref<Record<string, any>>({})
const replyTarget = ref<{ parent: Record<string, any>; replyTo: Record<string, any> } | null>(null)
const editDialogVisible = ref(false)
const profileFollowLoading = ref(false)
const followDialogVisible = ref(false)
const followActiveTab = ref<FollowTabKey>('following')
const followList = ref<any[]>([])
const followLoading = ref(false)
const followNoMore = ref(false)
const followLastId = ref<number | string | undefined>(undefined)
const followRequestId = ref(0)
const followActionLoading = ref<Record<string, boolean>>({})
const followPageSize = 20
const hasRouteUserId = computed(() => Boolean(route.params.userId))
const routeUserId = computed(() => {
    const value = route.params.userId
    const rawValue = Array.isArray(value) ? value[0] : value
    return decodeClientUserId(rawValue)
})
const currentUserId = computed(() => String(userStore.id || '').trim())
const profileUserId = computed(() => String(hasRouteUserId.value ? routeUserId.value : currentUserId.value || '').trim())
const isSelfProfile = computed(() => !hasRouteUserId.value || String(routeUserId.value) === currentUserId.value)
const activeSideKey = computed(() => (isSelfProfile.value ? 'profile' : ''))

const sideNavItems = [
    { key: 'discover', label: '发现', icon: 'mdi:compass-outline' },
    { key: 'publish', label: '发布', icon: 'mdi:plus-box-outline' },
    { key: 'profile', label: '主页', icon: 'mdi:account-circle-outline' }
]

const resolveMediaUrl = (url?: string) => resolveCommonMediaUrl(String(url || ''))
const displayName = computed(() =>
    String(profileInfo.value.nickName || profileInfo.value.userName || (isSelfProfile.value ? userStore.nickName || userStore.name : '') || '用户')
)
const displayAvatar = computed(() => resolveMediaUrl(profileInfo.value.avatar || (isSelfProfile.value ? userStore.avatar : '') || defaultAvatar))
const profileCover = computed(() => {
    const cover = profileInfo.value.bgImage || profileInfo.value.backgroundImage
    return cover ? resolveMediaUrl(cover) : defaultBg
})
const displaySignature = computed(() => String(profileInfo.value.signature || profileInfo.value.remark || '暂时还没有个人简介'))
const likedCount = computed(() => Number(profileInfo.value.likedCount ?? profileInfo.value.likes ?? sumLoadedLikes.value ?? 0))
const sumLoadedLikes = computed(() => postList.value.reduce((total, item) => total + (Number(item?.likeCount) || 0), 0))

const resolveProfileFollowState = (profile: Record<string, any>) => {
    if (!profile) return false
    const raw =
        profile.follow ??
        profile.isFollow ??
        profile.isFollowing ??
        profile.followed ??
        profile.followStatus ??
        profile.following ??
        profile.isFollowed ??
        profile.followFlag ??
        profile.hasFollow ??
        profile.isAttention ??
        profile.attention ??
        profile.isFocus ??
        profile.focus ??
        profile.focusStatus
    const normalized = resolveFollowFlag(raw)
    if (typeof normalized === 'boolean') return normalized
    const relation = String(profile.relationType || profile.relation || profile.followRelation || '').toUpperCase()
    return relation === 'MUTUAL' || relation === 'FOLLOWING'
}

const withProfileFollowState = (profile: Record<string, any>, nextFollowing: boolean) => ({
    ...(profile || {}),
    follow: nextFollowing,
    isFollow: nextFollowing,
    isFollowing: nextFollowing,
    followed: nextFollowing,
    followStatus: nextFollowing ? '1' : '0',
    isFollowed: nextFollowing,
    followFlag: nextFollowing ? '1' : '0',
    hasFollow: nextFollowing,
    isAttention: nextFollowing,
    attention: nextFollowing,
    isFocus: nextFollowing,
    focus: nextFollowing,
    focusStatus: nextFollowing ? '1' : '0'
})

const isProfileFollowing = computed(() => resolveProfileFollowState(profileInfo.value))

const formatCount = (value: unknown) => {
    const num = Number(value || 0)
    if (!Number.isFinite(num) || num <= 0) return '0'
    if (num >= 10000) return `${(num / 10000).toFixed(num >= 100000 ? 0 : 1).replace(/\.0$/, '')}w`
    return String(num)
}

const statItems = computed(() => [
    { key: 'following', label: '关注', value: formatCount(followStats.value.following), clickable: true },
    { key: 'followers', label: '粉丝', value: formatCount(followStats.value.followers), clickable: true },
    { key: 'liked', label: '获赞', value: formatCount(likedCount.value) }
])

const tabItems = computed(() => [
    { key: 'works', label: '作品', count: totalMap.value.works },
    { key: 'likes', label: '喜欢', count: totalMap.value.likes },
    { key: 'bookmarks', label: '收藏', count: totalMap.value.bookmarks }
])

const emptyText = computed(() => {
    if (loadError.value) return '内容加载失败，请稍后再试'
    if (activeTab.value === 'likes') return '还没有喜欢的内容'
    if (activeTab.value === 'bookmarks') return '暂无收藏内容'
    return '还没有发布作品'
})

const emptyIcon = computed(() => {
    if (loadError.value) return 'mdi:alert-circle-outline'
    if (activeTab.value === 'likes') return 'mdi:heart-outline'
    if (activeTab.value === 'bookmarks') return 'mdi:bookmark-outline'
    return 'mdi:image-multiple-outline'
})

const getPostKey = (item: any) => item?.id ?? item?.postId ?? `${item?.createTime || ''}-${item?.content || ''}`
const getType = (item: any) => String(item?.postType ?? '')
const isTextPost = (item: any) => getType(item) === POST_TYPE.TEXT
const isVideoPost = (item: any) => getType(item) === POST_TYPE.VIDEO
const isVideoUrl = (url: string) => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url || '')
const getContent = (item: any) => String(item?.content || '').trim() || '分享了一条内容'

const getTextCover = (item: any) => {
    const content = getContent(item)
    const seed = String(item?.id ?? item?.postId ?? content)
    return buildTextCoverDataUrl(content, seed)
}

const getCover = (item: any) => {
    if (isTextPost(item)) return getTextCover(item)
    const direct = item?.cover || item?.coverUrl || item?.thumbnail || item?.poster || item?.image
    if (direct) return resolveMediaUrl(direct)
    const list = parseMediaRaw(item?.mediaUrls || item?.files || [])
    const urls = list
        .map((media: any) => (typeof media === 'object' ? media?.cover || media?.thumbnail || media?.poster || media?.url : media))
        .map((url: string) => resolveMediaUrl(url))
        .filter(Boolean)
    return urls.find((url: string) => !isVideoUrl(url)) || urls[0] || ''
}

const previewMediaList = computed(() => {
    const post = previewPost.value
    if (!post) return []
    if (isTextPost(post)) return [getTextCover(post)]
    const list = parseMediaRaw(post?.mediaUrls || post?.files || [])
        .map((media: any) => (typeof media === 'object' ? media?.url || media?.cover || media?.thumbnail || media?.poster : media))
        .map((url: string) => resolveMediaUrl(url))
        .filter(Boolean)
    if (isVideoPost(post)) return list.filter((url: string) => isVideoUrl(url))
    const direct = getCover(post)
    return list.length ? list : direct ? [direct] : []
})

const previewTags = computed(() => {
    const post = previewPost.value
    if (!post) return []
    if (Array.isArray(post.tags)) return post.tags.map((tag: any) => tag?.tagName ?? tag?.name ?? tag?.label).filter(Boolean)
    if (typeof post.tagStr === 'string') {
        return post.tagStr
            .split(',')
            .map((item: string) => item.trim())
            .filter(Boolean)
    }
    return []
})

const isPreviewLiked = computed(() => Boolean(previewPost.value?.isLiked ?? previewPost.value?.like))
const commentPlaceholder = computed(() => {
    const target = replyTarget.value?.replyTo
    const name = target?.nickName || target?.userName || target?.username || target?.authorName || target?.user?.nickName || target?.user?.name
    return name ? `回复 ${name}...` : '说点什么...'
})
const previewComments = computed(() => {
    const post = previewPost.value
    if (!post) return []
    const list = post.comments ?? post.commentList ?? post.topComments ?? []
    return Array.isArray(list) ? list : []
})
const resolveAvatar = (avatar: string) => resolveMediaUrl(avatar)
const formatRelativeTime = (value?: string) => String(value || '')
const getCommentReplyCount = (comment: Record<string, any>) => resolveCommentReplyCount(comment)
const ensureReplyState = (commentId: string | number | null | undefined) => {
    if (!commentId) return null
    const key = String(commentId)
    if (!replyStateMap.value[key]) {
        replyStateMap.value[key] = {
            open: false,
            loading: false,
            list: [],
            noMore: true,
            lastId: undefined,
            lastCreateTime: undefined
        }
    }
    return replyStateMap.value[key]
}
const resolveReplyState = (comment: Record<string, any>) => {
    const commentId = getCommentId(comment)
    return ensureReplyState(commentId) || { open: false, loading: false, list: [], noMore: true }
}
const canDeleteComment = () => false
const isDeleteCommentLoading = () => false
const noop = () => {}
const isCanceledRequest = (error: any) => {
    const code = String(error?.code || '')
    const name = String(error?.name || '')
    const message = String(error?.message || '')
    return code === 'ERR_CANCELED' || name === 'CanceledError' || message === 'canceled' || error?.__CANCEL__ === true
}
const logIfNotCanceled = (error: any) => {
    if (isCanceledRequest(error)) return
    console.error(error)
}

const followApiMap = {
    following: listFollowing,
    followers: listFollowers
}

const normalizeFollowTab = (value: unknown): FollowTabKey => (value === 'followers' ? 'followers' : 'following')
const getFollowTargetId = (item: Record<string, any>) => item?.userId ?? item?.id ?? item?.targetUserId

const normalizeResponseList = (res: any) => {
    const data = res?.data
    const candidates = [res?.rows, res?.list, res?.records, res?.items, data?.rows, data?.list, data?.records, data?.items, data, res]
    const target = candidates.find(item => Array.isArray(item))
    return Array.isArray(target) ? target : []
}

const isSameUser = (left: unknown, right: unknown) => {
    const leftText = String(left ?? '').trim()
    const rightText = String(right ?? '').trim()
    return Boolean(leftText && rightText && leftText === rightText)
}

const resolveFollowState = (item: Record<string, any>, activeTab: FollowTabKey) => {
    const raw =
        item?.isFollowing ??
        item?.isFollow ??
        item?.followed ??
        item?.followStatus ??
        item?.followFlag ??
        item?.hasFollow ??
        item?.isAttention ??
        item?.attention ??
        item?.isFocus ??
        item?.focus ??
        item?.focusStatus
    const normalized = resolveFollowFlag(raw)
    if (typeof normalized === 'boolean') return normalized
    const relation = String(item?.relationType || item?.relation || item?.followRelation || '').toUpperCase()
    if (relation === 'MUTUAL' || relation === 'FOLLOWING') return true
    if (relation === 'FOLLOWER') return false
    return activeTab === 'following'
}

const normalizeFollowList = (list: any[], activeTab: FollowTabKey) =>
    list.map(item => {
        const targetUserId = getFollowTargetId(item)
        const relationType = isSameUser(targetUserId, currentUserId.value) ? 'SELF' : item?.relationType || item?.relation || item?.followRelation
        return {
            ...item,
            relationType,
            avatar: resolveMediaUrl(item?.avatar || item?.userAvatar || item?.headImg || ''),
            isFollowing: resolveFollowState(item, activeTab)
        }
    })

const isFollowActionLoading = (item: Record<string, any>) => {
    const targetUserId = getFollowTargetId(item)
    if (targetUserId == null || targetUserId === '') return false
    return Boolean(followActionLoading.value[String(targetUserId)])
}

const isMutualLikeRow = (item: Record<string, any>) => {
    const relation = String(item?.relationType || item?.relation || item?.followRelation || '').toUpperCase()
    if (relation === 'MUTUAL' || relation === 'EACH_OTHER' || relation === 'BOTH') return true
    if (item?.isMutual != null) return String(item.isMutual) === '1' || item.isMutual === true
    if (item?.mutual != null) return String(item.mutual) === '1' || item.mutual === true
    return false
}

const resolveNextRelationType = (item: Record<string, any>, nowFollowing: boolean) => {
    const relation = String(item?.relationType || '').toUpperCase()
    if (nowFollowing) {
        if (relation === 'FOLLOWER' || relation === 'MUTUAL') return 'MUTUAL'
        return 'FOLLOWING'
    }
    if (relation === 'MUTUAL') return 'FOLLOWER'
    return 'NONE'
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
    const targetUserId = resolveProfileUserId()
    if (!targetUserId) return

    followLoading.value = true
    const requestId = followRequestId.value
    const activeTab = followActiveTab.value

    try {
        const api = followApiMap[activeTab]
        const response = await api({
            targetUserId,
            lastId: followLastId.value,
            size: followPageSize
        })
        const rows = normalizeResponseList(response)
        if (requestId !== followRequestId.value || !followDialogVisible.value) return

        if (rows.length) {
            const existingIds = new Set(followList.value.map(row => String(getFollowTargetId(row))).filter(Boolean))
            const normalizedRows = normalizeFollowList(rows, activeTab).filter(row => {
                const rowId = String(getFollowTargetId(row) ?? '')
                if (!rowId || existingIds.has(rowId)) return false
                existingIds.add(rowId)
                return true
            })
            followList.value = followList.value.concat(normalizedRows)
            const last = rows[rows.length - 1]
            followLastId.value = last?.id ?? last?.userId ?? last?.targetUserId ?? undefined
            followNoMore.value = rows.length < followPageSize || normalizedRows.length === 0
        } else {
            followNoMore.value = true
        }
    } catch (error) {
        if (!isCanceledRequest(error)) {
            console.error(error)
            if (requestId === followRequestId.value) followNoMore.value = true
        }
    } finally {
        if (requestId === followRequestId.value) followLoading.value = false
    }
}

const openFollowDialog = (type: FollowTabKey) => {
    followActiveTab.value = normalizeFollowTab(type)
    followDialogVisible.value = true
    loadFollowStats()
    resetFollowList()
    getFollowList()
}

const handleProfileStatClick = (item: { key: string }) => {
    if (item.key !== 'following' && item.key !== 'followers') return
    openFollowDialog(item.key)
}

const handleFollowTabChange = (tab: FollowTabKey) => {
    followActiveTab.value = normalizeFollowTab(tab)
    loadFollowStats()
    resetFollowList()
    getFollowList()
}

const loadMoreFollowList = () => {
    getFollowList()
}

const toggleFollowInDialog = async (item: Record<string, any>) => {
    const targetUserId = getFollowTargetId(item)
    if (!targetUserId || isFollowActionLoading(item)) return
    const key = String(targetUserId)
    const wasFollowing = Boolean(item.isFollowing)
    const nowFollowing = !wasFollowing
    const activeTab = followActiveTab.value
    const wasMutual = isMutualLikeRow(item)

    followActionLoading.value = {
        ...followActionLoading.value,
        [key]: true
    }

    try {
        await toggleFollowUser({ targetUserId })
        item.isFollowing = nowFollowing
        item.relationType = resolveNextRelationType(item, nowFollowing)

        let nextFollowing = Number(followStats.value.following || 0)
        if (activeTab === 'following') {
            nextFollowing = Math.max(0, nextFollowing + (nowFollowing ? 1 : -1))
        } else if (activeTab === 'followers') {
            nextFollowing = Math.max(0, nextFollowing + (nowFollowing ? 1 : -1))
        }
        followStats.value = {
            ...followStats.value,
            following: nextFollowing
        }

        if (wasFollowing && activeTab === 'following') {
            followList.value = followList.value.filter(row => String(getFollowTargetId(row)) !== key)
        } else if (!nowFollowing && wasMutual) {
            item.relationType = 'FOLLOWER'
        }

        loadFollowStats()
    } catch (error) {
        logIfNotCanceled(error)
    } finally {
        const nextLoading = { ...followActionLoading.value }
        delete nextLoading[key]
        followActionLoading.value = nextLoading
    }
}

const handleSelectFollowUser = (item: Record<string, any>) => {
    const targetUserId = getFollowTargetId(item)
    if (targetUserId == null || targetUserId === '') return
    followDialogVisible.value = false
    if (isSameUser(targetUserId, currentUserId.value)) {
        router.push('/profile')
        return
    }
    router.push(getClientUserProfileRoute(targetUserId))
}

const getPreviewPostId = (post: any) => post?.postId ?? post?.id ?? null
const getPreviewTargetUserId = (post: any) =>
    post?.targetUserId ?? post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? resolveProfileUserId()

const loadPreviewComments = async (post: any) => {
    const postId = getPreviewPostId(post)
    if (!postId) return
    replyStateMap.value = {}
    previewCommentsLoading.value = true
    try {
        const response = await listTopComments({ postId, limit: 20 })
        const list = normalizeCommentList(response)
        const totalCount = (response as any)?.total ?? (response as any)?.data?.total ?? (response as any)?.count
        if (previewPost.value && String(getPreviewPostId(previewPost.value)) === String(postId)) {
            previewPost.value.commentList = list
            if (Number.isFinite(Number(totalCount))) {
                previewPost.value.commentCount = Number(totalCount)
            }
        }
    } catch (error) {
        logIfNotCanceled(error)
    } finally {
        previewCommentsLoading.value = false
    }
}

const loadCommentReplies = async (comment: Record<string, any>) => {
    const postId = getPreviewPostId(previewPost.value)
    const parentId = getCommentId(comment)
    const state = ensureReplyState(parentId)
    if (!postId || !parentId || !state || state.loading || state.noMore) return

    state.loading = true
    try {
        const response = await listCommentReplies({
            postId,
            parentId,
            limit: 10,
            lastId: state.lastId,
            lastCreateTime: state.lastCreateTime
        })
        const list = normalizeCommentList(response)
        state.list = state.list.concat(list)
        const last = list[list.length - 1]
        state.lastId = last?.id ?? last?.commentId ?? undefined
        state.lastCreateTime = last?.createTime ?? last?.createDate ?? undefined
        state.noMore = list.length < 10
    } catch (error) {
        if (!isCanceledRequest(error)) {
            console.error(error)
            state.noMore = true
        }
    } finally {
        state.loading = false
    }
}

const resetReplyState = (comment: Record<string, any>) => {
    const state = ensureReplyState(getCommentId(comment))
    if (!state) return null
    state.open = true
    state.loading = false
    state.list = []
    state.noMore = false
    state.lastId = undefined
    state.lastCreateTime = undefined
    return state
}

const toggleCommentReplies = async (comment: Record<string, any>) => {
    const state = ensureReplyState(getCommentId(comment))
    if (!state) return
    state.open = !state.open
    if (state.open && !state.list.length && getCommentReplyCount(comment) > 0) {
        state.noMore = false
        await loadCommentReplies(comment)
    }
}

const resolveCurrentUserId = () => currentUserId.value
const resolveProfileUserId = () => profileUserId.value

const loadProfile = async () => {
    const userId = resolveProfileUserId()
    if (!userId) return
    try {
        if (isSelfProfile.value) await userStore.ensureFreshProfile()
        const res = await getClientUserProfile(userId)
        const data = (res as any)?.data || res || {}
        profileInfo.value = data?.user || data?.profile || data
    } catch (error) {
        if (isCanceledRequest(error)) return
        console.error(error)
        profileInfo.value = isSelfProfile.value
            ? {
                  nickName: userStore.nickName,
                  userName: userStore.name,
                  avatar: userStore.avatar
              }
            : {}
    }
}

const loadFollowStats = async () => {
    const userId = resolveProfileUserId()
    if (!userId) return
    try {
        const res = await selectFollowNum({ targetUserId: userId })
        const data = (res as any)?.data || {}
        followStats.value = {
            following: Math.max(0, Number(data.followerCount ?? data.following ?? 0) || 0),
            followers: Math.max(0, Number(data.fans ?? data.followers ?? 0) || 0)
        }
        const followFlag = resolveFollowFlag(
            data.isFollow ??
                data.follow ??
                data.followStatus ??
                data.isFollowing ??
                data.followed ??
                data.followFlag ??
                data.focusStatus ??
                data.attention ??
                data.isAttention
        )
        if (typeof followFlag === 'boolean' && !isSelfProfile.value) {
            profileInfo.value = withProfileFollowState(profileInfo.value, followFlag)
        }
    } catch (error) {
        if (isCanceledRequest(error)) return
        console.error(error)
        followStats.value = { following: 0, followers: 0 }
    }
}

const fetchTabList = (tabKey: ProfileTabKey, isLoadMore: boolean) => {
    const userId = resolveProfileUserId()
    const params = {
        targetUserId: userId,
        isQuestion: 0,
        isCircle: 0,
        limit: query.value.limit,
        lastId: isLoadMore ? query.value.lastId : undefined,
        lastCreateTime: isLoadMore ? query.value.lastCreateTime : undefined
    }

    if (tabKey === 'likes') return listPostByLike(params)
    if (tabKey === 'bookmarks') return listPostByBookMark(params)
    return listPostByApp(params)
}

const extractListTotal = (res: any) => {
    const rows = (res as any)?.rows || (res as any)?.data || res || []
    const list = Array.isArray(rows) ? rows : []
    return Number((res as any)?.total ?? list.length) || list.length
}

const loadTabTotals = async () => {
    const userId = resolveProfileUserId()
    if (!userId) return

    const tabKeys: ProfileTabKey[] = ['works', 'likes', 'bookmarks']
    const results = await Promise.allSettled(tabKeys.map(tabKey => fetchTabList(tabKey, false)))
    const nextTotals = { ...totalMap.value }

    results.forEach((result, index) => {
        if (result.status !== 'fulfilled') {
            logIfNotCanceled(result.reason)
            return
        }
        nextTotals[tabKeys[index]] = extractListTotal(result.value)
    })

    totalMap.value = nextTotals
}

const loadPosts = async (isLoadMore = false) => {
    const userId = resolveProfileUserId()
    if (!userId || (isLoadMore && noMore.value)) return

    const tabKey = activeTab.value

    if (isLoadMore) loadingMore.value = true
    else loading.value = true
    loadError.value = false

    try {
        const res = await fetchTabList(tabKey, isLoadMore)
        if (tabKey !== activeTab.value) return
        const rows = ((res as any)?.rows || (res as any)?.data || res || []) as any[]
        const list = Array.isArray(rows) ? rows : []
        postList.value = isLoadMore ? postList.value.concat(list) : list
        const nextTotal = extractListTotal(res)
        totalMap.value = {
            ...totalMap.value,
            [tabKey]: nextTotal
        }
        const last = list[list.length - 1]
        query.value.lastId = Number(last?.id ?? last?.postId ?? 0) || undefined
        query.value.lastCreateTime = String(last?.createTime ?? last?.createDate ?? '') || undefined
        noMore.value = list.length < query.value.limit
    } catch (error) {
        if (isCanceledRequest(error)) return
        console.error(error)
        loadError.value = true
        if (!isLoadMore) postList.value = []
        noMore.value = true
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

const resetAndLoadPosts = () => {
    postList.value = []
    noMore.value = false
    loadError.value = false
    query.value.lastId = undefined
    query.value.lastCreateTime = undefined
    loadPosts(false)
}

const loadMore = () => {
    loadPosts(true)
}

const goDiscover = () => {
    router.push('/discover')
}

const handleSideNavClick = (key: string) => {
    if (key === 'discover') {
        router.push('/discover')
        return
    }
    if (key === 'publish') {
        const route = router.resolve('/publish')
        window.open(route.href, '_blank', 'noopener')
    }
}

const handleEditProfile = () => {
    if (!isSelfProfile.value) return
    editDialogVisible.value = true
}

const handleProfileFollow = async () => {
    const targetUserId = resolveProfileUserId()
    if (!targetUserId || isSelfProfile.value || profileFollowLoading.value) return
    const wasFollowing = isProfileFollowing.value
    profileFollowLoading.value = true
    try {
        await toggleFollowUser({ targetUserId })
        profileInfo.value = withProfileFollowState(profileInfo.value, !wasFollowing)
        followStats.value = {
            ...followStats.value,
            followers: Math.max(0, Number(followStats.value.followers || 0) + (wasFollowing ? -1 : 1))
        }
        loadFollowStats()
    } catch (error) {
        logIfNotCanceled(error)
    } finally {
        profileFollowLoading.value = false
    }
}

const handleProfileSaved = (payload: Record<string, any>) => {
    profileInfo.value = {
        ...profileInfo.value,
        ...payload,
        signature: payload.signature ?? payload.remark ?? profileInfo.value.signature
    }
    loadProfile()
}

const openPost = (post: any) => {
    if (!post) return
    previewPost.value = { ...post }
    previewVisible.value = true
    loadPreviewComments(previewPost.value)
}

const closePreview = () => {
    previewVisible.value = false
    previewPost.value = null
    commentDraft.value = ''
    isActionInputFocused.value = false
    previewCommentsLoading.value = false
    replyStateMap.value = {}
    replyTarget.value = null
}

const focusCommentInput = () => {
    isActionInputFocused.value = true
    nextTick(() => previewModalRef.value?.focusInput?.())
}

const handleReplyComment = (comment: Record<string, any>) => {
    replyTarget.value = { parent: comment, replyTo: comment }
    focusCommentInput()
}

const handleReplyReply = (reply: Record<string, any>, parent: Record<string, any>) => {
    replyTarget.value = { parent, replyTo: reply }
    focusCommentInput()
}

const handleActionInputBlur = () => {
    isActionInputFocused.value = false
    replyTarget.value = null
}

const submitPreviewComment = () => {
    const content = commentDraft.value.trim()
    const post = previewPost.value
    const postId = getPreviewPostId(post)
    const targetUserId = getPreviewTargetUserId(post)
    if (!content || !postId || !targetUserId) return
    const target = replyTarget.value
    const parentCommentId = target ? getCommentId(target.parent) : null
    const replyUserId = target ? getCommentUserId(target.replyTo) : null

    addComment({
        postId,
        targetUserId,
        content,
        ...(parentCommentId ? { parentCommentId } : {}),
        ...(replyUserId ? { replyUserId } : {})
    })
        .then(async () => {
            commentDraft.value = ''
            isActionInputFocused.value = false
            replyTarget.value = null
            if (post) {
                post.commentCount = Math.max(0, Number(post.commentCount || 0) + 1)
                if (target?.parent && parentCommentId) {
                    target.parent.replyCount = Math.max(0, Number(target.parent.replyCount || 0) + 1)
                    resetReplyState(target.parent)
                    await loadCommentReplies(target.parent)
                } else {
                    loadPreviewComments(post)
                }
            }
        })
        .catch(error => {
            logIfNotCanceled(error)
        })
}

const handlePreviewAction = async (type: 'like' | 'collect' | 'share') => {
    const post = previewPost.value
    if (!post || type !== 'like') return
    const postId = post?.postId ?? post?.id
    const targetUserId = post?.userId ?? post?.authorId ?? resolveProfileUserId()
    if (!postId || !targetUserId) return
    const wasLiked = Boolean(post.isLiked ?? post.like)
    const oldCount = Number(post.likeCount || 0)
    post.isLiked = !wasLiked
    post.like = !wasLiked
    post.likeCount = Math.max(0, oldCount + (!wasLiked ? 1 : -1))
    try {
        const res = await likePost({ postId, targetUserId })
        const active = (res as any)?.data?.active
        const nextLiked = typeof active === 'boolean' ? active : !wasLiked
        post.isLiked = nextLiked
        post.like = nextLiked
        post.likeCount = Math.max(0, oldCount + (nextLiked ? 1 : -1))
    } catch (error) {
        logIfNotCanceled(error)
        post.isLiked = wasLiked
        post.like = wasLiked
        post.likeCount = oldCount
    }
}

watch(
    () => activeTab.value,
    () => {
        resetAndLoadPosts()
    }
)

watch(followDialogVisible, visible => {
    if (visible) return
    resetFollowList()
    followActionLoading.value = {}
})

watch(
    () => profileUserId.value,
    (nextUserId, previousUserId) => {
        if (!nextUserId || nextUserId === previousUserId) return
        closePreview()
        followDialogVisible.value = false
        resetFollowList()
        editDialogVisible.value = false
        profileInfo.value = {}
        followStats.value = { following: 0, followers: 0 }
        totalMap.value = {
            works: 0,
            likes: 0,
            bookmarks: 0
        }
        if (activeTab.value !== 'works') activeTab.value = 'works'
        else resetAndLoadPosts()
        loadProfile()
        loadFollowStats()
        loadTabTotals()
    }
)

onMounted(() => {
    settingsStore.setTitle('个人主页')
    document.title = '个人主页'
    loadProfile()
    loadFollowStats()
    loadTabTotals()
    loadPosts(false)
})
</script>

<style scoped lang="scss">
.client-profile-page {
    --header-height: 60px;
    --sidebar-width: 228px;
    --layout-gap: 18px;
    --content-max-width: 1560px;

    min-height: 100vh;
    background-color: var(--bg-color);
    color: var(--text-main);
    font-family:
        'PingFang SC',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        'Helvetica Neue',
        Arial,
        sans-serif;
}

.page-main {
    padding-top: calc(var(--header-height) + var(--layout-gap));
    padding-bottom: 44px;
    display: flex;
    justify-content: center;
}

.main-inner {
    width: 100%;
    max-width: var(--content-max-width);
    padding: 0 18px;
    display: flex;
    align-items: flex-start;
    gap: var(--layout-gap);
}

.left-sidebar {
    width: var(--sidebar-width);
    flex-shrink: 0;
    background: transparent;
    padding: 0;
    margin-bottom: 0;
    border: 0;
    border-left: 0;
    border-radius: 0;
    line-height: normal;
    font-size: inherit;
    color: inherit;
}

.sidebar-sticky-container {
    position: fixed;
    left: max(18px, calc((100vw - var(--content-max-width)) / 2 + 18px));
    top: calc(var(--header-height) + var(--layout-gap));
    width: var(--sidebar-width);
    max-height: calc(100vh - var(--header-height) - var(--layout-gap) - 24px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
}

.sidebar-nav {
    background: var(--client-surface);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: var(--text-regular);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition:
        background-color var(--app-motion-fast),
        color var(--app-motion-fast);
}

.nav-item:hover {
    background: var(--bg-color);
    color: var(--text-main);
}

.nav-item.active {
    background: var(--client-active-bg);
    color: var(--client-active-text);
    font-weight: 600;
}

.nav-icon {
    font-size: 22px;
}

.sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tips-card {
    background: var(--client-surface);
    border-radius: 12px;
    padding: 20px;
}

.tips-title {
    margin: 0 0 16px 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main);
}

.tips-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tips-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 13px;
    color: var(--text-regular);
    line-height: 1.6;
}

.icon-wrapper {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.icon-wrapper svg {
    font-size: 14px;
    color: var(--text-minor);
}

.content-area {
    flex: 1;
    min-width: 0;
}

button:focus,
button:focus-visible {
    outline: none;
}

button:focus-visible {
    box-shadow: var(--client-focus-ring);
}

.profile-feed {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

@media screen and (max-width: 1024px) {
    .main-inner {
        flex-direction: column;
    }

    .left-sidebar {
        width: 100%;
    }

    .sidebar-sticky-container {
        position: relative;
        left: auto;
        top: 0;
        width: auto;
        max-height: none;
        flex-direction: row;
        align-items: stretch;
        overflow: visible;
    }

    .sidebar-nav {
        flex: 1;
        flex-direction: row;
        justify-content: center;
    }

    .nav-item {
        flex: 1;
        justify-content: center;
        text-align: center;
    }

    .sidebar-footer {
        display: none;
    }
}

@media screen and (max-width: 768px) {
    .client-profile-page {
        --header-height: 54px;
        --layout-gap: 12px;
    }

    .page-main {
        padding-top: calc(var(--header-height) + var(--layout-gap));
        padding-bottom: 28px;
    }

    .main-inner {
        padding: 0 12px;
    }

    .sidebar-nav {
        padding: 8px;
    }

    .nav-item {
        padding: 10px;
        font-size: 15px;
    }

    .profile-feed {
        margin-top: 12px;
        gap: 12px;
    }
}
</style>
