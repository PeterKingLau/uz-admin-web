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
                                <h3 class="tips-title">专属你的职业成长道路</h3>
                                <ul class="tips-list">
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:briefcase-outline" />
                                        </div>
                                        <span>多维测评勾勒个人职业画像</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:map-search-outline" />
                                        </div>
                                        <span>情景化探索适合你的发展方向</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:lightbulb-on-outline" />
                                        </div>
                                        <span>获得科学且有趣的成长建议</span>
                                    </li>
                                    <li>
                                        <div class="icon-wrapper">
                                            <Icon icon="mdi:school-outline" />
                                        </div>
                                        <span>为大学生职业探索提供支持</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>

                <section class="content-area">
                    <div class="tab-panel">
                        <div class="tab-row primary-tabs" role="tablist" aria-label="一级标签">
                            <button
                                type="button"
                                class="tab-item"
                                :class="{ active: activePrimaryId === '', pending: isPrimaryTabPending('') }"
                                @click="handlePrimaryTagChange('')"
                            >
                                <span>推荐</span>
                            </button>
                            <button
                                v-for="tag in topLevelTagOptions"
                                :key="tag.id"
                                type="button"
                                class="tab-item"
                                :class="{ active: activePrimaryId === String(tag.id), pending: isPrimaryTabPending(String(tag.id)) }"
                                @click="handlePrimaryTagChange(String(tag.id))"
                            >
                                <span>{{ tag.name }}</span>
                            </button>
                        </div>
                    </div>

                    <main v-loading="loading && !isPrimarySwitching" class="feed-wrap" :class="{ 'is-refreshing': isPrimarySwitching }">
                        <div v-if="isPrimarySwitching" class="feed-refresh-indicator" aria-label="正在刷新分类">
                            <span class="refresh-card-frame"></span>
                            <span class="refresh-card-frame"></span>
                            <span class="refresh-card-frame"></span>
                        </div>
                        <Waterfall
                            v-if="hasFeedContent"
                            ref="waterfallRef"
                            class="masonry-grid"
                            :list="waterfallItems"
                            row-key="__waterfallKey"
                            img-selector="__coverUrl"
                            :width="260"
                            :breakpoints="waterfallBreakpoints"
                            :gutter="20"
                            :space="20"
                            :has-around-gutter="false"
                            :delay="150"
                            align="left"
                            background-color="transparent"
                            :lazyload="false"
                            :animation-cancel="true"
                        >
                            <template #default="{ item }">
                                <ClientPostCard
                                    class="masonry-item"
                                    :post="item"
                                    @click="openPost"
                                    @media-load="handleCardMediaLoad"
                                />
                            </template>
                        </Waterfall>

                        <el-empty v-else-if="!loading" :description="emptyDescription" :image-size="108" />

                        <div v-if="renderedPosts.length || loadingMore || finished" class="load-more">
                            <div ref="loadMoreTriggerRef" class="load-more-trigger"></div>
                            <div v-if="loadingMore" class="load-more-loading" role="status" aria-live="polite">
                                <span class="load-more-spinner"></span>
                                <span>正在发现更多...</span>
                            </div>
                            <div v-else-if="finished" class="load-more-finished">没有更多内容了</div>
                        </div>
                    </main>
                </section>
            </div>
        </main>

        <div v-if="showFeedActions" class="feed-floating-actions" aria-label="瀑布流快捷操作">
            <button type="button" class="feed-floating-action" :disabled="isFeedAtTop" aria-label="滑至顶部" @click="scrollToFeedTop">
                <Icon icon="mdi:arrow-up" />
            </button>
            <button
                type="button"
                class="feed-floating-action"
                :class="{ spinning: isPrimarySwitching }"
                :disabled="isFeedRefreshing"
                aria-label="刷新当前标签内容"
                @click="refreshActiveFeed"
            >
                <Icon icon="mdi:refresh" />
            </button>
        </div>

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
            :repost-loading="repostActionLoading"
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
            @view-comment-profile="handleViewCommentProfile"
            @follow="noop"
        />
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ViewsClientHome' })
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import { debounce } from 'lodash-es'
import { Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'
import { addComment, likePost, listPostByApp, listRecommendFeed, repostPost } from '@/api/content/post'
import { listCommentReplies, listTopComments } from '@/api/content/postComment'
import { getInterestAll } from '@/api/content/interest'
import useSettingsStore from '@/store/modules/settings'
import useUserStore from '@/store/modules/user'
import ClientHeader from '@/views/client/components/ClientHeader.vue'
import ClientPostCard from '@/views/client/components/ClientPostCard.vue'
import PostPreviewModal from '@/views/content/personProfile/components/Modal/PostPreviewModal.vue'
import { POST_TYPE } from '@/utils/enum'
import { encodeRouteId } from '@/router/routeParams'
import { getClientUserProfileRoute } from '@/utils/routeAccess'
import { buildTextCoverDataUrl } from '@/utils/textCover'
import { openVideoPlayerPreview } from '@/utils/content/videoPlayer'
import {
    getCommentId,
    getCommentReplyCount as resolveCommentReplyCount,
    getCommentUserId,
    createMediaViewerPayloadPost,
    normalizeCommentList,
    parseMediaRaw,
    resolveMediaUrl as resolveCommonMediaUrl,
    stripHtmlToText
} from '@/utils/content/common'

const router = useRouter()
const route = useRoute()
const { proxy } = getCurrentInstance() || {}
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const posts = ref<any[]>([])
const renderedPosts = ref<any[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const previewVisible = ref(false)
const previewPost = ref<any | null>(null)
const previewModalRef = ref<{ focusInput?: () => void } | null>(null)
const commentDraft = ref('')
const isActionInputFocused = ref(false)
const previewCommentsLoading = ref(false)
const repostActionLoading = ref(false)
const replyStateMap = ref<Record<string, any>>({})
const replyTarget = ref<{ parent: Record<string, any>; replyTo: Record<string, any> } | null>(null)
const discoverPageRef = ref<HTMLElement | null>(null)
const searchDraft = ref('')
const activeSearchKeyword = ref('')
const isFeedAtTop = ref(true)

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
const waterfallRef = ref<{ renderer?: () => void } | null>(null)
let stopLoadObserver: (() => void) | null = null
let resizeHandler: (() => void) | null = null
let scrollHandler: (() => void) | null = null
let isDestroyed = false
let recommendLoadTimer: ReturnType<typeof setTimeout> | null = null
let recommendEmptyRetryTimer: ReturnType<typeof setTimeout> | null = null
let primarySwitchTimer: ReturnType<typeof setTimeout> | null = null
let loadMoreTimer: ReturnType<typeof setTimeout> | null = null
let postRenderTimer: ReturnType<typeof setTimeout> | null = null
let postRenderFrame: number | null = null
let lastRecommendLoadAt = 0
let lastRecommendEmptyAt = 0
let lastLoadMoreAt = 0
let lastKnownScrollTop = 0
let feedRequestId = 0
let feedAbortController: AbortController | null = null
const CLIENT_HOME_SCROLL_CLASS = 'client-home-scroll-lock'
const CLIENT_MEDIA_VIEWER_CACHE_KEY = 'client-media-viewer-payload'
const CLIENT_PRIMARY_TAG_CACHE_KEY = 'client-home:primary-tag-options:v1'
const RECOMMEND_LOAD_THROTTLE_MS = 900
const RECOMMEND_EMPTY_COOLDOWN_MS = 5000
const PRIMARY_SWITCH_DEBOUNCE_MS = 120
const LOAD_MORE_THROTTLE_MS = 500
const TAG_LOAD_MORE_REQUEST_LIMIT = 2
const TAG_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const TAG_CACHE_REFRESH_COOLDOWN_MS = 30000
const LOAD_MORE_SCROLL_THRESHOLD = 220
const POST_RENDER_FRAME_DELAY_MS = 54
const WATERFALL_RENDER_DEBOUNCE_MS = 150
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

const waitForNextFrame = () =>
    new Promise<void>(resolve => {
        if (typeof window === 'undefined') {
            resolve()
            return
        }
        window.requestAnimationFrame(() => resolve())
    })

// 图片会在同一批渲染中集中触发 load，这里把多次 renderer 合并为最后一次执行，
// 避免 vue-waterfall-plugin-next 反复计算布局造成连续 Reflow。
const debouncedRenderer = debounce(
    () => {
        if (isDestroyed) return
        void nextTick(() => {
            if (isDestroyed) return
            waterfallRef.value?.renderer?.()
        })
    },
    WATERFALL_RENDER_DEBOUNCE_MS,
    { leading: false, trailing: true }
)

const sideNavItems = [
    { key: 'discover', label: '发现', icon: 'mdi:compass-outline' },
    { key: 'publish', label: '发布', icon: 'mdi:plus-box-outline' },
    { key: 'profile', label: '主页', icon: 'mdi:account-circle-outline' }
]
const primaryTagOptions = ref<any[]>([])
const activeSideKey = ref('discover')
const topLevelTagOptions = computed(() => primaryTagOptions.value.filter((item: any) => item?.id !== undefined && item?.id !== null && item?.name))
const activePrimaryId = ref('')
const pendingPrimaryId = ref<string | null>(null)
const isPrimarySwitching = computed(() => pendingPrimaryId.value !== null)
const normalizedSearchKeyword = computed(() => activeSearchKeyword.value.trim())
const isSearchMode = computed(() => Boolean(normalizedSearchKeyword.value))
const isRecommendMode = computed(() => !activePrimaryId.value && !isSearchMode.value)

const emptyDescription = computed(() => (isSearchMode.value ? '没有找到相关内容' : '当前分类暂无内容'))

const getPrimaryTagById = (primaryId: string) => topLevelTagOptions.value.find((item: any) => String(item.id) === primaryId) || null
const getRequestTagIdsByPrimaryId = (primaryId: string, keyword = normalizedSearchKeyword.value) => {
    if (!primaryId) return keyword ? [null] : ([] as Array<string | number | null>)
    const primary = getPrimaryTagById(primaryId)
    const childIds = (primary?.children || []).filter((item: any) => item?.id !== undefined && item?.id !== null && item?.name).map((item: any) => item.id)
    return childIds.length ? childIds : [primaryId]
}
const activeRequestTagIds = computed(() => getRequestTagIdsByPrimaryId(activePrimaryId.value))
const isPrimaryTabPending = (primaryId: string) => pendingPrimaryId.value === primaryId
const isFeedRefreshing = computed(() => isPrimarySwitching.value || loading.value || loadingMore.value)

type TagFeedCursor = {
    lastId?: number
    lastCreateTime?: string
    finished: boolean
    buffer: any[]
}

const tagFeedCursorMap = ref<Record<string, TagFeedCursor>>({})
let tagFeedQueueIndex = 0
let primaryTagRefreshPromise: Promise<any[]> | null = null
let lastPrimaryTagRefreshAt = 0

watch(
    topLevelTagOptions,
    groups => {
        const hasActivePrimary = groups.some((item: any) => String(item.id) === activePrimaryId.value)
        if (!hasActivePrimary) activePrimaryId.value = ''
        if (pendingPrimaryId.value && !groups.some((item: any) => String(item.id) === pendingPrimaryId.value)) {
            pendingPrimaryId.value = null
        }
    },
    { immediate: true }
)

const resolveMediaUrl = (url?: string) => resolveCommonMediaUrl(String(url || ''))
const getPostKey = (item: any) => item?.id ?? item?.postId ?? `${item?.createTime || ''}-${item?.content || ''}`
const getType = (item: any) => String(item?.postType ?? '')
const isTextPost = (item: any) => getType(item) === POST_TYPE.TEXT
const isVideoPost = (item: any) => getType(item) === POST_TYPE.VIDEO
const isH5Viewport = computed(() => columnCount.value <= 2)
const isVideoUrl = (url: string) => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url || '')
const getContent = (item: any) => stripHtmlToText(item?.content) || '分享了一条内容'
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

const getPostMediaUrls = (item: any) =>
    parseMediaRaw(item?.mediaUrls || item?.files || [])
        .map((media: any) => (typeof media === 'object' ? media?.url || media?.cover || media?.thumbnail || media?.poster : media))
        .map((url: string) => resolveMediaUrl(url))
        .filter(Boolean)

const getPostImageUrls = (item: any) => {
    if (isTextPost(item)) return [getTextCover(item)]
    const urls = getPostMediaUrls(item).filter((url: string) => !isVideoUrl(url))
    const cover = getCover(item)
    return urls.length ? urls : cover ? [cover] : []
}

const getVideoUrl = (item: any) => getPostMediaUrls(item).find((url: string) => isVideoUrl(url)) || ''

const normalizePostFlags = (item: any) => {
    const normalized = { ...item }
    const liked = Boolean(normalized.isLiked ?? normalized.like)
    normalized.isLiked = liked
    normalized.like = liked
    return normalized
}

const sessionCache = {
    setJSON(key: string, value: unknown) {
        sessionStorage.setItem(key, JSON.stringify(value))
    }
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
    tagFeedQueueIndex = 0
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

const fetchPrimaryTagFeed = async (
    isLoadMore: boolean,
    requestId: number,
    keyword = '',
    signal?: AbortSignal,
    requestTagIds: Array<string | number | null> = activeRequestTagIds.value,
    maxTagRequests = requestTagIds.length,
    commit = true
) => {
    if (!isLatestFeedRequest(requestId)) return
    const tagIds = requestTagIds
    const limit = query.value.limit
    if (!tagIds.length) {
        if (!isLatestFeedRequest(requestId)) return
        if (commit) {
            posts.value = []
            finished.value = true
        }
        return { batch: [] as any[], finished: true }
    }

    tagIds.forEach((tagId: string | number | null) => ensureTagFeedCursor(tagId))
    const seen = new Set((isLoadMore ? posts.value : []).map(item => String(getPostKey(item))))
    let batch = takeFromTagBuffers(limit, seen)
    let checkedTagCount = 0
    const maxCheckedTagCount = Math.min(Math.max(1, maxTagRequests), tagIds.length)

    while (batch.length < limit && checkedTagCount < maxCheckedTagCount) {
        const tagId = tagIds[tagFeedQueueIndex % tagIds.length]
        tagFeedQueueIndex = (tagFeedQueueIndex + 1) % tagIds.length
        checkedTagCount += 1

        const cursor = ensureTagFeedCursor(tagId)
        if (cursor.finished) continue

        await fetchTagFeedBatch(tagId, requestId, keyword, signal)
        if (!isLatestFeedRequest(requestId)) return
        batch = batch.concat(takeFromTagBuffers(limit - batch.length, seen))
    }

    if (!isLatestFeedRequest(requestId)) return
    const nextFinished = tagIds.every((tagId: string | number | null) => {
        const cursor = ensureTagFeedCursor(tagId)
        return cursor.finished && cursor.buffer.length === 0
    })
    if (commit) {
        if (!isLoadMore) {
            posts.value = batch
        } else if (batch.length) {
            posts.value = posts.value.concat(batch)
        }
        finished.value = nextFinished
    }
    return { batch, finished: nextFinished }
}

const hasFeedContent = computed(() => Boolean(renderedPosts.value.length))
const showFeedActions = computed(() => Boolean(hasFeedContent.value || renderedPosts.value.length || posts.value.length))
const waterfallBreakpoints = {
    1440: { rowPerView: 4 },
    1200: { rowPerView: 3 },
    768: { rowPerView: 2 }
}
const waterfallItems = computed(() => {
    return renderedPosts.value.map(item => ({
        ...item,
        __waterfallKey: String(getPostKey(item)),
        __coverUrl: getCover(item)
    }))
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

const clearRecommendEmptyRetryTimer = () => {
    if (!recommendEmptyRetryTimer) return
    clearTimeout(recommendEmptyRetryTimer)
    recommendEmptyRetryTimer = null
}

const clearPrimarySwitchTimer = () => {
    if (!primarySwitchTimer) return
    clearTimeout(primarySwitchTimer)
    primarySwitchTimer = null
}

const clearLoadMoreTimer = () => {
    if (!loadMoreTimer) return
    clearTimeout(loadMoreTimer)
    loadMoreTimer = null
}

const clearPostRenderSchedule = () => {
    if (postRenderTimer) {
        clearTimeout(postRenderTimer)
        postRenderTimer = null
    }
    if (postRenderFrame !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(postRenderFrame)
        postRenderFrame = null
    }
}

const getPostRenderBatchSize = () => {
    if (columnCount.value <= 2) return 4
    if (columnCount.value <= 3) return 6
    return 8
}

const isRenderedPostsPrefix = (nextPosts: any[]) => {
    if (!renderedPosts.value.length) return true
    if (renderedPosts.value.length > nextPosts.length) return false
    return renderedPosts.value.every((item, index) => String(getPostKey(item)) === String(getPostKey(nextPosts[index])))
}

const renderNextPostBatch = () => {
    postRenderFrame = null
    if (isDestroyed) return
    const targetPosts = posts.value
    if (!targetPosts.length) {
        renderedPosts.value = []
        return
    }

    const nextLength = Math.min(targetPosts.length, renderedPosts.value.length + getPostRenderBatchSize())
    renderedPosts.value = targetPosts.slice(0, nextLength)

    if (nextLength >= targetPosts.length) return
    postRenderTimer = setTimeout(() => {
        postRenderTimer = null
        if (typeof window === 'undefined') {
            renderNextPostBatch()
            return
        }
        postRenderFrame = window.requestAnimationFrame(renderNextPostBatch)
    }, POST_RENDER_FRAME_DELAY_MS)
}

const schedulePostRendering = (nextPosts: any[]) => {
    clearPostRenderSchedule()
    if (!nextPosts.length) {
        renderedPosts.value = []
        return
    }
    if (!isRenderedPostsPrefix(nextPosts)) {
        renderedPosts.value = []
    }
    if (typeof window === 'undefined') {
        renderedPosts.value = nextPosts
        return
    }
    postRenderFrame = window.requestAnimationFrame(renderNextPostBatch)
}

const handleCardMediaLoad = () => {
    debouncedRenderer()
}

const resetRecommendCursor = () => {
    query.value.lastId = undefined
    query.value.lastCreateTime = undefined
}

const getRecommendEmptyCooldownRemaining = () => {
    if (!lastRecommendEmptyAt) return 0
    return Math.max(0, RECOMMEND_EMPTY_COOLDOWN_MS - (Date.now() - lastRecommendEmptyAt))
}

const scheduleRecommendEmptyRetry = (requestId: number) => {
    clearRecommendEmptyRetryTimer()
    const remaining = getRecommendEmptyCooldownRemaining()
    if (!remaining) return
    recommendEmptyRetryTimer = setTimeout(() => {
        recommendEmptyRetryTimer = null
        if (!isLatestFeedRequest(requestId) || !isRecommendMode.value || loading.value || loadingMore.value || finished.value) return
        ensureLoadMoreIfNeeded()
    }, remaining + 40)
}

const shouldTriggerLoadMoreByScroll = () => {
    const container = discoverPageRef.value
    if (!container || loading.value || loadingMore.value || finished.value) return false
    if (isRecommendMode.value && getRecommendEmptyCooldownRemaining() > 0) return false
    return container.scrollTop + container.clientHeight >= container.scrollHeight - LOAD_MORE_SCROLL_THRESHOLD
}

const runLoadMore = () => {
    if (finished.value || loading.value || loadingMore.value) return
    if (!isRecommendMode.value) {
        fetchList(true)
        return
    }
    if (getRecommendEmptyCooldownRemaining() > 0) {
        scheduleRecommendEmptyRetry(getActiveFeedRequestId())
        return
    }

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

const triggerLoadMore = () => {
    if (finished.value || loading.value || loadingMore.value || isPrimarySwitching.value) return

    const elapsed = Date.now() - lastLoadMoreAt
    if (elapsed >= LOAD_MORE_THROTTLE_MS) {
        lastLoadMoreAt = Date.now()
        runLoadMore()
        return
    }

    if (loadMoreTimer) return
    loadMoreTimer = setTimeout(() => {
        loadMoreTimer = null
        if (finished.value || loading.value || loadingMore.value || isPrimarySwitching.value) return
        lastLoadMoreAt = Date.now()
        runLoadMore()
    }, LOAD_MORE_THROTTLE_MS - elapsed)
}

const handleContainerScroll = () => {
    const container = discoverPageRef.value
    if (!container) return
    const nextScrollTop = container.scrollTop
    isFeedAtTop.value = nextScrollTop <= 8
    const isScrollingDown = nextScrollTop > lastKnownScrollTop
    lastKnownScrollTop = nextScrollTop
    if (!isScrollingDown) return
    if (!shouldTriggerLoadMoreByScroll()) return
    triggerLoadMore()
}

const scrollToFeedTop = () => {
    const container = discoverPageRef.value
    if (!container) return
    container.scrollTo({ top: 0, behavior: 'smooth' })
    lastKnownScrollTop = 0
    isFeedAtTop.value = true
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
    stopLoadObserver?.()
    stopLoadObserver = null
    if (isDestroyed) return
    await nextTick()
    if (isDestroyed) return
    const target = loadMoreTriggerRef.value
    if (!target || (!isRecommendMode.value && finished.value)) return
    const { stop } = useIntersectionObserver(
        loadMoreTriggerRef,
        ([entry]) => {
            if (!entry?.isIntersecting) return
            triggerLoadMore()
        },
        {
            root: discoverPageRef,
            rootMargin: '160px 0px 160px 0px',
            threshold: 0
        }
    )
    stopLoadObserver = stop
}

const normalizePrimaryTagOptions = (rows: any[]) => rows.filter((item: any) => item?.id !== undefined && item?.id !== null && item?.name)

const readCachedPrimaryTagOptions = () => {
    if (typeof window === 'undefined') return []
    try {
        const raw = window.localStorage.getItem(CLIENT_PRIMARY_TAG_CACHE_KEY)
        if (!raw) return []
        const cache = JSON.parse(raw)
        if (!cache || cache.expireAt < Date.now() || !Array.isArray(cache.list)) return []
        return normalizePrimaryTagOptions(cache.list)
    } catch (error) {
        console.error(error)
        return []
    }
}

const writeCachedPrimaryTagOptions = (list: any[]) => {
    if (typeof window === 'undefined' || !list.length) return
    try {
        window.localStorage.setItem(
            CLIENT_PRIMARY_TAG_CACHE_KEY,
            JSON.stringify({
                expireAt: Date.now() + TAG_CACHE_TTL_MS,
                list
            })
        )
    } catch (error) {
        console.error(error)
    }
}

const applyPrimaryTagOptions = (list: any[]) => {
    primaryTagOptions.value = normalizePrimaryTagOptions(list)
}

const loadPrimaryTagTabs = async (force = false) => {
    if (!force) {
        const cachedList = readCachedPrimaryTagOptions()
        if (cachedList.length) {
            applyPrimaryTagOptions(cachedList)
            return cachedList
        }
    }

    if (primaryTagRefreshPromise) return primaryTagRefreshPromise

    primaryTagRefreshPromise = (async () => {
        const res = await getInterestAll()
        const list = (res as any)?.data || res || []
        const rows = normalizePrimaryTagOptions(Array.isArray(list) ? list : [])
        applyPrimaryTagOptions(rows)
        writeCachedPrimaryTagOptions(rows)
        return rows
    })()

    try {
        return await primaryTagRefreshPromise
    } catch (error) {
        console.error(error)
        if (!primaryTagOptions.value.length) applyPrimaryTagOptions(readCachedPrimaryTagOptions())
        return primaryTagOptions.value
    } finally {
        primaryTagRefreshPromise = null
    }
}

const refreshPrimaryTagTabsAfterFeedMiss = (requestId: number) => {
    if (!isLatestFeedRequest(requestId)) return
    const now = Date.now()
    if (now - lastPrimaryTagRefreshAt < TAG_CACHE_REFRESH_COOLDOWN_MS) return
    lastPrimaryTagRefreshAt = now
    void loadPrimaryTagTabs(true)
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
        await fetchPrimaryTagFeed(
            isLoadMore,
            requestId,
            keyword,
            signal,
            activeRequestTagIds.value,
            isLoadMore ? TAG_LOAD_MORE_REQUEST_LIMIT : activeRequestTagIds.value.length
        )
    } catch (error) {
        if (!isCanceledRequest(error) && isLatestFeedRequest(requestId)) {
            console.error(error)
            if (!shouldUseRecommend) refreshPrimaryTagTabsAfterFeedMiss(requestId)
        }
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
    clearPrimarySwitchTimer()
    const requestId = nextFeedRequestId()
    pendingPrimaryId.value = null
    if (!keepVisible) posts.value = []
    loadingMore.value = false
    finished.value = false
    query.value.lastId = undefined
    query.value.lastCreateTime = undefined
    clearRecommendLoadTimer()
    clearRecommendEmptyRetryTimer()
    clearLoadMoreTimer()
    lastRecommendLoadAt = 0
    lastRecommendEmptyAt = 0
    lastLoadMoreAt = 0
    lastKnownScrollTop = discoverPageRef.value?.scrollTop || 0
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

const runPrimaryTagSwitch = async (nextPrimaryId: string, requestId: number) => {
    await nextTick()
    await waitForNextFrame()
    if (!isLatestFeedRequest(requestId)) return

    const keyword = normalizedSearchKeyword.value
    const shouldUseRecommend = !nextPrimaryId && !keyword
    const requestTagIds = getRequestTagIdsByPrimaryId(nextPrimaryId, keyword)
    const signal = createFeedAbortSignal()

    try {
        if (shouldUseRecommend) {
            await fetchRecommendFeedPage(false, requestId, signal)
        } else {
            let stagedResult = { batch: [] as any[], finished: false }
            const maxAttempts = Math.max(1, requestTagIds.length)

            for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
                const result = await fetchPrimaryTagFeed(false, requestId, keyword, signal, requestTagIds, 1, false)
                if (!isLatestFeedRequest(requestId)) return
                if (result) stagedResult = result
                if (stagedResult.batch.length || stagedResult.finished) break
                await waitForNextFrame()
            }

            if (!isLatestFeedRequest(requestId)) return
            posts.value = stagedResult.batch
            finished.value = stagedResult.finished
        }

        if (!isLatestFeedRequest(requestId)) return
        activePrimaryId.value = nextPrimaryId
    } catch (error) {
        if (!isCanceledRequest(error) && isLatestFeedRequest(requestId)) {
            console.error(error)
            if (!shouldUseRecommend) refreshPrimaryTagTabsAfterFeedMiss(requestId)
        }
    } finally {
        releaseFeedAbortSignal(signal)
        if (isLatestFeedRequest(requestId)) {
            loading.value = false
            loadingMore.value = false
            pendingPrimaryId.value = null
        }
    }
}

const handlePrimaryTagChange = (tagId?: string | number) => {
    const nextPrimaryId = tagId === undefined || tagId === null || tagId === '' ? '' : String(tagId)
    if (pendingPrimaryId.value === nextPrimaryId) return
    if (activePrimaryId.value === nextPrimaryId && !pendingPrimaryId.value) return

    abortFeedRequest()
    clearPrimarySwitchTimer()
    const requestId = nextFeedRequestId()
    pendingPrimaryId.value = nextPrimaryId
    loading.value = true
    loadingMore.value = false
    finished.value = false
    query.value.lastId = undefined
    query.value.lastCreateTime = undefined
    clearRecommendLoadTimer()
    clearRecommendEmptyRetryTimer()
    clearLoadMoreTimer()
    lastRecommendLoadAt = 0
    lastRecommendEmptyAt = 0
    lastLoadMoreAt = 0
    lastKnownScrollTop = discoverPageRef.value?.scrollTop || 0
    resetTagFeedCursors()

    primarySwitchTimer = setTimeout(() => {
        primarySwitchTimer = null
        runPrimaryTagSwitch(nextPrimaryId, requestId)
    }, PRIMARY_SWITCH_DEBOUNCE_MS)
}

const refreshActiveFeed = () => {
    if (isFeedRefreshing.value) return

    abortFeedRequest()
    clearPrimarySwitchTimer()
    clearRecommendLoadTimer()
    clearRecommendEmptyRetryTimer()
    clearLoadMoreTimer()

    const requestId = nextFeedRequestId()
    const nextPrimaryId = activePrimaryId.value
    pendingPrimaryId.value = nextPrimaryId
    loading.value = true
    loadingMore.value = false
    finished.value = false
    query.value.lastId = undefined
    query.value.lastCreateTime = undefined
    lastRecommendLoadAt = 0
    lastRecommendEmptyAt = 0
    lastLoadMoreAt = 0
    lastKnownScrollTop = discoverPageRef.value?.scrollTop || 0
    resetTagFeedCursors()
    runPrimaryTagSwitch(nextPrimaryId, requestId)
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
                resetRecommendCursor()
                scheduleRecommendEmptyRetry(requestId)
            }
            break
        }
        lastRecommendEmptyAt = 0
        clearRecommendEmptyRetryTimer()
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
    if (isLoadMore && !pageRows.length) {
        lastRecommendEmptyAt = Date.now()
        resetRecommendCursor()
        scheduleRecommendEmptyRetry(requestId)
    }
    finished.value = !isLoadMore && !receivedRows && pageRows.length === 0
}

const openPost = (post: any) => {
    if (!post) return
    if (isH5Viewport.value) {
        if (
            openVideoPlayerPreview({
                item: post,
                getVideoUrl,
                normalizePostFlags,
                userStore,
                cacheSession: sessionCache,
                router,
                route
            })
        ) {
            return
        }

        const postId = getPreviewPostId(post)
        const images = getPostImageUrls(post)
        if (postId == null || !images.length) return
        sessionCache.setJSON(`${CLIENT_MEDIA_VIEWER_CACHE_KEY}:${postId}`, {
            id: postId,
            post: createMediaViewerPayloadPost(normalizePostFlags(post)),
            images,
            from: route.fullPath
        })
        router.push({ name: 'ClientMediaViewer', params: { id: encodeRouteId(postId) }, query: { from: route.fullPath } })
        return
    }
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

const handleViewCommentProfile = (comment: Record<string, any>) => {
    const targetUserId = getCommentUserId(comment)
    const normalizedTargetUserId = String(targetUserId ?? '').trim()
    if (!normalizedTargetUserId) return
    closePreview()
    if (normalizedTargetUserId === String(userStore.id || '').trim()) {
        router.push('/profile')
        return
    }
    router.push(getClientUserProfileRoute(normalizedTargetUserId))
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
    if (type === 'share') {
        const postId = getPreviewPostId(post)
        if (!postId || repostActionLoading.value) return
        let content: string
        try {
            const res = await proxy?.$modal?.prompt?.('请输入转发内容', { customClass: 'client-message-box' })
            content = String((res as any)?.value ?? '').trim()
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
        return
    }
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
    settingsStore.setTitle('测吧')
    document.title = '测吧'
    document.documentElement.classList.add(CLIENT_HOME_SCROLL_CLASS)
    document.body.classList.add(CLIENT_HOME_SCROLL_CLASS)
    window.addEventListener('resize', resizeHandler)
    bindScrollListener()
    loadPrimaryTagTabs()
    resetAndFetch(false)
})

watch(
    () => posts.value,
    nextPosts => {
        schedulePostRendering(nextPosts)
    },
    { immediate: true }
)

watch(
    () => [Boolean(renderedPosts.value.length), finished.value] as const,
    async ([hasPosts, isFinished]) => {
        if (!hasPosts || isFinished) {
            stopLoadObserver?.()
            stopLoadObserver = null
            return
        }
        if (!stopLoadObserver) await setupLoadObserver()
    }
)

onBeforeUnmount(() => {
    isDestroyed = true
    nextFeedRequestId()
    abortFeedRequest()
    closePreview()
    posts.value = []
    renderedPosts.value = []
    primaryTagOptions.value = []
    resetTagFeedCursors()
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
        resizeHandler = null
    }
    unbindScrollListener()
    clearRecommendLoadTimer()
    clearRecommendEmptyRetryTimer()
    clearLoadMoreTimer()
    clearPrimarySwitchTimer()
    clearPostRenderSchedule()
    debouncedRenderer.cancel()
    stopLoadObserver?.()
    stopLoadObserver = null
    document.documentElement.classList.remove(CLIENT_HOME_SCROLL_CLASS)
    document.body.classList.remove(CLIENT_HOME_SCROLL_CLASS)
})
</script>

<style lang="scss">
.discover-page {
    --header-height: 64px;
    --sidebar-width: 244px;
    --layout-gap: 32px;
    --content-max-width: 1760px;
    --page-x: 32px;

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
    display: none;
}

:global(html.client-home-scroll-lock),
:global(body.client-home-scroll-lock) {
    overflow: hidden;
}
</style>

<style scoped lang="scss">
.page-main {
    padding-top: calc(var(--header-height) + 24px);
    padding-bottom: 40px;
    display: flex;
    justify-content: center;
}

.main-inner {
    width: 100%;
    max-width: var(--content-max-width);
    padding: 0 var(--page-x);
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
    line-height: normal;
}

.sidebar-sticky-container {
    position: fixed;
    left: max(var(--page-x), calc((100vw - var(--content-max-width)) / 2 + var(--page-x)));
    top: calc(var(--header-height) + 24px);
    width: var(--sidebar-width);
    max-height: calc(100vh - var(--header-height) - var(--layout-gap) - 32px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    padding: 12px;
    box-sizing: border-box;
    border: 1px solid var(--client-border-soft);
    border-radius: 16px;
    background: var(--client-surface);
    box-shadow: var(--client-shadow-soft);
    overflow-y: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    transition:
        border-color var(--client-feed-card-transition),
        box-shadow var(--client-feed-card-transition);
}

.sidebar-sticky-container::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
}

.sidebar-nav {
    background: transparent;
    border: 0;
    box-shadow: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 48px;
    padding: 0 16px 0 18px;
    border: none;
    background: transparent;
    border-radius: 10px;
    color: var(--text-regular);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition:
        background-color var(--client-feed-card-transition),
        color var(--client-feed-card-transition),
        transform var(--client-feed-card-transition),
        font-weight var(--client-feed-card-transition);
}

.nav-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    border-radius: 999px;
    background: var(--primary-color);
    opacity: 0;
    transform: scaleY(0.5);
    transform-origin: center;
    transition:
        opacity var(--client-feed-card-transition),
        transform var(--client-feed-card-transition);
}

.nav-item:hover {
    background: var(--primary-light);
    color: var(--text-main);
    transform: translateY(-1px) scaleY(1.01);
}

.nav-item.active {
    background: transparent;
    color: var(--client-active-text);
    font-weight: 700;
    box-shadow: none;
}

.nav-item.active::before {
    opacity: 1;
    transform: scaleY(1);
}

.nav-item.active .nav-icon {
    color: var(--client-active-text);
}

.nav-icon {
    font-size: 22px;
}

.sidebar-footer {
    display: block;
    margin-top: auto;
}

.tips-card {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
}

.tips-title {
    margin: 0 0 14px 54px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-minor);
}

.tips-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.tips-list li {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-left: 18px;
    font-size: 13px;
    color: var(--text-minor);
    line-height: 1.5;
    min-height: 28px;
}

.tips-list li span {
    display: flex;
    align-items: center;
    min-height: 28px;
}

.icon-wrapper {
    width: 22px;
    height: 22px;
    border-radius: 0;
    background: transparent;
    color: color-mix(in srgb, var(--primary-color) 50%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.icon-wrapper svg {
    font-size: 15px;
    color: currentColor;
}

.content-area {
    position: relative;
    flex: 1;
    min-width: 0;
    padding-top: 0;
    padding-right: 56px;
}

.tab-panel {
    position: relative;
    z-index: 1;
    background: transparent;
    margin: 0 0 18px;
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
    overflow: visible;
}

.tab-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 22px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    padding: 0;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.tab-row::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
}

.tab-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 0 0 auto;
    border: 0;
    background: transparent;
    min-height: 40px;
    padding: 0 2px 10px;
    border-radius: 0;
    color: var(--text-regular);
    font-size: 15px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition:
        color var(--client-feed-card-transition),
        transform var(--client-feed-card-transition);
}

.tab-item::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 3px;
    width: 18px;
    height: 3px;
    border-radius: 999px;
    background: var(--primary-color);
    opacity: 0;
    transform: translateX(-50%) scaleX(0.55);
    transition:
        opacity var(--client-feed-card-transition),
        transform var(--client-feed-card-transition);
}

