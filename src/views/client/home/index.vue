<template>
    <div ref="discoverPageRef" class="discover-page">
        <ClientHeader v-model:search-value="searchDraft" @brand-click="goDiscover" @search="handleSearch" />

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
                                <h3 class="tips-title">欢迎回来</h3>
                                <ul class="tips-list">
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:briefcase-outline" />
                                        </div>
                                        <span>刷到更懂你的职场干货</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:chart-line" />
                                        </div>
                                        <span>获取最新岗位动态与行业趋势</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:bookmark-outline" />
                                        </div>
                                        <span>查看你收藏和点赞的实用笔记</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:account-group-outline" />
                                        </div>
                                        <span>和同圈层用户高效交流、互助</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>

                <section class="content-area">
                    <div class="tab-panel">
                        <div class="tab-row" role="tablist" aria-label="一级标签">
                            <button type="button" class="tab-item" :class="{ active: activePrimaryId === '' }" @click="handlePrimaryTagChange('')">推荐</button>
                            <button
                                v-for="tag in topLevelTagOptions"
                                :key="tag.id"
                                type="button"
                                class="tab-item"
                                :class="{ active: activePrimaryId === String(tag.id) }"
                                @click="handlePrimaryTagChange(String(tag.id))"
                            >
                                {{ tag.name }}
                            </button>
                        </div>
                    </div>

                    <main v-loading="loading" class="feed-wrap">
                        <div v-if="posts.length" class="masonry-grid" :style="{ '--masonry-columns': String(columnCount) }">
                            <div v-for="(column, colIndex) in masonryColumns" :key="`col-${colIndex}`" class="masonry-column">
                                <ClientPostCard v-for="item in column" :key="getPostKey(item)" :post="item" @click="openPost" />
                            </div>
                        </div>

                        <el-empty v-else-if="!loading" :description="emptyDescription" :image-size="108" />

                        <div v-if="posts.length" class="load-more">
                            <div ref="loadMoreTriggerRef" class="load-more-trigger"></div>
                            <span class="load-more-status" :class="{ visible: Boolean(loadMoreStatusText) }">{{ loadMoreStatusText || '占位' }}</span>
                        </div>
                    </main>
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
            :is-author-self="true"
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
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientHome' })
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { addComment, likePost, listPostByApp, listRecommendFeed } from '@/api/content/post'
import { listCommentReplies, listTopComments } from '@/api/content/postComment'
import { getInterestAll } from '@/api/content/interest'
import useSettingsStore from '@/store/modules/settings'
import useUserStore from '@/store/modules/user'
import ClientHeader from '@/views/client/components/ClientHeader.vue'
import ClientPostCard from '@/views/client/components/ClientPostCard.vue'
import PostPreviewModal from '@/views/content/personProfile/components/Modal/PostPreviewModal.vue'
import { POST_TYPE } from '@/utils/enum'
import { buildTextCoverDataUrl } from '@/utils/textCover'
import {
    getCommentId,
    getCommentReplyCount as resolveCommentReplyCount,
    getCommentUserId,
    normalizeCommentList,
    parseMediaRaw,
    resolveMediaUrl as resolveCommonMediaUrl
} from '@/utils/content/common'

