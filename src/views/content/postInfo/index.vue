<template>
    <div class="content-feed-root">
        <div class="app-container content-feed-page">
            <div class="page-header-wrapper">
                <div class="header-content">
                    <div class="left-section">
                        <div class="title-block">
                            <span class="main-title">内容集合</span>
                            <span class="sub-info" v-if="totalCount !== null">
                                共 <span class="highlight">{{ totalCount }}</span> 条数据
                            </span>
                        </div>
                    </div>

                    <div class="right-section">
                        <ContentQueryForm
                            ref="queryFormRef"
                            :query-params="queryParams"
                            :loading="loading"
                            :post-type-options="postTypeOptions"
                            :tag-options="tagOptions"
                            :batch-mode="batchMode"
                            @submit="handleQuery"
                            @reset="resetQuery"
                            @toggle-batch="toggleBatchMode"
                        />

                        <div class="batch-action-bar" v-if="batchMode && selectedCount > 0">
                            <span class="selected-count">已选 {{ selectedCount }} 项</span>
                            <el-button type="danger" link @click="handleBatchDelete" :loading="deleting">
                                <Icon icon="mdi:trash-can-outline" class="mr-1" />
                                批量删除
                            </el-button>
                            <el-button link @click="clearSelection">取消选择</el-button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="feed-list-container" v-loading="loading && !loadingMore">
                <FeedList
                    v-if="postList.length > 0"
                    :posts="postList"
                    :loading="loading"
                    :loading-more="loadingMore"
                    :finished="finished"
                    :selected-ids="Array.from(selectedIds)"
                    :batch-mode="batchMode"
                    @select="handleSelect"
                    @load-more="loadMore"
                    @delete="handleSingleDelete"
                    @preview="handlePreview"
                    @view-profile="handleViewProfile"
                    @edit-tag="handleEditTag"
                    @pin="handlePin"
                    @unpin="handleUnpin"
                    @like="handleCardLike"
                />

                <el-empty v-else description="暂无内容" :image-size="100" />
            </div>

            <el-dialog v-model="editTagVisible" title="编辑标签" width="520px" :lock-scroll="false" @closed="resetEditTag">
                <el-form label-position="top">
                    <el-form-item label="话题标签" required>
                        <el-select
                            v-model="editTagIds"
                            multiple
                            filterable
                            placeholder="请选择话题标签"
                            style="width: 100%"
                            clearable
                            :loading="loadingTags"
                            class="custom-select"
                            tag-type="primary"
                        >
                            <template #prefix>
                                <Icon icon="mdi:pound" />
                            </template>
                            <template v-for="group in tagOptions" :key="group.id">
                                <el-option-group v-if="group.children && group.children.length" :label="group.name">
                                    <el-option v-for="tag in group.children" :key="tag.id" :label="tag.name" :value="tag.id" />
                                </el-option-group>
                            </template>
                        </el-select>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="editTagVisible = false">取消</el-button>
                    <el-button type="primary" :loading="updatingTag" @click="submitEditTag">保存</el-button>
                </template>
            </el-dialog>
        </div>

        <el-dialog v-model="pinVisible" title="人工置顶" width="420px" @closed="resetPin">
            <el-form label-position="top">
                <el-form-item label="置顶天数" required>
                    <el-input-number v-model="pinDays" :min="1" :max="365" :step="1" style="width: 100%" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="pinVisible = false">取消</el-button>
                <el-button type="primary" :loading="pinning" @click="submitPin">确定</el-button>
            </template>
        </el-dialog>

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
            :follow-loading="followActionLoading"
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

        <VideoModule
            v-if="videoPreviewReady"
            v-model="videoPreviewVisible"
            :src="videoPreviewSrc"
            :post="videoPreviewPost"
            :user-info="videoUserInfo"
            @close="closeVideoPreview"
            @action="handleVideoAction"
            @select-collection="handleVideoSelectCollectionPost"
        />
    </div>
</template>