.tab-item:hover {
    color: var(--primary-color);
    transform: translateY(-1px);
}

.tab-item.active {
    color: var(--client-active-text);
    font-weight: 700;
}

.tab-item.active::after {
    opacity: 1;
    transform: translateX(-50%) scaleX(1);
}

.tab-item.pending {
    color: var(--client-active-text);
    font-weight: 700;
    cursor: progress;
}

.tab-item.pending::after {
    content: '';
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 3px;
    width: auto;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent 0%, var(--client-active-text) 35%, var(--client-active-text) 65%, transparent 100%);
    background-size: 220% 100%;
    opacity: 1;
    transform: none;
    animation: tab-refresh-sweep 1.05s ease-in-out infinite;
}

.tab-item.pending span {
    animation: tab-refresh-pulse 1.05s ease-in-out infinite;
}

@keyframes tab-refresh-sweep {
    0% {
        background-position: 140% 50%;
    }
    100% {
        background-position: -140% 50%;
    }
}

@keyframes tab-refresh-pulse {
    0%,
    100% {
        opacity: 0.72;
    }
    50% {
        opacity: 1;
    }
}

button:focus,
button:focus-visible {
    outline: none;
    box-shadow: none;
}

.feed-wrap {
    position: relative;
    flex: 1;
    min-height: 240px;
    scroll-margin-top: calc(var(--header-height) + 24px);
}