const router = useRouter()
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const posts = ref<any[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const previewVisible = ref(false)
const previewPost = ref<any | null>(null)
const previewModalRef = ref<{ focusInput?: () => void } | null>(null)
const commentDraft = ref('')
const isActionInputFocused = ref(false)
const previewCommentsLoading = ref(false)
const replyStateMap = ref<Record<string, any>>({})
const replyTarget = ref<{ parent: Record<string, any>; replyTo: Record<string, any> } | null>(null)
const discoverPageRef = ref<HTMLElement | null>(null)
const searchDraft = ref('')
const activeSearchKeyword = ref('')

const getInitialColumnCount = () => {
    if (typeof window === 'undefined') return 5
    const width = window.innerWidth
    if (width <= 768) return 2
    if (width <= 1200) return 3
    if (width <= 1440) return 4
    return 5
}

const columnCount = ref(getInitialColumnCount())
const loadMoreTriggerRef = ref<HTMLElement | null>(null)
let loadObserver: IntersectionObserver | null = null
let resizeHandler: (() => void) | null = null
let scrollHandler: (() => void) | null = null
let recommendLoadTimer: ReturnType<typeof setTimeout> | null = null
let lastRecommendLoadAt = 0
let lastRecommendEmptyAt = 0
let feedRequestId = 0
let feedAbortController: AbortController | null = null
const CLIENT_HOME_SCROLL_CLASS = 'client-home-scroll-lock'
const RECOMMEND_LOAD_THROTTLE_MS = 900
const RECOMMEND_EMPTY_COOLDOWN_MS = 5000
const LOAD_MORE_SCROLL_THRESHOLD = 220
const query = ref<{ limit: number; lastId?: number; lastCreateTime?: string }>({
    limit: 10,
    lastId: undefined,
    lastCreateTime: undefined
})

const nextFeedRequestId = () => {
    feedRequestId += 1
    return feedRequestId
}

const getActiveFeedRequestId = () => feedRequestId || nextFeedRequestId()
const isLatestFeedRequest = (requestId: number) => requestId === feedRequestId
const isCanceledRequest = (error: any) => error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.message === 'canceled'

const abortFeedRequest = () => {
    feedAbortController?.abort()
    feedAbortController = null
}

const createFeedAbortSignal = () => {
    if (typeof AbortController === 'undefined') return undefined
    feedAbortController = new AbortController()
    return feedAbortController.signal
}

const releaseFeedAbortSignal = (signal?: AbortSignal) => {
    if (!signal || feedAbortController?.signal !== signal) return
    feedAbortController = null
}

const getFeedRequestConfig = (signal?: AbortSignal) => ({
    signal,
    silentError: true,
    skipPending: true
})

const sideNavItems = [
    { key: 'discover', label: '发现', icon: 'mdi:compass-outline' },
    { key: 'publish', label: '发布', icon: 'mdi:plus-box-outline' },
    { key: 'profile', label: '主页', icon: 'mdi:account-circle-outline' }
]
const primaryTagOptions = ref<any[]>([])
const activeSideKey = ref('discover')
const topLevelTagOptions = computed(() => primaryTagOptions.value.filter((item: any) => item?.id !== undefined && item?.id !== null && item?.name))
const activePrimaryId = ref('')
const normalizedSearchKeyword = computed(() => activeSearchKeyword.value.trim())
const isSearchMode = computed(() => Boolean(normalizedSearchKeyword.value))
const isRecommendMode = computed(() => !activePrimaryId.value && !isSearchMode.value)

const loadMoreStatusText = computed(() => {
    if (loadingMore.value) return '正在加载更多...'
    if (finished.value) return '已全部加载'
    return ''
})
const emptyDescription = computed(() => (isSearchMode.value ? '没有找到相关内容' : '当前分类暂无内容'))

const activePrimaryTag = computed(() => topLevelTagOptions.value.find((item: any) => String(item.id) === activePrimaryId.value) || null)
const activeRequestTagIds = computed(() => {
    if (!activePrimaryId.value) return isSearchMode.value ? [null] : ([] as Array<string | number | null>)
    const childIds = (activePrimaryTag.value?.children || [])
        .filter((item: any) => item?.id !== undefined && item?.id !== null && item?.name)
        .map((item: any) => item.id)
    return childIds.length ? childIds : [activePrimaryId.value]
})

type TagFeedCursor = {
    lastId?: number
    lastCreateTime?: string
    finished: boolean
    buffer: any[]
}

const tagFeedCursorMap = ref<Record<string, TagFeedCursor>>({})

watch(
    topLevelTagOptions,
    groups => {
        const hasActivePrimary = groups.some((item: any) => String(item.id) === activePrimaryId.value)
        if (!hasActivePrimary) activePrimaryId.value = ''
    },
    { immediate: true }
)

const resolveMediaUrl = (url?: string) => resolveCommonMediaUrl(String(url || ''))
const getPostKey = (item: any) => item?.id ?? item?.postId ?? `${item?.createTime || ''}-${item?.content || ''}`
const getType = (item: any) => String(item?.postType ?? '')
const isTextPost = (item: any) => getType(item) === POST_TYPE.TEXT
const isVideoPost = (item: any) => getType(item) === POST_TYPE.VIDEO
const isVideoUrl = (url: string) => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url || '')
const getContent = (item: any) => String(item?.content || '').trim() || '分享了一条内容'
const getNick = (item: any) => String(item?.nickName || item?.userName || '用户')

