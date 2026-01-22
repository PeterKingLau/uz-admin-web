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

                        <div class="batch-action-bar" v-if="batchMode && selectedIds.length > 0">
                            <span class="selected-count">已选 {{ selectedIds.length }} 项</span>
                            <el-button type="danger" link @click="handleBatchDelete" :loading="deleting">
                                <Icon icon="mdi:trash-can-outline" class="mr-1" />
                                批量删除
                            </el-button>
                            <el-button link @click="selectedIds = []">取消选择</el-button>
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
                    :selected-ids="selectedIds"
                    :batch-mode="batchMode"
                    @select="handleSelect"
                    @load-more="loadMore"
                    @delete="handleSingleDelete"
                    @preview="handlePreview"
                    @view-profile="handleViewProfile"
                    @edit-tag="handleEditTag"
                    @pin="handlePin"
                    @unpin="handleUnpin"
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
const selectedIds = ref<Array<number | string>>([])
const batchMode = ref(false)
const totalCount = ref<number | null>(null)

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
const videoLikeLoading = ref(false)
const videoBookmarkLoading = ref(false)
const videoCommentLoading = ref(false)
const videoRepostLoading = ref(false)
const videoFollowLoading = ref(false)
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
const commentPlaceholder = computed(() => (replyTarget.value ? `回复 @${replyTarget.value.replyUserName}` : '说点什么...'))

const tagOptions = ref<any[]>([])
const loadingTags = ref(false)
const editTagVisible = ref(false)
const editTagPost = ref<any | null>(null)
const editTagIds = ref<Array<string | number>>([])
const updatingTag = ref(false)

const pinVisible = ref(false)
const pinPost = ref<any | null>(null)
const pinDays = ref<number>(7)
const pinning = ref(false)
const unpinning = ref(false)

const postTypeOptions = useEnumOptions('POST_TYPE')
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

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

const buildVideoUserInfo = () => ({
    id: userStore.id,
    userId: userStore.id,
    nickName: userStore.nickName,
    userName: (userStore as any).name || (userStore as any).userName || '',
    avatar: userStore.avatar
})

const videoUserInfo = computed(() => buildVideoUserInfo())
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

const resolveReplyRemoveCount = (commentId: string | number, comment: any) => {
    const rawCount = Number(comment?.replyCount || 0)
    const replyCount = Number.isFinite(rawCount) ? rawCount : 0
    const state = replyStateMap.value?.[commentId]
    const loadedCount = Array.isArray(state?.list) ? state.list.length : 0
    return Math.max(replyCount, loadedCount)
}

const removePreviewComment = (post: any, commentId: string | number) => {
    if (!post) return
    const targetId = String(commentId)
    if (Array.isArray(post.commentList)) {
        post.commentList = post.commentList.filter((item: any) => String(getCommentId(item)) !== targetId)
        return
    }
    if (Array.isArray(post.comments)) {
        post.comments = post.comments.filter((item: any) => String(getCommentId(item)) !== targetId)
        return
    }
    if (Array.isArray(post.topComments)) {
        post.topComments = post.topComments.filter((item: any) => String(getCommentId(item)) !== targetId)
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
        const removeReplies = resolveReplyRemoveCount(targetId, comment)
        removePreviewComment(post, targetId)
        if (replyStateMap.value?.[targetId]) {
            delete replyStateMap.value[targetId]
        }
        post.commentCount = Math.max(0, Number(post.commentCount || 0) - (1 + Math.max(0, removeReplies)))
    }
}

const getCommentName = (comment: any) => comment?.nickName || comment?.userName || comment?.username || comment?.authorName || comment?.user?.nickName || '用户'

const clearReplyTarget = () => {
    replyTarget.value = null
}

const handleReplyToComment = (comment: any) => {
    const commentId = getCommentId(comment)
    if (!commentId) return
    replyTarget.value = {
        parentId: commentId,
        replyUserId: comment?.userId ?? comment?.user?.id ?? comment?.authorId ?? comment?.createBy ?? null,
        replyUserName: getCommentName(comment)
    }
    focusCommentInput()
}

const handleReplyToReply = (reply: any, parent: any) => {
    const parentId = getCommentId(parent)
    if (!parentId) return
    replyTarget.value = {
        parentId,
        replyUserId: reply?.userId ?? reply?.user?.id ?? reply?.authorId ?? reply?.createBy ?? null,
        replyUserName: getCommentName(reply)
    }
    focusCommentInput()
}