.feed-floating-actions {
    position: fixed;
    right: max(12px, calc((100vw - var(--content-max-width)) / 2 + var(--page-x) + 8px));
    bottom: 28px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.feed-floating-action {
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--client-border-soft);
    border-radius: 50%;
    background: var(--client-surface);
    color: var(--text-main);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--text-main) 10%, transparent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
        color var(--app-motion-fast),
        border-color var(--app-motion-fast),
        background-color var(--app-motion-fast),
        transform var(--app-motion-fast);
}

.feed-floating-action:hover:not(:disabled) {
    color: var(--client-active-text);
    border-color: color-mix(in srgb, var(--client-active-text) 34%, var(--client-border-soft));
    background: var(--client-surface-hover);
}

.feed-floating-action:disabled {
    cursor: default;
    opacity: 0.42;
    transform: none;
}

.feed-floating-action svg {
    font-size: 20px;
}

.feed-floating-action.spinning svg {
    animation: feed-action-spin 0.8s linear infinite;
}

@keyframes feed-action-spin {
    100% {
        transform: rotate(360deg);
    }
}

.feed-wrap.is-refreshing .masonry-grid {
    pointer-events: none;
    animation: feed-card-pull-refresh 1.05s cubic-bezier(0.16, 0.76, 0.24, 1) forwards;
}