const getTextCover = (item: any) => {
    const content = getContent(item)
    const seed = String(item?.id ?? item?.postId ?? content)
    return buildTextCoverDataUrl(content, seed)
}

const getTextCoverStyle = (item: any) => ({
    backgroundImage: `url(${getTextCover(item)})`
})

const previewMediaList = computed(() => {
    const post = previewPost.value
    if (!post) return []
    if (isTextPost(post)) return [getTextCover(post)]
    const list = parseMediaRaw(post?.mediaUrls || post?.files || [])
        .map((media: any) => (typeof media === 'object' ? media?.url || media?.cover || media?.thumbnail || media?.poster : media))
        .map((url: string) => resolveMediaUrl(url))
        .filter(Boolean)
    if (isVideoPost(post)) {
        const videoList = list.filter((url: string) => isVideoUrl(url))
        return videoList.length ? videoList : []
    }
    const direct = getCover(post)
    return list.length ? list : direct ? [direct] : []
})

const previewTags = computed(() => {
    const post = previewPost.value
    if (!post) return []
    if (Array.isArray(post.tags)) {
        return post.tags.map((tag: any) => tag?.tagName ?? tag?.name ?? tag?.label).filter(Boolean)
    }
    if (typeof post.tagStr === 'string') {
        return post.tagStr
            .split(',')
            .map((item: string) => item.trim())
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
const isPreviewLiked = computed(() => Boolean(previewPost.value?.isLiked ?? previewPost.value?.like))
const commentPlaceholder = computed(() => {
    const target = replyTarget.value?.replyTo
    const name = target?.nickName || target?.userName || target?.username || target?.authorName || target?.user?.nickName || target?.user?.name
    return name ? `回复 ${name}...` : '说点什么...'
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

const getPreviewPostId = (post: any) => post?.postId ?? post?.id ?? null
const getPreviewTargetUserId = (post: any) =>
    post?.targetUserId ?? post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? null

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
        console.error(error)
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
        console.error(error)
        state.noMore = true
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

const comparePostOrder = (a: any, b: any) => {
    const timeA = new Date(String(a?.createTime ?? a?.createDate ?? 0)).getTime() || 0
    const timeB = new Date(String(b?.createTime ?? b?.createDate ?? 0)).getTime() || 0
    if (timeA !== timeB) return timeB - timeA
    const idA = Number(a?.id ?? a?.postId ?? 0) || 0
    const idB = Number(b?.id ?? b?.postId ?? 0) || 0
    return idB - idA
}

const resetTagFeedCursors = () => {
    Object.values(tagFeedCursorMap.value).forEach(cursor => {
        cursor.buffer = []
    })
    tagFeedCursorMap.value = {}
}

const ensureTagFeedCursor = (tagId: string | number | null) => {
    const key = tagId === null ? '__search__' : String(tagId)
    if (!tagFeedCursorMap.value[key]) {
        tagFeedCursorMap.value[key] = {
            lastId: undefined,
            lastCreateTime: undefined,
            finished: false,
            buffer: []
        }
    }
    return tagFeedCursorMap.value[key]
}

const takeFromTagBuffers = (count: number, seen: Set<string>) => {
    const candidates = Object.entries(tagFeedCursorMap.value)
        .flatMap(([tagId, cursor]) => cursor.buffer.map((item: any) => ({ tagId, item })))
        .sort((a, b) => comparePostOrder(a.item, b.item))
    const next: any[] = []

    for (const candidate of candidates) {
        if (next.length >= count) break
        const key = String(getPostKey(candidate.item))
        if (!key || seen.has(key)) continue
        seen.add(key)
        next.push(candidate.item)
        const cursor = tagFeedCursorMap.value[candidate.tagId]
        if (cursor) {
            const idx = cursor.buffer.findIndex(bufferItem => String(getPostKey(bufferItem)) === key)
            if (idx >= 0) cursor.buffer.splice(idx, 1)
        }
    }

    return next
}

const fetchTagFeedBatch = async (tagId: string | number | null, requestId: number, keyword = '', signal?: AbortSignal) => {
    if (!isLatestFeedRequest(requestId)) return
    const cursor = ensureTagFeedCursor(tagId)
    if (cursor.finished) return
    const limit = query.value.limit
    const params: Record<string, any> = {
        isQuestion: 0,
        isCircle: 0,
        limit,
        lastId: cursor.lastId,
        lastCreateTime: cursor.lastCreateTime
    }
    if (tagId !== null) params.tagId = tagId
    if (keyword) params.content = keyword
    const res = await listPostByApp(params, getFeedRequestConfig(signal))
    if (!isLatestFeedRequest(requestId)) return
    const list = (res as any)?.rows || (res as any)?.data || res || []
    const rows = Array.isArray(list) ? list : []
    cursor.buffer.push(...rows)
    const last = rows[rows.length - 1]
    cursor.lastId = Number(last?.id ?? last?.postId ?? 0) || undefined
    cursor.lastCreateTime = String(last?.createTime ?? last?.createDate ?? '') || undefined
    cursor.finished = rows.length < limit
}

const fetchPrimaryTagFeed = async (isLoadMore: boolean, requestId: number, keyword = '', signal?: AbortSignal) => {
    if (!isLatestFeedRequest(requestId)) return
    const tagIds = activeRequestTagIds.value
    if (!tagIds.length) {
        if (!isLatestFeedRequest(requestId)) return
        posts.value = []
        finished.value = true
        return
    }

    tagIds.forEach((tagId: string | number | null) => ensureTagFeedCursor(tagId))
    const seen = new Set((isLoadMore ? posts.value : []).map(item => String(getPostKey(item))))
    const pendingTagIds = tagIds.filter((tagId: string | number | null) => {
        const cursor = ensureTagFeedCursor(tagId)
        return !cursor.finished && cursor.buffer.length < query.value.limit
    })

    if (pendingTagIds.length) {
        await Promise.all(pendingTagIds.map((tagId: string | number | null) => fetchTagFeedBatch(tagId, requestId, keyword, signal)))
    }

    if (!isLatestFeedRequest(requestId)) return
    const batch = takeFromTagBuffers(query.value.limit, seen)

    posts.value = isLoadMore ? posts.value.concat(batch) : batch
    finished.value = tagIds.every((tagId: string | number | null) => {
        const cursor = ensureTagFeedCursor(tagId)
        return cursor.finished && cursor.buffer.length === 0
    })
}

const estimateCardHeight = (item: any) => {
    const contentLen = Math.min(String(item?.content || '').length, 80)
    const textExtra = Math.ceil(contentLen / 20) * 18
    if (isTextPost(item)) return 360 + textExtra
    if (isVideoPost(item)) return 430 + textExtra
    return 390 + textExtra
}

const masonryColumns = computed(() => {
    const cols = Array.from({ length: Math.max(1, columnCount.value) }, () => [] as any[])
    const heights = Array.from({ length: Math.max(1, columnCount.value) }, () => 0)
    posts.value.forEach(item => {
        let targetIndex = 0
        let minHeight = heights[0]
        for (let i = 1; i < heights.length; i += 1) {
            if (heights[i] < minHeight) {
                minHeight = heights[i]
                targetIndex = i
            }
        }
        cols[targetIndex].push(item)
        heights[targetIndex] += estimateCardHeight(item)
    })
    return cols
})

const resolveColumnCount = () => {
    const width = window.innerWidth
    if (width <= 768) return 2
    if (width <= 1200) return 3
    if (width <= 1440) return 4
    return 5
}

const clearRecommendLoadTimer = () => {
    if (!recommendLoadTimer) return
    clearTimeout(recommendLoadTimer)
    recommendLoadTimer = null
}

const shouldTriggerLoadMoreByScroll = () => {
    const container = discoverPageRef.value
    if (!container || loading.value || loadingMore.value || finished.value) return false
    if (isRecommendMode.value && lastRecommendEmptyAt && Date.now() - lastRecommendEmptyAt < RECOMMEND_EMPTY_COOLDOWN_MS) return false
    return container.scrollTop + container.clientHeight >= container.scrollHeight - LOAD_MORE_SCROLL_THRESHOLD
}

const triggerLoadMore = () => {
    if (finished.value) return
    if (!isRecommendMode.value) {
        fetchList(true)
        return
    }
    if (loading.value || loadingMore.value) return
    if (lastRecommendEmptyAt && Date.now() - lastRecommendEmptyAt < RECOMMEND_EMPTY_COOLDOWN_MS) return

    const elapsed = Date.now() - lastRecommendLoadAt
    if (elapsed >= RECOMMEND_LOAD_THROTTLE_MS) {
        lastRecommendLoadAt = Date.now()
        fetchList(true)
        return
    }

    if (recommendLoadTimer) return
    recommendLoadTimer = setTimeout(() => {
        recommendLoadTimer = null
        if (loading.value || loadingMore.value) return
        lastRecommendLoadAt = Date.now()
        fetchList(true)
    }, RECOMMEND_LOAD_THROTTLE_MS - elapsed)
}

const handleContainerScroll = () => {
    if (!shouldTriggerLoadMoreByScroll()) return
    triggerLoadMore()
}

const bindScrollListener = () => {
    if (scrollHandler || !discoverPageRef.value) return
    scrollHandler = () => {
        handleContainerScroll()
    }
    discoverPageRef.value.addEventListener('scroll', scrollHandler, { passive: true })
}

const unbindScrollListener = () => {
    if (!scrollHandler || !discoverPageRef.value) return
    discoverPageRef.value.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
}

const ensureLoadMoreIfNeeded = async () => {
    await nextTick()
    if (!shouldTriggerLoadMoreByScroll()) return
    triggerLoadMore()
}

const setupLoadObserver = async () => {
    if (loadObserver) {
        loadObserver.disconnect()
        loadObserver = null
    }
    await nextTick()
    const target = loadMoreTriggerRef.value
    if (!target || (!isRecommendMode.value && finished.value)) return
    loadObserver = new IntersectionObserver(
        entries => {
            const entry = entries[0]
            if (!entry?.isIntersecting) return
            triggerLoadMore()
        },
        { root: discoverPageRef.value, rootMargin: '300px 0px 300px 0px', threshold: 0 }
    )
    loadObserver.observe(target)
    ensureLoadMoreIfNeeded()
}

const loadPrimaryTagTabs = async () => {
    try {
        const res = await getInterestAll()
        const list = (res as any)?.data || res || []
        const rows = Array.isArray(list) ? list : []
        primaryTagOptions.value = rows.filter((item: any) => item?.id !== undefined && item?.id !== null && item?.name)
    } catch (error) {
        console.error(error)
        primaryTagOptions.value = []
    }
}

const fetchList = async (isLoadMore: boolean, requestId = getActiveFeedRequestId(), force = false) => {
    if (!isLatestFeedRequest(requestId)) return
    if (finished.value && isLoadMore) return
    if (!force && (loading.value || loadingMore.value)) return
    const keyword = normalizedSearchKeyword.value
    const shouldUseRecommend = !activePrimaryId.value && !keyword
    const signal = createFeedAbortSignal()
    if (isLoadMore) loadingMore.value = true
    else {
        loading.value = true
        loadingMore.value = false
    }

    try {
        if (shouldUseRecommend) {
            await fetchRecommendFeedPage(isLoadMore, requestId, signal)
            return
        }
        await fetchPrimaryTagFeed(isLoadMore, requestId, keyword, signal)
    } catch (error) {
        if (!isCanceledRequest(error) && isLatestFeedRequest(requestId)) console.error(error)
    } finally {
        releaseFeedAbortSignal(signal)
        if (isLatestFeedRequest(requestId)) {
            loading.value = false
            loadingMore.value = false
        }
    }
}

const resetAndFetch = (keepVisible = true) => {
    abortFeedRequest()
    const requestId = nextFeedRequestId()
    if (!keepVisible) posts.value = []
    loadingMore.value = false
    finished.value = false
    query.value.lastId = undefined
    query.value.lastCreateTime = undefined
    clearRecommendLoadTimer()
    lastRecommendLoadAt = 0
    lastRecommendEmptyAt = 0
    resetTagFeedCursors()
    fetchList(false, requestId, true)
}

const handleSearch = (keyword: string) => {
    const nextKeyword = String(keyword || '').trim()
    if (activeSearchKeyword.value === nextKeyword) return
    activeSearchKeyword.value = nextKeyword
    searchDraft.value = nextKeyword
    resetAndFetch(false)
}

const goDiscover = () => {
    searchDraft.value = ''
    activeSearchKeyword.value = ''
    if (activeSideKey.value !== 'discover') {
        handleSideNavClick('discover')
    } else {
        resetAndFetch(false)
    }
}

const handleSideNavClick = (key: string) => {
    if (key === 'discover') {
        activeSideKey.value = key
        searchDraft.value = ''
        activeSearchKeyword.value = ''
        resetAndFetch(true)
        return
    }
    if (key === 'publish') {
        const route = router.resolve('/publish')
        window.open(route.href, '_blank', 'noopener')
        return
    }
    if (key === 'profile') {
        router.push('/profile')
    }
}

const handlePrimaryTagChange = (tagId?: string | number) => {
    const nextPrimaryId = tagId === undefined || tagId === null || tagId === '' ? '' : String(tagId)
    if (activePrimaryId.value === nextPrimaryId) return

    activePrimaryId.value = nextPrimaryId
    resetAndFetch(true)
}

const normalizePostRows = (res: any) => {
    const data = res?.data
    const candidates = [res?.rows, res?.list, res?.records, res?.items, data?.rows, data?.list, data?.records, data?.items, data, res]
    const target = candidates.find(item => Array.isArray(item))
    return Array.isArray(target) ? target : []
}

const fetchRecommendFeedPage = async (isLoadMore: boolean, requestId: number, signal?: AbortSignal) => {
    if (!isLatestFeedRequest(requestId)) return
    const seen = isLoadMore ? new Set(posts.value.map(item => String(getPostKey(item)))) : new Set<string>()
    const next: any[] = []
    const limit = query.value.limit
    let rounds = 0
    let receivedRows = false

    while (next.length < limit && rounds < 3) {
        rounds += 1
        const res = await listRecommendFeed(
            {
                isQuestion: 0,
                isCircle: 0,
                limit,
                lastId: query.value.lastId,
                lastCreateTime: query.value.lastCreateTime
            },
            getFeedRequestConfig(signal)
        )
        if (!isLatestFeedRequest(requestId)) return
        const rows = normalizePostRows(res)
        if (!rows.length) {
            if (isLoadMore || posts.value.length) {
                lastRecommendEmptyAt = Date.now()
            }
            break
        }
        lastRecommendEmptyAt = 0
        receivedRows = true

        const filtered = rows.filter(item => {
            const key = String(getPostKey(item))
            if (!key || seen.has(key)) return false
            seen.add(key)
            return true
        })
        next.push(...filtered)

        const last = rows[rows.length - 1]
        query.value.lastId = Number(last?.id ?? last?.postId ?? 0) || undefined
        query.value.lastCreateTime = String(last?.createTime ?? last?.createDate ?? '') || undefined
    }

    if (!isLatestFeedRequest(requestId)) return
    const pageRows = next.slice(0, limit)
    posts.value = isLoadMore ? posts.value.concat(pageRows) : pageRows
    finished.value = !isLoadMore && !receivedRows && pageRows.length === 0
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
            console.error(error)
        })
}

const handlePreviewAction = async (type: 'like' | 'collect' | 'share') => {
    const post = previewPost.value
    if (!post) return
    if (type !== 'like') return
    const postId = post?.postId ?? post?.id
    const targetUserId = post?.userId ?? post?.authorId
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
        console.error(error)
        post.isLiked = wasLiked
        post.like = wasLiked
        post.likeCount = oldCount
    }
}

onMounted(() => {
    columnCount.value = resolveColumnCount()
    resizeHandler = () => {
        const next = resolveColumnCount()
        if (next !== columnCount.value) columnCount.value = next
    }
    settingsStore.setTitle('职场吧')
    document.title = '职场吧'
    document.documentElement.classList.add(CLIENT_HOME_SCROLL_CLASS)
    document.body.classList.add(CLIENT_HOME_SCROLL_CLASS)
    window.addEventListener('resize', resizeHandler)
    bindScrollListener()
    loadPrimaryTagTabs()
    resetAndFetch(false)
})

watch(
    () => [posts.value.length, finished.value] as const,
    async () => {
        await setupLoadObserver()
    }
)

onBeforeUnmount(() => {
    nextFeedRequestId()
    abortFeedRequest()
    closePreview()
    posts.value = []
    primaryTagOptions.value = []
    resetTagFeedCursors()
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
        resizeHandler = null
    }
    unbindScrollListener()
    clearRecommendLoadTimer()
    if (loadObserver) {
        loadObserver.disconnect()
        loadObserver = null
    }
    document.documentElement.classList.remove(CLIENT_HOME_SCROLL_CLASS)
    document.body.classList.remove(CLIENT_HOME_SCROLL_CLASS)
})
</script>

<style lang="scss">
.discover-page {
    --header-height: 60px;
    --sidebar-width: 228px;
    --layout-gap: 18px;
    --content-max-width: 1560px;

    height: 100svh;
    background-color: var(--bg-color);
    font-family:
        'PingFang SC',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        'Helvetica Neue',
        Arial,
        sans-serif;
    color: var(--text-main);
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.discover-page::-webkit-scrollbar {
    width: 0;
    height: 0;
}

:global(html.client-home-scroll-lock),
:global(body.client-home-scroll-lock) {
    overflow: hidden;
}
</style>

<style scoped lang="scss">
.page-main {
    padding-top: calc(var(--header-height) + var(--layout-gap));
    padding-bottom: 40px;
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
    padding-top: 62px;
}

.tab-panel {
    position: fixed;
    top: var(--header-height);
    left: calc(max(18px, calc((100vw - var(--content-max-width)) / 2 + 18px)) + var(--sidebar-width) + var(--layout-gap));
    right: max(18px, calc((100vw - var(--content-max-width)) / 2 + 18px));
    z-index: 20;
    background: color-mix(in srgb, var(--client-surface) 94%, transparent);
    border-radius: 0;
    padding: 0;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.tab-row {
    display: flex;
    align-items: center;
    gap: 28px;
    overflow-x: auto;
    padding: 16px 0 14px;
    border-bottom: 1px solid var(--client-border-soft);
    scrollbar-width: none;
}

.tab-row::-webkit-scrollbar {
    display: none;
}

.tab-item {
    position: relative;
    flex: 0 0 auto;
    border: 0;
    background: transparent;
    border-radius: 0;
    padding: 4px 0;
    color: var(--text-regular);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s ease;
}

.tab-item::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -6px;
    height: 3px;
    border-radius: 999px;
    background: var(--primary-color);
    opacity: 0;
    transform: scaleX(0.5);
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.tab-item:hover {
    color: var(--text-main);
}

.tab-item.active {
    color: var(--primary-color);
    font-weight: 700;
}

.tab-item.active::after {
    opacity: 1;
    transform: scaleX(1);
}

button:focus,
button:focus-visible {
    outline: none;
    box-shadow: none;
}

.feed-wrap {
    flex: 1;
    min-height: 240px;
    scroll-margin-top: calc(var(--header-height) + 58px);
}

.masonry-grid {
    --masonry-columns: 5;
    display: grid;
    grid-template-columns: repeat(var(--masonry-columns), minmax(0, 1fr));
    column-gap: 16px;
}

.masonry-column {
    display: flex;
    flex-direction: column;
    row-gap: 16px;
}

.post-card {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    background: var(--client-surface);
    cursor: pointer;
    box-shadow: var(--client-shadow-soft);
    transition:
        border-color var(--app-motion-normal),
        box-shadow var(--app-motion-normal),
        background-color var(--app-motion-normal);
}

.post-card:hover {
    border-color: var(--app-hover-border-soft);
    box-shadow: var(--app-hover-shadow-card);
    background: var(--client-card-hover);
}

.cover-wrap {
    position: relative;
    aspect-ratio: 3 / 4;
    background: var(--client-fill);
    overflow: hidden;
    border-bottom: 1px solid var(--client-border-soft);
}

.cover-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--client-media-mask);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--app-motion-normal);
}