const handleDeleteComment = async (comment: any, parent?: any) => {
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

const loadCommentReplies = async (comment: any) => {
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

const toggleCommentReplies = (comment: any) => {
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

const resolveActiveFlag = (value: any) => {
    if (typeof value === 'boolean') return value
    if (value != null) return String(value) === '1'
    return false
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

const syncFollowStateForUser = (userId: any, nextFollowing: boolean) => {
    if (userId == null) return
    const target = String(userId)
    postList.value.forEach(item => {
        const itemUserId = getPostAuthorId(item)
        if (itemUserId == null) return
        if (String(itemUserId) !== target) return
        setPreviewFollowState(item, nextFollowing)
    })
}

const isPreviewFollowing = computed(() => resolvePreviewFollowState(previewPost.value))
const isPreviewLiked = computed(() => Boolean(previewPost.value?.isLiked ?? previewPost.value?.like))
const isPreviewCollected = computed(() => Boolean(previewPost.value?.isCollected ?? previewPost.value?.bookmark))
const canSubmitComment = computed(() => Boolean(commentDraft.value.trim()))
const isActionInputExpanded = computed(() => isActionInputFocused.value)

const getPreviewPostId = (post: any) => post?.postId ?? post?.id ?? null

const getPreviewTargetUserId = (post: any) =>
    post?.targetUserId ?? post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? userStore.id ?? null

const isPreviewAuthorSelf = computed(() => {
    const post = previewPost.value
    if (!post) return false
    const targetUserId = getPreviewTargetUserId(post)
    if (targetUserId == null || userStore.id == null) return false
    return String(targetUserId) === String(userStore.id)
})

const toLocalDateTime = (date = new Date()) => {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
    )}`
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
        return
    }
    if (Array.isArray(post.comments)) {
        post.comments.unshift(comment)
        return
    }
    if (Array.isArray(post.topComments)) {
        post.topComments.unshift(comment)
        return
    }
    post.commentList = [comment]
}

function handleEditTag(post: any) {
    editTagPost.value = post
    editTagIds.value = resolveTagIds(post)
    if (!tagOptions.value.length) loadTags()
    editTagVisible.value = true
}

function handleViewProfile(post: any) {
    const userId = resolveProfileUserId(post)
    if (!userId) return
    router.push({ path: '/content/userProfile', query: { userId: String(userId) } })
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
        await updatePostTag({
            postId,
            tagStr: editTagIds.value.join(',')
        })
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
        await pinPostManually({
            postId,
            days: pinDays.value
        })
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
    if (unpinning.value) return
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

    unpinning.value = true
    try {
        await unpinPostManually({ postId })
        ;(proxy as any)?.$modal?.msgSuccess?.('已取消置顶')
        handleQuery()
    } catch (e) {
        console.error(e)
        ;(proxy as any)?.$modal?.msgError?.('取消置顶失败')
    } finally {
        unpinning.value = false
    }
}

async function fetchList(isLoadMore = false) {
    if (loading.value || loadingMore.value) return

    if (isLoadMore) loadingMore.value = true
    else loading.value = true

    try {
        const resolvePostType = (value?: string) => {
            if (value === undefined || value === null || value === '') return undefined
            return String(value)
        }

        const resolvedPostType = resolvePostType(queryParams.postType)
        const params: Record<string, any> = {
            content: queryParams.content?.trim() || undefined,
            tagId: queryParams.tagId || undefined,
            isQuestion: queryParams.isQuestion ?? 0,
            lastId: queryParams.lastId,
            lastCreateTime: queryParams.lastCreateTime,
            limit: queryParams.limit
        }
        if (resolvedPostType != null) params.postType = resolvedPostType

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
    selectedIds.value = []
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
    selectedIds.value = []
    totalCount.value = null
    fetchList(false)
}

function loadMore() {
    if (finished.value) return
    fetchList(true)
}

function handleSelect(payload: { id: string | number; checked: boolean }) {
    if (!batchMode.value) return
    const { id, checked } = payload
    if (checked) {
        if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
    } else {
        selectedIds.value = selectedIds.value.filter(v => v !== id)
    }
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
    videoLikeLoading.value = false
    videoBookmarkLoading.value = false
    videoCommentLoading.value = false
    videoRepostLoading.value = false
    videoFollowLoading.value = false
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

async function handlePreviewAction(type: 'like' | 'collect' | 'share') {
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
            const res = await likePost({ postId, targetUserId })
            const active = (res as any)?.data?.active
            const nextLiked = typeof active === 'boolean' ? active : !wasLiked
            if (nextLiked !== wasLiked) {
                post.isLiked = nextLiked
                post.like = nextLiked
                const nextCount = Number(post.likeCount || 0) + (nextLiked ? 1 : -1)
                post.likeCount = Math.max(0, nextCount)
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
            const res = await bookmarkPost({ postId, targetUserId })
            const active = (res as any)?.data?.active
            const nextCollected = typeof active === 'boolean' ? active : !wasCollected
            if (nextCollected !== wasCollected) {
                post.isCollected = nextCollected
                post.bookmark = nextCollected
                const baseCount = Number(post.bookmarkCount ?? post.collectCount ?? 0)
                const nextCount = baseCount + (nextCollected ? 1 : -1)
                post.bookmarkCount = Math.max(0, nextCount)
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
        if (!targetUserId || videoFollowLoading.value) return
        const wasFollowing = resolvePreviewFollowState(post)
        videoFollowLoading.value = true
        try {
            await toggleFollowUser({ targetUserId })
            setPreviewFollowState(post, !wasFollowing)
            syncFollowStateForUser(targetUserId, !wasFollowing)
        } catch (error) {
            console.error(error)
        } finally {
            videoFollowLoading.value = false
        }
    }

    if (type === 'like') {
        if (!postId || !targetUserId || videoLikeLoading.value) return
        videoLikeLoading.value = true
        const wasLiked = Boolean(post.isLiked ?? post.like)
        try {
            const res = await likePost({ postId, targetUserId })
            const active = (res as any)?.data?.active
            const nextLiked = typeof active === 'boolean' ? active : !wasLiked
            if (nextLiked !== wasLiked) {
                post.isLiked = nextLiked
                post.like = nextLiked
                const nextCount = Number(post.likeCount || 0) + (nextLiked ? 1 : -1)
                post.likeCount = Math.max(0, nextCount)
            }
        } catch (error) {
            console.error(error)
        } finally {
            videoLikeLoading.value = false
        }
    }

    if (type === 'collect') {
        if (!postId || !targetUserId || videoBookmarkLoading.value) return
        videoBookmarkLoading.value = true
        const wasCollected = Boolean(post.isCollected ?? post.bookmark)
        try {
            const res = await bookmarkPost({ postId, targetUserId })
            const active = (res as any)?.data?.active
            const nextCollected = typeof active === 'boolean' ? active : !wasCollected
            if (nextCollected !== wasCollected) {
                post.isCollected = nextCollected
                post.bookmark = nextCollected
                const baseCount = Number(post.bookmarkCount ?? post.collectCount ?? 0)
                const nextCount = baseCount + (nextCollected ? 1 : -1)
                post.bookmarkCount = Math.max(0, nextCount)
                if (post.collectCount != null) post.collectCount = post.bookmarkCount
            }
        } catch (error) {
            console.error(error)
        } finally {
            videoBookmarkLoading.value = false
        }
    }

    if (type === 'comment') {
        if (!postId || !targetUserId || videoCommentLoading.value) return
        const parentCommentId = payload?.parentCommentId
        const replyUserId = payload?.replyUserId
        const content = String(payload?.content ?? '').trim()
        if (!content) return
        videoCommentLoading.value = true
        try {
            const res = await addComment({ postId, targetUserId, content, parentCommentId, replyUserId })
            post.commentCount = Number(post.commentCount || 0) + 1
            payload?.onSuccess?.(res)
        } catch (error) {
            console.error(error)
        } finally {
            videoCommentLoading.value = false
        }
    }

    if (type === 'share') {
        if (!postId || videoRepostLoading.value) return
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
        videoRepostLoading.value = true
        try {
            await repostPost({ originalPostId: postId, content })
            post.repostCount = Number(post.repostCount || 0) + 1
            if (post.shareCount != null) post.shareCount = Number(post.shareCount || 0) + 1
        } catch (error) {
            console.error(error)
        } finally {
            videoRepostLoading.value = false
        }
    }
}

async function handleBatchDelete() {
    if (!selectedIds.value.length || deleting.value) return
    handleDeleteConfirm(selectedIds.value)
}

async function handleSingleDelete(id: string | number) {
    if (!id) return
    handleDeleteConfirm([id])
}

function toggleBatchMode() {
    batchMode.value = !batchMode.value
    if (!batchMode.value) selectedIds.value = []
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
        selectedIds.value = selectedIds.value.filter(id => !ids.includes(id))
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

.post-preview-mask {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.48);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.post-preview-panel {
    width: min(1120px, 100%);
    background: var(--el-bg-color);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22);
    position: relative;
}

.preview-close {
    position: fixed;
    top: 24px;
    left: 24px;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 3001;
    transition:
        color 0.16s ease,
        border-color 0.16s ease,
        background 0.16s ease,
        box-shadow 0.16s ease;
}

.preview-close:hover {
    color: var(--el-text-color-primary);
    border-color: var(--el-border-color);
    background: var(--el-fill-color);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.25);
}

.post-preview-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
    background: var(--el-bg-color);
    height: 78vh;
    max-height: 78vh;
}

.preview-media-pane {
    position: relative;
    background: var(--el-fill-color-light);
    min-height: 520px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.preview-carousel {
    width: 100%;
    height: 100%;
}

.preview-carousel :deep(.el-carousel__container) {
    height: 100%;
}

.preview-carousel :deep(.el-carousel__indicators) {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
}

.preview-carousel :deep(.el-carousel__indicator--horizontal) {
    padding: 6px 4px;
}

.preview-media-img {
    width: 100%;
    height: 100%;
    display: block;
}

.preview-media-empty {
    color: var(--el-text-color-secondary);
    font-size: 14px;
}

.preview-detail-pane {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px 20px;
    overflow: hidden;
    background: var(--el-bg-color);
}

.detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.follow-btn {
    height: 32px;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.4px;
    background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-light-3) 100%);
    border-color: transparent;
    color: var(--el-color-white);
    box-shadow: 0 10px 22px rgba(245, 108, 108, 0.35);
}

.follow-btn.is-following {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
    color: var(--el-text-color-regular);
    box-shadow: none;
}

.follow-btn:hover,
.follow-btn:focus {
    background: linear-gradient(135deg, var(--el-color-danger-dark-2) 0%, var(--el-color-danger) 100%);
    border-color: transparent;
    color: var(--el-color-white);
}

.follow-btn.is-following:hover,
.follow-btn.is-following:focus {
    background: var(--el-fill-color);
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
}

.author-block {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.author-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.author-meta .name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.author-meta .time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.detail-content {
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
}

.detail-text.empty {
    color: var(--el-text-color-placeholder);
    font-style: italic;
}

.detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.detail-tag {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid rgba(64, 158, 255, 0.18);
    white-space: nowrap;
}

.detail-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.detail-divider {
    margin: 4px 0;
}

.detail-comments {
    flex: 1;
    overflow: auto;
    padding-right: 6px;
}

.comment-count {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.comment-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
}

.comment-item {
    display: flex;
    gap: 10px;
}

.comment-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.comment-user {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.comment-text {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
}

.comment-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.comment-empty {
    margin-top: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--el-text-color-placeholder);
}

.detail-actions.action-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 18px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

.detail-actions.action-bar.is-input-expanded {
    align-items: stretch;
}

.action-input {
    flex: 1;
    min-width: 0;
}

.action-input :deep(.el-input__wrapper) {
    border-radius: 999px;
    background: var(--el-fill-color-light);
    box-shadow: none;
    border: 1px solid transparent;
    padding: 0 12px;
    height: 34px;
    transition:
        background 0.16s ease,
        border-color 0.16s ease;
}

.action-input :deep(.el-input__wrapper:hover) {
    background: var(--el-fill-color);
}

.action-input :deep(.el-input__wrapper.is-focus) {
    background: var(--el-bg-color);
    border-color: var(--el-border-color);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
}

.action-input :deep(.el-input__inner) {
    font-size: 14px;
}

.action-input :deep(.el-textarea__inner) {
    border-radius: 14px;
    background: var(--el-fill-color-light);
    border: 1px solid transparent;
    font-size: 14px;
    padding: 10px 12px;
    min-height: 86px;
}

.detail-actions.action-bar.is-input-expanded .action-input :deep(.el-textarea__inner) {
    background: var(--el-bg-color);
    border-color: var(--el-border-color);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
}

.action-icons {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.action-icons.hidden {
    display: none;
}

.action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 32px;
    padding: 0 8px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition:
        background 0.16s ease,
        color 0.16s ease,
        transform 0.16s ease;
    user-select: none;
}

.action-icon :deep(svg) {
    font-size: 18px;
}

.action-icon .num {
    font-size: 12px;
    line-height: 1;
    color: var(--el-text-color-secondary);
}

.action-icon:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}

.action-icon:active {
    transform: scale(0.98);
}

.action-icon.loading,
.action-icon:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.action-icon.active.like {
    color: var(--el-color-danger);
}

.action-icon.active.collect {
    color: var(--el-color-warning);
}

.action-icon.active.like .num,
.action-icon.active.collect .num {
    color: currentColor;
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

    .post-preview-mask {
        padding: 12px;
        align-items: flex-start;
    }

    .post-preview-panel {
        width: 100%;
        border-radius: 18px;
    }

    .preview-close {
        top: 12px;
        left: 12px;
        width: 40px;
        height: 40px;
    }

    .post-preview-body {
        grid-template-columns: 1fr;
        height: auto;
        max-height: none;
    }

    .preview-media-pane {
        min-height: 260px;
    }

    .preview-detail-pane {
        padding: 16px;
        max-height: none;
    }

    .detail-actions.action-bar {
        gap: 10px;
        padding: 10px;
    }

    .action-icon .num {
        display: none;
    }

    .action-icon {
        padding: 0 8px;
    }
}
</style>