.feed-refresh-indicator {
    position: absolute;
    top: 8px;
    left: 0;
    right: 0;
    z-index: 2;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    pointer-events: none;
    opacity: 0;
    animation: refresh-indicator-enter 0.22s ease forwards;
}

.refresh-card-frame {
    width: 24px;
    height: 16px;
    border-radius: 6px;
    background:
        linear-gradient(90deg, var(--client-active-text) 0 30%, transparent 30% 100%) 6px 5px / 12px 2px no-repeat,
        linear-gradient(90deg, color-mix(in srgb, var(--client-active-text) 58%, transparent) 0 54%, transparent 54% 100%) 6px 9px / 14px 2px no-repeat,
        color-mix(in srgb, var(--client-active-text) 12%, var(--client-surface));
    box-shadow: 0 6px 18px color-mix(in srgb, var(--client-active-text) 14%, transparent);
    opacity: 0.45;
    transform: translateY(2px) scale(0.9);
    animation: refresh-frame-swap 0.9s steps(1, end) infinite;
}

.refresh-card-frame:nth-child(2) {
    animation-delay: 0.3s;
}

.refresh-card-frame:nth-child(3) {
    animation-delay: 0.6s;
}

@keyframes feed-card-pull-refresh {
    0% {
        opacity: 1;
        transform: translateY(0);
    }
    34% {
        opacity: 0.92;
        transform: translateY(16px);
    }
    68% {
        opacity: 0.78;
        transform: translateY(38px);
    }
    100% {
        opacity: 0.86;
        transform: translateY(26px);
    }
}