.post-card:hover .cover-wrap::after {
    opacity: 1;
}

.cover-image {
    width: 100%;
    height: 100%;
    display: block;
    min-height: 0;
    max-height: none;
}

.cover-image :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cover-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--client-empty-text);
    background: var(--client-empty-gradient);
}

.text-cover {
    width: 100%;
    height: 100%;
    padding: 18px;
    display: flex;
    align-items: center;
    background-size: cover;
    background-position: center;
}

.text-cover span {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.6;
    color: var(--client-on-overlay);
    text-shadow: var(--client-text-shadow);
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.video-badge {
    position: absolute;
    right: 8px;
    top: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: var(--client-on-overlay);
    background: var(--client-overlay);
}

.card-content {
    padding: 16px;
    background: var(--client-surface);
}

.content-text {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    color: var(--text-main);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.user-row {
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.user-core {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.user-core .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--text-regular);
    max-width: 120px;
}

.meta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--text-minor);
}

.load-more {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 12px 0 18px;
    color: var(--text-minor);
    font-size: 13px;
}

.load-more-status {
    min-height: 18px;
    line-height: 18px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.18s ease;
}

.load-more-status.visible {
    opacity: 1;
    visibility: visible;
}

.load-more-trigger {
    width: 1px;
    height: 1px;
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

    .content-area {
        padding-top: 62px;
    }

    .tab-panel {
        left: 18px;
        right: 18px;
    }
}

@media screen and (max-width: 768px) {
    .discover-page {
        --layout-gap: 12px;
        --header-height: 54px;
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

    .tab-panel {
        left: 12px;
        right: 12px;
        padding: 0;
    }

    .masonry-grid {
        column-gap: 14px;
    }

    .masonry-column {
        row-gap: 14px;
    }
}
</style>