<script setup name="ContentList" lang="ts">
import { ref, reactive, computed, onMounted, onActivated, onBeforeUnmount, getCurrentInstance, nextTick, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { useRouter } from 'vue-router'
import ContentQueryForm from './components/ContentQueryForm.vue'
import FeedList from './components/FeedList.vue'
import PostPreviewModal from '../personProfile/components/Modal/PostPreviewModal.vue'
import VideoModule from '../personProfile/components/VideoModule/index.vue'
import {
    addComment,
    bookmarkPost,
    deletePost,
    likePost,
    listPostByApp,
    repostPost,
    updatePostTag,
    pinPostManually,
    unpinPostManually
} from '@/api/content/post'
import { deleteComment, listTopComments, listCommentReplies } from '@/api/content/postComment'
import { getInterestAll } from '@/api/content/interest'
import { toggleFollowUser } from '@/api/content/userFollow'
import { useEnumOptions } from '@/hooks/useEnumOptions'
import modal from '@/plugins/modal'
import useUserStore from '@/store/modules/user'
import { POST_TYPE } from '@/utils/enum'
import { parseTime } from '@/utils/utils'
import { buildTextCoverDataUrl } from '@/utils/textCover'

const { proxy } = getCurrentInstance() || {}
const router = useRouter()
const userStore = useUserStore()

// ==================== 数据状态 ====================
const queryParams = reactive<{
    postType?: string
    content: string
    tagId?: number | string
    isQuestion: number | string
    lastId?: number
    lastCreateTime?: string
    limit: number
}>({
    postType: undefined,
    content: '',
    tagId: undefined,
    isQuestion: 0,
    lastId: undefined,
    lastCreateTime: undefined,
    limit: 10
})

const queryFormRef = ref<InstanceType<typeof ContentQueryForm> | null>(null)
const postList = ref<any[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
const deleting = ref(false)
const selectedIds = ref(new Set<number | string>()) // 优化：使用 Set
const batchMode = ref(false)
const totalCount = ref<number | null>(null)

// 预览相关
const previewVisible = ref(false)
const previewPost = ref<any | null>(null)
const videoPreviewVisible = ref(false)
const videoPreviewPost = ref<any | null>(null)
const videoPreviewSrc = ref('')
const followActionLoading = ref(false)
const likeActionLoading = ref(false)
const bookmarkActionLoading = ref(false)
const commentActionLoading = ref(false)
const repostActionLoading = ref(false)
const previewCommentsLoading = ref(false)
const commentDraft = ref('')
const previewModalRef = ref<{ focusInput?: () => void } | null>(null)
const isActionInputFocused = ref(false)

type ReplyState = {
    open: boolean
    loading: boolean
    list: any[]
    noMore: boolean
    lastId?: number | string
    lastCreateTime?: string
}
const replyStateMap = ref<Record<string, ReplyState>>({})
const replyPageSize = 10
const replyTarget = ref<any | null>(null)
const deleteCommentLoading = reactive<Record<string, boolean>>({})

// 标签相关
const tagOptions = ref<any[]>([])
const loadingTags = ref(false)
const editTagVisible = ref(false)
const editTagPost = ref<any | null>(null)
const editTagIds = ref<Array<string | number>>([])
const updatingTag = ref(false)

// 置顶相关
const pinVisible = ref(false)
const pinPost = ref<any | null>(null)
const pinDays = ref<number>(7)
const pinning = ref(false)

const postTypeOptions = useEnumOptions('POST_TYPE')
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

// ==================== 计算属性 ====================
const selectedCount = computed(() => selectedIds.value.size)

const commentPlaceholder = computed(() => (replyTarget.value ? `回复 @${replyTarget.value.replyUserName}` : '说点什么...'))

const videoUserInfo = computed(() => ({
    id: userStore.id,
    userId: userStore.id,
    nickName: userStore.nickName,
    userName: (userStore as any).name || (userStore as any).userName || '',
    avatar: userStore.avatar
}))

const videoPreviewReady = computed(() => Boolean(videoPreviewSrc.value))

const previewMediaList = computed(() => {
    const post = previewPost.value
    if (!post) return []
    const type = String(post?.postType ?? '')
    if (type === POST_TYPE.TEXT) {
        const content = String(post?.content ?? '').trim() || '暂无文字'
        const seed = String(post?.id ?? post?.postId ?? content)
        return [buildTextCoverDataUrl(content, seed)]
    }
    return normalizeMediaList(post).map(resolveMediaUrl).filter(Boolean)
})

const previewTags = computed(() => {
    const post = previewPost.value
    if (!post) return []
    if (Array.isArray(post.tags)) {
        return post.tags.map((tag: any) => tag?.tagName ?? tag?.name ?? tag?.label).filter((item: string) => Boolean(item))
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

const isPreviewFollowing = computed(() => resolvePreviewFollowState(previewPost.value))
const isPreviewLiked = computed(() => Boolean(previewPost.value?.isLiked ?? previewPost.value?.like))
const isPreviewCollected = computed(() => Boolean(previewPost.value?.isCollected ?? previewPost.value?.bookmark))
const isActionInputExpanded = computed(() => isActionInputFocused.value)

const isPreviewAuthorSelf = computed(() => {
    const post = previewPost.value
    if (!post) return false
    const targetUserId = getPreviewTargetUserId(post)
    if (targetUserId == null || userStore.id == null) return false
    return String(targetUserId) === String(userStore.id)
})

// ==================== 工具函数 ====================
function resolveTagIds(post: any) {
    if (Array.isArray(post?.tags)) {
        return post.tags.map((tag: any) => tag.tagId ?? tag.id).filter((id: any) => id !== undefined && id !== null && id !== '')
    }
    if (Array.isArray(post?.tagIds)) return post.tagIds
    if (typeof post?.tagStr === 'string') {
        return post.tagStr
            .split(',')
            .map((value: string) => value.trim())
            .filter(Boolean)
    }
    return []
}

function normalizeMediaList(post: any) {
    if (!post) return []
    let rawList: any[] = []
    const raw = post.mediaUrls ?? post.files
    if (Array.isArray(raw)) {
        rawList = raw
    } else if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (trimmed) {
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    rawList = JSON.parse(trimmed)
                } catch {
                    rawList = trimmed.split(',').map(item => item.trim())
                }
            } else {
                rawList = trimmed.split(',').map(item => item.trim())
            }
        }
    } else if (Array.isArray(post?.files)) {
        rawList = post.files
    }
    return rawList
        .map(item => {
            if (typeof item === 'string') return item
            return item?.url || item?.src || item?.path || ''
        })
        .filter(Boolean)
}

function resolveMediaUrl(url: string) {
    const raw = String(url || '').trim()
    if (!raw) return ''
    if (typeof (proxy as any)?.$imgUrl === 'function') return (proxy as any).$imgUrl(raw)
    if (/^https?:\/\//.test(raw)) return raw
    return (import.meta.env.VITE_APP_BASE_API || '') + raw
}

const isVideoUrl = (url: string) => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url || '')

const getVideoUrl = (post: any) => {
    const list = normalizeMediaList(post).map(resolveMediaUrl).filter(Boolean)
    return list[1] || list[0] || ''
}

const resolveCollectionVideoSrc = (post: any) => {
    const direct = post?.videoUrl || post?.video || post?.url || post?.src || post?.fileUrl || ''
    if (direct) return resolveMediaUrl(direct)
    const list = normalizeMediaList(post).map(resolveMediaUrl).filter(Boolean)
    return list.find(isVideoUrl) || list[0] || ''
}

const resolveAvatar = (avatar: string) => resolveMediaUrl(avatar)

const formatRelativeTime = (time: any) => {
    if (!time) return ''
    let date = new Date(time)
    if (Number.isNaN(date.getTime())) {
        date = new Date(String(time).replace(/-/g, '/'))
    }
    if (Number.isNaN(date.getTime())) return String(time)
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    if (diff < 86400 * 3) return `${Math.floor(diff / 86400)}天前`
    return parseTime(time, '{m}-{d}') || ''
}

const getCommentId = (comment: any) => comment?.id ?? comment?.commentId ?? comment?._id ?? null
const getCommentUserId = (comment: any) => comment?.userId ?? comment?.user?.id ?? comment?.authorId ?? comment?.createBy ?? null

const canDeleteComment = (comment: any) => {
    const commentUserId = getCommentUserId(comment)
    if ((userStore as any).id == null) return false
    return String((userStore as any).id) === String(commentUserId)
}

const isDeleteCommentLoading = (comment: any) => {
    const commentId = getCommentId(comment)
    return commentId != null && Boolean(deleteCommentLoading[String(commentId)])
}

const getCommentReplyCount = (comment: any) => {
    const value = comment?.replyCount ?? comment?.replyNum ?? comment?.replyCnt ?? 0
    return Math.max(0, Number(value) || 0)
}

const ensureReplyState = (commentId: number | string | null) => {
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

const resolveReplyState = (comment: any) => {
    const commentId = getCommentId(comment)
    return ensureReplyState(commentId) || { open: false, loading: false, list: [], noMore: true }
}

const normalizeCommentList = (response: any) => {
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.rows)) return response.rows
    if (Array.isArray(response?.list)) return response.list
    const data = response?.data ?? {}
    if (Array.isArray(data?.list)) return data.list
    if (Array.isArray(data?.rows)) return data.rows
    if (Array.isArray(data?.records)) return data.records
    if (Array.isArray(data?.items)) return data.items
    return []
}

const resolvePreviewFollowState = (post: any) => {
    if (!post) return false
    const raw = post.follow ?? post.isFollow ?? post.isFollowing ?? post.followed ?? post.followStatus ?? post.following
    if (typeof raw === 'boolean') return raw
    if (raw != null) return String(raw) === '1'
    const relation = String(post.relationType || post.relation || post.followRelation || '').toUpperCase()
    if (relation === 'MUTUAL' || relation === 'FOLLOWING') return true
    return false
}

const setPreviewFollowState = (post: any, nextFollowing: boolean) => {
    if (!post) return
    post.follow = nextFollowing
    post.isFollow = nextFollowing
    post.isFollowing = nextFollowing
    post.followed = nextFollowing
    post.followStatus = nextFollowing ? '1' : '0'
}

const normalizePostFlags = (item: any) => {
    const resolveActiveFlag = (value: any) => {
        if (typeof value === 'boolean') return value
        if (value != null) return String(value) === '1'
        return false
    }
    const likeValue = item?.like ?? item?.isLiked ?? item?.liked ?? item?.likeStatus ?? item?.isLike
    const bookmarkValue = item?.bookmark ?? item?.isCollected ?? item?.collected ?? item?.collectStatus ?? item?.isCollect
    const like = resolveActiveFlag(likeValue)
    const bookmark = resolveActiveFlag(bookmarkValue)
    const follow = resolvePreviewFollowState(item)
    return {
        ...item,
        like,
        isLiked: like,
        bookmark,
        isCollected: bookmark,
        follow,
        isFollow: follow,
        isFollowing: follow,
        followed: follow,
        followStatus: follow ? '1' : '0'
    }
}

const getPostAuthorId = (post: any) => post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? null

// 优化：减少不必要的遍历
const syncFollowStateForUser = (userId: any, nextFollowing: boolean) => {
    if (userId == null) return
    const target = String(userId)
    postList.value.forEach(item => {
        const itemUserId = getPostAuthorId(item)
        if (itemUserId == null || String(itemUserId) !== target) return
        setPreviewFollowState(item, nextFollowing)
    })
}

const getPreviewPostId = (post: any) => post?.postId ?? post?.id ?? null
const getPreviewTargetUserId = (post: any) =>
    post?.targetUserId ?? post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? userStore.id ?? null

const toLocalDateTime = (date = new Date()) => {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const buildPreviewComment = (content: string) => ({
    id: `local-${Date.now()}`,
    content,
    userId: userStore.id,
    userName: userStore.nickName || (userStore as any).name || '用户',
    nickName: userStore.nickName || (userStore as any).name || '用户',
    avatar: userStore.avatar || '',
    createTime: toLocalDateTime()
})

const resolveProfileUserId = (post: any) => post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? null

const appendPreviewComment = (post: any, comment: any) => {
    if (!post) return
    if (Array.isArray(post.commentList)) {
        post.commentList.unshift(comment)
    } else if (Array.isArray(post.comments)) {
        post.comments.unshift(comment)
    } else if (Array.isArray(post.topComments)) {
        post.topComments.unshift(comment)
    } else {
        post.commentList = [comment]
    }
}

const getCommentName = (comment: any) => comment?.nickName || comment?.userName || comment?.username || comment?.authorName || comment?.user?.nickName || '用户'

// ==================== 标签管理 ====================
async function loadTags() {
    if (loadingTags.value) return
    loadingTags.value = true
    try {
        const res = await getInterestAll()
        tagOptions.value = (res as any).data || res || []
    } catch (e) {
        console.error('Failed to load tags', e)
    } finally {
        loadingTags.value = false
    }
}

function handleEditTag(post: any) {
    editTagPost.value = post
    editTagIds.value = resolveTagIds(post)
    if (!tagOptions.value.length) loadTags()
    editTagVisible.value = true
}

function resetEditTag() {
    editTagPost.value = null
    editTagIds.value = []
}

async function submitEditTag() {
    if (updatingTag.value) return
    const postId = editTagPost.value?.id
    if (!postId) {
        ;(proxy as any)?.$modal?.msgError?.('未找到帖子ID')
        return
    }
    if (!editTagIds.value.length) {
        ;(proxy as any)?.$modal?.msgError?.('请至少选择一个话题标签')
        return
    }
    updatingTag.value = true
    try {
        await updatePostTag({ postId, tagStr: editTagIds.value.join(',') })
        ;(proxy as any)?.$modal?.msgSuccess?.('标签更新成功')
        editTagVisible.value = false
        handleQuery()
    } catch (e) {
        console.error(e)
        ;(proxy as any)?.$modal?.msgError?.('标签更新失败')
    } finally {
        updatingTag.value = false
    }
}

// ==================== 置顶管理 ====================
function handlePin(post: any) {
    pinPost.value = post
    pinDays.value = 7
    pinVisible.value = true
}

function resetPin() {
    pinPost.value = null
    pinDays.value = 7
}

async function submitPin() {
    if (pinning.value) return
    const postId = pinPost.value?.id
    if (!postId) {
        ;(proxy as any)?.$modal?.msgError?.('未找到帖子ID')
        return
    }
    if (!pinDays.value || pinDays.value < 1) {
        ;(proxy as any)?.$modal?.msgError?.('请输入置顶天数')
        return
    }
    pinning.value = true
    try {
        await pinPostManually({ postId, days: pinDays.value })
        ;(proxy as any)?.$modal?.msgSuccess?.('置顶成功')
        pinVisible.value = false
        handleQuery()
    } catch (e) {
        console.error(e)
        ;(proxy as any)?.$modal?.msgError?.('置顶失败')
    } finally {
        pinning.value = false
    }
}

async function handleUnpin(post: any) {
    const postId = post?.id
    if (!postId) {
        ;(proxy as any)?.$modal?.msgError?.('未找到帖子ID')
        return
    }
    try {
        await (proxy as any)?.$modal?.confirm('确认取消置顶该条内容吗？')
    } catch {
        return
    }
    try {
        await unpinPostManually({ postId })
        ;(proxy as any)?.$modal?.msgSuccess?.('已取消置顶')
        handleQuery()
    } catch (e) {
        console.error(e)
        ;(proxy as any)?.$modal?.msgError?.('取消置顶失败')
    }
}

// ==================== 列表操作 ====================
async function fetchList(isLoadMore = false) {
    if (loading.value || loadingMore.value) return
    if (isLoadMore) loadingMore.value = true
    else loading.value = true

    try {
        const params: Record<string, any> = {
            content: queryParams.content?.trim() || undefined,
            tagId: queryParams.tagId || undefined,
            isQuestion: queryParams.isQuestion ?? 0,
            lastId: queryParams.lastId,
            lastCreateTime: queryParams.lastCreateTime,
            limit: queryParams.limit
        }
        if (queryParams.postType !== undefined && queryParams.postType !== null && queryParams.postType !== '') {
            params.postType = String(queryParams.postType)
        }

        const res = await listPostByApp(params)
        const list = (res as any)?.rows || (res as any)?.data || res || []
        const records = Array.isArray(list) ? list : []
        const resTotal = (res as any)?.total ?? (res as any)?.data?.total ?? (res as any)?.count

        if (Number.isFinite(Number(resTotal))) {
            totalCount.value = Number(resTotal)
        } else if (!isLoadMore) {
            totalCount.value = null
        }

        const normalizedRecords = records.map(item => normalizePostFlags(item))
        if (!isLoadMore) postList.value = normalizedRecords
        else postList.value = postList.value.concat(normalizedRecords)

        if (records.length > 0) {
            const last = records[records.length - 1]
            queryParams.lastId = last.id
            queryParams.lastCreateTime = last.createTime
        }

        finished.value = records.length < queryParams.limit
    } catch (e) {
        console.error(e)
        ;(proxy as any)?.$modal?.msgError?.('获取内容列表失败')
    } finally {
        loading.value = false
        loadingMore.value = false
    }
}

function handleQuery() {
    finished.value = false
    queryParams.lastId = undefined
    queryParams.lastCreateTime = undefined
    selectedIds.value.clear() // 优化：使用 Set 的 clear 方法
    totalCount.value = null
    fetchList(false)
}

function resetQuery() {
    queryFormRef.value?.reset()
    queryParams.postType = undefined
    queryParams.content = ''
    queryParams.tagId = undefined
    queryParams.isQuestion = 0
    queryParams.limit = 10
    queryParams.lastId = undefined
    queryParams.lastCreateTime = undefined
    finished.value = false
    selectedIds.value.clear()
    totalCount.value = null
    fetchList(false)
}

function loadMore() {
    if (finished.value) return
    fetchList(true)
}

// ==================== 批量操作 ====================
function handleSelect(payload: { id: string | number; checked: boolean }) {
    if (!batchMode.value) return
    const { id, checked } = payload
    if (checked) {
        selectedIds.value.add(id) // 优化：Set 的 add 方法
    } else {
        selectedIds.value.delete(id) // 优化：Set 的 delete 方法
    }
}

function toggleBatchMode() {
    batchMode.value = !batchMode.value
    if (!batchMode.value) selectedIds.value.clear()
}

function clearSelection() {
    selectedIds.value.clear()
}

async function handleBatchDelete() {
    if (!selectedIds.value.size || deleting.value) return
    const ids = Array.from(selectedIds.value)
    await handleDeleteConfirm(ids)
}

async function handleSingleDelete(id: string | number) {
    if (!id) return
    await handleDeleteConfirm([id])
}

async function handleDeleteConfirm(ids: Array<string | number>) {
    const isBatch = ids.length > 1
    try {
        await (proxy as any)?.$modal?.confirm(isBatch ? `确认删除选中的 ${ids.length} 条帖子？` : '确认删除该条内容吗？删除后不可恢复。', '提示', {
            lockScroll: false
        })
    } catch {
        return
    }

    deleting.value = true
    try {
        await deletePost({ postIds: ids })
        ;(proxy as any)?.$modal?.msgSuccess?.('删除成功')

        postList.value = postList.value.filter(item => !ids.includes(item.id))
        ids.forEach(id => selectedIds.value.delete(id)) // 优化：逐个删除
        if (totalCount.value !== null) {
            totalCount.value = Math.max(0, totalCount.value - ids.length)
        }

        if (postList.value.length < 5 && !finished.value) {
            loadMore()
        }
    } catch (e) {
        console.error(e)
        ;(proxy as any)?.$modal?.msgError?.('删除失败')
    } finally {
        deleting.value = false
    }
}

// ==================== 预览相关 ====================
function handleViewProfile(post: any) {
    const userId = resolveProfileUserId(post)
    if (!userId) return
    router.push({ path: '/content/userProfile', query: { userId: String(userId) } })
}

function handlePreview(post: any) {
    if (!post) return
    if (batchMode.value) return
    const type = String(post?.postType ?? '')
    if (type === POST_TYPE.VIDEO) {
        const src = getVideoUrl(post)
        if (!src) return
        if (previewVisible.value) closePreview()
        videoPreviewPost.value = post
        videoPreviewSrc.value = src
        videoPreviewVisible.value = true
        return
    }
    if (type !== POST_TYPE.IMAGE && type !== POST_TYPE.TEXT) return
    if (videoPreviewVisible.value) closeVideoPreview()
    previewPost.value = post
    loadPreviewComments(post)
    previewVisible.value = true
}

async function loadPreviewComments(post: any, options: { silent?: boolean } = {}) {
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

function resetPreview() {
    previewPost.value = null
    commentDraft.value = ''
    isActionInputFocused.value = false
    previewCommentsLoading.value = false
    replyStateMap.value = {}
    replyTarget.value = null
}

function closePreview() {
    previewVisible.value = false
    resetPreview()
}

function resetVideoPreview() {
    videoPreviewPost.value = null
    videoPreviewSrc.value = ''
}

function closeVideoPreview() {
    videoPreviewVisible.value = false
    resetVideoPreview()
}

function focusCommentInput() {
    isActionInputFocused.value = true
    nextTick(() => {
        previewModalRef.value?.focusInput?.()
    })
}

function handleActionInputBlur() {
    isActionInputFocused.value = false
    clearReplyTarget()
}

function clearReplyTarget() {
    replyTarget.value = null
}

// ==================== 评论相关 ====================
function handleReplyToComment(comment: any) {
    const commentId = getCommentId(comment)
    if (!commentId) return
    replyTarget.value = {
        parentId: commentId,
        replyUserId: comment?.userId ?? comment?.user?.id ?? comment?.authorId ?? comment?.createBy ?? null,
        replyUserName: getCommentName(comment)
    }
    focusCommentInput()
}

function handleReplyToReply(reply: any, parent: any) {
    const parentId = getCommentId(parent)
    if (!parentId) return
    replyTarget.value = {
        parentId,
        replyUserId: reply?.userId ?? reply?.user?.id ?? reply?.authorId ?? reply?.createBy ?? null,
        replyUserName: getCommentName(reply)
    }
    focusCommentInput()
}

async function loadCommentReplies(comment: any) {
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

function toggleCommentReplies(comment: any) {
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

async function submitPreviewComment() {
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

async function handleDeleteComment(comment: any, parent?: any) {
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
    deleteCommentLoading[String(commentId)] = true
    try {
        await deleteComment({ id: commentId, userId: (userStore as any).id || undefined })
        removeLocalComment(commentId, parent)
        proxy?.$modal?.msgSuccess?.('删除成功')
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('删除失败')
    } finally {
        deleteCommentLoading[String(commentId)] = false
    }
}

const removeLocalComment = (commentId: string | number, parent?: any) => {
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
        const replyCount = comment ? getCommentReplyCount(comment) : 0
        removePreviewComment(post, targetId)
        if (replyStateMap.value?.[targetId]) {
            delete replyStateMap.value[targetId]
        }
        post.commentCount = Math.max(0, Number(post.commentCount || 0) - (1 + replyCount))
    }
}

const removePreviewComment = (post: any, commentId: string | number) => {
    if (!post) return
    const targetId = String(commentId)
    if (Array.isArray(post.commentList)) {
        post.commentList = post.commentList.filter((item: any) => String(getCommentId(item)) !== targetId)
    } else if (Array.isArray(post.comments)) {
        post.comments = post.comments.filter((item: any) => String(getCommentId(item)) !== targetId)
    } else if (Array.isArray(post.topComments)) {
        post.topComments = post.topComments.filter((item: any) => String(getCommentId(item)) !== targetId)
    }
}

// ==================== 互动操作 ====================
const likingPosts = new Set<string | number>()

async function handleCardLike(post: any) {
    if (!post) return

    const postId = getPreviewPostId(post)
    const targetUserId = getPostAuthorId(post)
    if (!postId || !targetUserId) return

    if (likingPosts.has(postId)) return

    likingPosts.add(postId)
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
        ;(proxy as any)?.$modal?.msgError?.('操作失败，请重试')
    } finally {
        setTimeout(() => {
            likingPosts.delete(postId)
        }, 500)
    }
}

async function handlePreviewFollow() {
    const post = previewPost.value
    if (!post || followActionLoading.value || isPreviewAuthorSelf.value) return
    const targetUserId = getPreviewTargetUserId(post)
    if (!targetUserId) return
    const wasFollowing = isPreviewFollowing.value
    followActionLoading.value = true
    try {
        await toggleFollowUser({ targetUserId })
        setPreviewFollowState(post, !wasFollowing)
        syncFollowStateForUser(targetUserId, !wasFollowing)
    } catch (error) {
        console.error(error)
    } finally {
        followActionLoading.value = false
    }
}

async function handlePreviewAction(type: 'like' | 'collect' | 'share') {
    const post = previewPost.value
    if (!post) return
    const postId = getPreviewPostId(post)
    if (!postId) return

    if (type === 'like') {
        const targetUserId = getPreviewTargetUserId(post)
        if (!targetUserId || likeActionLoading.value) return
        likeActionLoading.value = true
        const wasLiked = Boolean(post.isLiked ?? post.like)
        try {
            const res = await likePost({ postId, targetUserId })
            const active = (res as any)?.data?.active
            const nextLiked = typeof active === 'boolean' ? active : !wasLiked
            if (nextLiked !== wasLiked) {
                post.isLiked = nextLiked
                post.like = nextLiked
                post.likeCount = Math.max(0, Number(post.likeCount || 0) + (nextLiked ? 1 : -1))
            }
        } catch (error) {
            console.error(error)
        } finally {
            likeActionLoading.value = false
        }
    }

    if (type === 'collect') {
        const targetUserId = getPreviewTargetUserId(post)
        if (!targetUserId || bookmarkActionLoading.value) return
        bookmarkActionLoading.value = true
        const wasCollected = Boolean(post.isCollected ?? post.bookmark)
        try {
            const res = await bookmarkPost({ postId, targetUserId })
            const active = (res as any)?.data?.active
            const nextCollected = typeof active === 'boolean' ? active : !wasCollected
            if (nextCollected !== wasCollected) {
                post.isCollected = nextCollected
                post.bookmark = nextCollected
                const baseCount = Number(post.bookmarkCount ?? post.collectCount ?? 0)
                post.bookmarkCount = Math.max(0, baseCount + (nextCollected ? 1 : -1))
                if (post.collectCount != null) post.collectCount = post.bookmarkCount
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
            const res = await modal.prompt('请输入转发内容')
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
    }
}

const handleVideoSelectCollectionPost = (post: any) => {
    if (!post) return
    const src = resolveCollectionVideoSrc(post)
    if (!src) return
    videoPreviewPost.value = normalizePostFlags(post)
    videoPreviewSrc.value = src
    videoPreviewVisible.value = true
}

async function handleVideoAction(type: 'follow' | 'like' | 'collect' | 'comment' | 'share', payload?: any) {
    const post = videoPreviewPost.value
    if (!post) return
    const postId = getPreviewPostId(post)
    const targetUserId = getPreviewTargetUserId(post)

    if (type === 'follow') {
        if (!targetUserId || followActionLoading.value) return
        const wasFollowing = resolvePreviewFollowState(post)
        followActionLoading.value = true
        try {
            await toggleFollowUser({ targetUserId })
            setPreviewFollowState(post, !wasFollowing)
            syncFollowStateForUser(targetUserId, !wasFollowing)
        } catch (error) {
            console.error(error)
        } finally {
            followActionLoading.value = false
        }
    }

    if (type === 'like') {
        if (!postId || !targetUserId || likeActionLoading.value) return
        likeActionLoading.value = true
        const wasLiked = Boolean(post.isLiked ?? post.like)
        try {
            const res = await likePost({ postId, targetUserId })
            const active = (res as any)?.data?.active
            const nextLiked = typeof active === 'boolean' ? active : !wasLiked
            if (nextLiked !== wasLiked) {
                post.isLiked = nextLiked
                post.like = nextLiked
                post.likeCount = Math.max(0, Number(post.likeCount || 0) + (nextLiked ? 1 : -1))
            }
        } catch (error) {
            console.error(error)
        } finally {
            likeActionLoading.value = false
        }
    }

    if (type === 'collect') {
        if (!postId || !targetUserId || bookmarkActionLoading.value) return
        bookmarkActionLoading.value = true
        const wasCollected = Boolean(post.isCollected ?? post.bookmark)
        try {
            const res = await bookmarkPost({ postId, targetUserId })
            const active = (res as any)?.data?.active
            const nextCollected = typeof active === 'boolean' ? active : !wasCollected
            if (nextCollected !== wasCollected) {
                post.isCollected = nextCollected
                post.bookmark = nextCollected
                const baseCount = Number(post.bookmarkCount ?? post.collectCount ?? 0)
                post.bookmarkCount = Math.max(0, baseCount + (nextCollected ? 1 : -1))
                if (post.collectCount != null) post.collectCount = post.bookmarkCount
            }
        } catch (error) {
            console.error(error)
        } finally {
            bookmarkActionLoading.value = false
        }
    }

    if (type === 'comment') {
        if (!postId || !targetUserId || commentActionLoading.value) return
        const parentCommentId = payload?.parentCommentId
        const replyUserId = payload?.replyUserId
        const content = String(payload?.content ?? '').trim()
        if (!content) return
        commentActionLoading.value = true
        try {
            const res = await addComment({ postId, targetUserId, content, parentCommentId, replyUserId })
            post.commentCount = Number(post.commentCount || 0) + 1
            payload?.onSuccess?.(res)
        } catch (error) {
            console.error(error)
        } finally {
            commentActionLoading.value = false
        }
    }

    if (type === 'share') {
        if (!postId || repostActionLoading.value) return
        let content = String(payload?.content ?? '').trim()
        if (!content) {
            try {
                const res = await modal.prompt('请输入转发内容')
                content = String((res as any)?.value ?? '').trim()
            } catch {
                return
            }
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

// ==================== 生命周期 ====================
onMounted(() => {
    loadTags()
    resetQuery()
})

onActivated(() => {
    resetQuery()
})

watch([previewVisible, videoPreviewVisible], ([previewOpen, videoOpen]) => {
    isBodyScrollLocked.value = previewOpen || videoOpen
})

onBeforeUnmount(() => {
    isBodyScrollLocked.value = false
})
</script>

<style scoped lang="scss">
.content-feed-page {
    padding: 0;
    background-color: transparent;
}

.page-header-wrapper {
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    padding: 16px 24px;
    margin-bottom: 20px;

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
    }

    .left-section {
        .title-block {
            display: flex;
            align-items: baseline;
            gap: 12px;

            .main-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            .sub-info {
                font-size: 13px;
                color: var(--el-text-color-secondary);

                .highlight {
                    color: var(--el-color-primary);
                    font-weight: 600;
                    margin: 0 2px;
                }
            }
        }
    }

    .right-section {
        display: flex;
        align-items: center;
        gap: 16px;

        .batch-action-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-left: 16px;
            border-left: 1px solid var(--el-border-color);

            .selected-count {
                font-size: 13px;
                color: var(--el-text-color-secondary);
            }
        }
    }
}

.feed-list-container {
    padding: 0 24px 24px;
    min-height: 200px;
}

@media screen and (max-width: 768px) {
    .page-header-wrapper {
        padding: 12px 16px;

        .header-content {
            flex-direction: column;
            align-items: stretch;
        }

        .right-section {
            flex-direction: column;
            align-items: stretch;

            .batch-action-bar {
                padding-left: 0;
                border-left: none;
                border-top: 1px solid var(--el-border-color-lighter);
                padding-top: 12px;
                justify-content: space-between;
            }
        }
    }

    .feed-list-container {
        padding: 0 12px 12px;
    }
}
</style>