@keyframes refresh-indicator-enter {
    0% {
        opacity: 0;
        transform: translateY(-8px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes refresh-frame-swap {
    0%,
    32% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    33%,
    100% {
        opacity: 0.45;
        transform: translateY(2px) scale(0.9);
    }
}

.masonry-grid {
    position: relative;
    width: 100%;
}

.masonry-item {
    width: 100%;
    animation: masonry-card-enter 260ms ease both;
}

@keyframes masonry-card-enter {
    0% {
        opacity: 0;
        transform: translateY(12px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.load-more {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    padding: 28px 0 36px;
    color: var(--text-minor);
    font-size: 13px;
}

.load-more-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #94a3b8;
    font-size: 13px;
}

.load-more-spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--client-primary, #14b8a6) 18%, transparent);
    border-top-color: var(--client-primary, #14b8a6);
    animation: load-more-spin 780ms linear infinite;
}

.load-more-finished {
    width: min(320px, 72%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #94a3b8;
    font-size: 13px;
    line-height: 1.5;
}

.load-more-finished::before,
.load-more-finished::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
}

@keyframes load-more-spin {
    100% {
        transform: rotate(360deg);
    }
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
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
    }

    .sidebar-sticky-container::-webkit-scrollbar {
        display: none;
    }

    .sidebar-nav {
        flex: 1;
        flex-direction: row;
        justify-content: flex-start;
        border-radius: 0;
        padding: 0;
        min-width: max-content;
    }

    .nav-item {
        flex: 0 0 auto;
        justify-content: center;
        text-align: center;
    }

    .nav-item::before {
        left: 50%;
        top: auto;
        bottom: 3px;
        width: 18px;
        height: 3px;
        transform: translateX(-50%) scaleX(0.55);
    }

    .nav-item:hover {
        background: var(--primary-light);
    }

    .nav-item.active::before {
        transform: translateX(-50%) scaleX(1);
    }

    .sidebar-footer {
        display: none;
    }

    .content-area {
        padding-top: 0;
        padding-right: 52px;
    }

    .tab-panel {
        margin-bottom: 16px;
    }
}

@media screen and (max-width: 768px) {
    .discover-page {
        --layout-gap: 16px;
        --header-height: 56px;
        --page-x: 16px;
    }

    .main-inner {
        padding: 0 var(--page-x);
    }

    .content-area {
        padding-right: 48px;
    }

    .tab-panel {
        margin-left: calc(var(--page-x) * -1);
        margin-right: calc(var(--page-x) * -1);
        padding: 0;
    }

    .tab-row {
        padding: 0 var(--page-x);
        scroll-padding-inline: var(--page-x);
    }

    .tab-item {
        min-height: 34px;
        padding: 0 2px 9px;
        font-size: 15px;
    }

    .feed-floating-actions {
        right: 10px;
        bottom: calc(18px + env(safe-area-inset-bottom));
        gap: 8px;
    }

    .feed-floating-action {
        width: 38px;
        height: 38px;
    }

}
</style>
