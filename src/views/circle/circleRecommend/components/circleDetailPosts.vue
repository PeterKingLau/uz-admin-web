<template>
    <div v-loading="loadingPosts" class="posts-feed-container">
        <CircleDetailPostCard
            v-for="post in postList"
            :key="post.id"
            :post="post"
            :get-img-url="getImgUrl"
            :format-action-count="formatActionCount"
            @like="handleLike"
            @comment="handleComment"
            @share="handleShare"
            @collect="handleCollect"
        />

        <div v-if="!loadingPosts && postList.length === 0" class="empty-feed">
            <el-empty description="暂无动态" :image-size="140" />
        </div>
    </div>

    <CircleCommentsDialog
        ref="commentDialogRef"
        v-model="commentDialogVisible"
        :post="activeCommentPost"
        :comments="commentDialogComments"
        :loading="commentDialogLoading"
        :submitting="isActiveCommentSubmitting"
        :comment-placeholder="commentPlaceholder"
        :replying-to-name="replyTarget?.replyUserName || ''"
        :get-img-url="getImgUrl"
        :format-time="formatTime"
        :user-avatar="currentUserAvatar"
        :user-name="currentUserName"
        :get-comment-reply-count="getCommentReplyCount"
        :resolve-reply-state="resolveReplyState"
        :can-delete-comment="canDeleteComment"
        :is-delete-comment-loading="isDeleteCommentLoading"
        @submit="handleSubmitComment"
        @reply-comment="handleReplyToComment"
        @reply-reply="handleReplyToReply"
        @toggle-replies="toggleCommentReplies"
        @load-replies="loadCommentReplies"
        @delete-comment="handleDeleteComment"
        @cancel-reply="clearReplyTarget"
    />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue'
import { addComment, bookmarkPost, likePost, repostPost } from '@/api/content/post'
import { deleteComment, listCommentReplies, listTopComments } from '@/api/content/postComment'
import useUserStore from '@/store/modules/user'
import CircleCommentsDialog from './CircleCommentsDialog.vue'
import CircleDetailPostCard from './CircleDetailPostCard.vue'
import type { PostItem } from '@/types/circle'

defineProps<{
    postList: PostItem[]
    loadingPosts: boolean
    getImgUrl: (url: string) => string
    formatTime: (time?: string) => string
    formatActionCount: (num?: number, suffix?: string) => string
}>()

const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()
const currentUserAvatar = computed(() => userStore.avatar)
const currentUserName = computed(() => userStore.nickName || userStore.name || '')

const likeActionLoading = reactive<Record<string, boolean>>({})
const collectActionLoading = reactive<Record<string, boolean>>({})
const commentActionLoading = reactive<Record<string, boolean>>({})
const shareActionLoading = reactive<Record<string, boolean>>({})

const commentDialogVisible = ref(false)
const commentDialogLoading = ref(false)
const commentDialogComments = ref<any[]>([])
const activeCommentPost = ref<PostItem | null>(null)
const commentDialogRef = ref<{ focusInput?: () => void } | null>(null)

type ReplyState = {
    open: boolean
    loading: boolean
    list: any[]
    noMore: boolean
    lastId?: number | string
    lastCreateTime?: string
}

const replyStateMap = ref<Record<string, ReplyState>>({})
const replyTarget = ref<{
    parentId: number | string
    replyUserId: number | string | null
    replyUserName: string
} | null>(null)
const deleteCommentLoading = reactive<Record<string, boolean>>({})
const replyPageSize = 10

const getPostKey = (post: PostItem) => String(post?.id ?? '')
const getTargetUserId = (post: PostItem) =>
    post.authorId ??
    (post as any)?.userId ??
    (post as any)?.author?.id ??
    (post as any)?.user?.id ??
    (post as any)?.createBy ??
    (post as any)?.creatorId ??
    undefined

const isLiked = (post: PostItem) => Boolean(post.isLiked ?? post.like)
const isCollected = (post: PostItem) => Boolean(post.isCollected ?? post.bookmark)

const isLikeLoading = (post: PostItem) => Boolean(likeActionLoading[getPostKey(post)])
const isCollectLoading = (post: PostItem) => Boolean(collectActionLoading[getPostKey(post)])
const isCommentLoading = (post: PostItem) => Boolean(commentActionLoading[getPostKey(post)])
const isShareLoading = (post: PostItem) => Boolean(shareActionLoading[getPostKey(post)])
const isActiveCommentSubmitting = computed(() => {
    const post = activeCommentPost.value
    if (!post) return false
    return isCommentLoading(post)
})
const commentPlaceholder = computed(() => (replyTarget.value ? `回复 @${replyTarget.value.replyUserName}` : '写下你的想法...'))

const handleLike = async (post: PostItem) => {
    const postId = post?.id
    const targetUserId = getTargetUserId(post)
    const key = getPostKey(post)
    if (!postId || !targetUserId || !key || isLikeLoading(post)) return
    likeActionLoading[key] = true
    const wasLiked = isLiked(post)
    try {
        const res = await likePost({ postId, targetUserId })
        const active = res?.data?.active
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
        likeActionLoading[key] = false
    }
}

const handleCollect = async (post: PostItem) => {
    const postId = post?.id
    const targetUserId = getTargetUserId(post)
    const key = getPostKey(post)
    if (!postId || !targetUserId || !key || isCollectLoading(post)) return
    collectActionLoading[key] = true
    const wasCollected = isCollected(post)
    try {
        const res = await bookmarkPost({ postId, targetUserId })
        const active = res?.data?.active
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
        collectActionLoading[key] = false
    }
}

const handleComment = (post: PostItem) => {
    openCommentDialog(post)
}

const handleShare = async (post: PostItem) => {
    const postId = post?.id
    const key = getPostKey(post)
    if (!postId || !key || isShareLoading(post)) return
    let content = ''
    try {
        const res = await proxy?.$modal?.prompt?.('请输入转发内容')
        content = String(res?.value ?? '').trim()
    } catch {
        return
    }
    if (!content) return
    shareActionLoading[key] = true
    try {
        await repostPost({ originalPostId: postId, content })
        if (post.shareCount != null) post.shareCount = Number(post.shareCount || 0) + 1
        if (post.repostCount != null) post.repostCount = Number(post.repostCount || 0) + 1
    } catch (error) {
        console.error(error)
    } finally {
        shareActionLoading[key] = false
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
    if (Array.isArray(response)) return response
    return []
}

const getCommentId = (comment: any) => comment?.id ?? comment?.commentId ?? comment?._id ?? null
const getCommentUserId = (comment: any) => comment?.userId ?? comment?.user?.id ?? comment?.authorId ?? comment?.createBy ?? null
const getCommentName = (comment: any) => comment?.nickName || comment?.userName || comment?.username || comment?.authorName || comment?.user?.nickName || '用户'

const canDeleteComment = (comment: any) => {
    const commentUserId = getCommentUserId(comment)
    if ((userStore as any).id == null || commentUserId == null) return false
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

const ensureReplyState = (commentId: number | string | null): ReplyState | null => {
    if (!commentId) return null
    const stateKey = String(commentId)
    if (!replyStateMap.value[stateKey]) {
        replyStateMap.value[stateKey] = {
            open: false,
            loading: false,
            list: [],
            noMore: true,
            lastId: undefined,
            lastCreateTime: undefined
        }
    }
    return replyStateMap.value[stateKey]
}

const resolveReplyState = (comment: any): ReplyState => {
    const commentId = getCommentId(comment)
    return ensureReplyState(commentId) || { open: false, loading: false, list: [], noMore: true }
}

const clearReplyTarget = () => {
    replyTarget.value = null
}

const focusCommentInput = () => {
    nextTick(() => {
        commentDialogRef.value?.focusInput?.()
    })
}

const resetDeleteCommentLoading = () => {
    Object.keys(deleteCommentLoading).forEach(key => {
        delete deleteCommentLoading[key]
    })
}

const loadCommentList = async (post: PostItem) => {
    const postId = post?.id
    if (!postId) return
    replyStateMap.value = {}
    clearReplyTarget()
    commentDialogLoading.value = true
    try {
        const response = await listTopComments({ postId, limit: 20 })
        const list = normalizeCommentList(response)
        const totalCount = response?.total ?? response?.data?.total ?? response?.count
        commentDialogComments.value = list
        if (Number.isFinite(Number(totalCount))) {
            post.commentCount = Number(totalCount)
        }
    } catch (error) {
        console.error(error)
    } finally {
        commentDialogLoading.value = false
    }
}

const openCommentDialog = async (post: PostItem) => {
    activeCommentPost.value = post
    commentDialogVisible.value = true
    await loadCommentList(post)
}

const toLocalDateTime = (date = new Date()) => {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const handleSubmitComment = async (content: string) => {
    const post = activeCommentPost.value
    if (!post) return
    const postId = post?.id
    const targetUserId = getTargetUserId(post)
    const key = getPostKey(post)
    if (!postId || !targetUserId || !key || isCommentLoading(post)) return
    const parentCommentId = replyTarget.value?.parentId ?? null
    const replyUserId = replyTarget.value?.replyUserId ?? null
    const replyUserName = replyTarget.value?.replyUserName ?? ''
    const draftComment = {
        id: `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        content,
        userId: (userStore as any).id ?? null,
        userName: userStore.nickName || userStore.name || '用户',
        nickName: userStore.nickName || userStore.name || '用户',
        avatar: userStore.avatar || '',
        createTime: toLocalDateTime(),
        parentId: parentCommentId,
        replyUserId,
        replyUserNickName: replyUserName
    }

    post.commentCount = Number(post.commentCount || 0) + 1
    if (parentCommentId) {
        const parent = commentDialogComments.value.find(item => String(getCommentId(item)) === String(parentCommentId))
        if (parent) {
            parent.replyCount = Number(parent.replyCount || 0) + 1
            const state = ensureReplyState(parentCommentId)
            if (state) {
                state.open = true
                state.list = [...state.list, draftComment]
            }
        }
    } else {
        commentDialogComments.value = [draftComment, ...commentDialogComments.value]
    }
    clearReplyTarget()

    commentActionLoading[key] = true
    try {
        await addComment({
            postId,
            targetUserId,
            content,
            parentCommentId: parentCommentId || undefined,
            replyUserId: replyUserId || undefined
        })
        await loadCommentList(post)
    } catch (error) {
        console.error(error)
        await loadCommentList(post)
    } finally {
        commentActionLoading[key] = false
    }
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

const loadCommentReplies = async (comment: any) => {
    const postId = activeCommentPost.value?.id
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
            state.lastId = getCommentId(lastItem) ?? state.lastId
            state.lastCreateTime = String(lastItem?.createTime ?? lastItem?.createDate ?? state.lastCreateTime ?? '')
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

const removeLocalComment = (commentId: string | number, parent?: any) => {
    const post = activeCommentPost.value
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
        return
    }

    const comment = commentDialogComments.value.find(item => String(getCommentId(item)) === targetId)
    const replyCount = comment ? getCommentReplyCount(comment) : 0
    commentDialogComments.value = commentDialogComments.value.filter(item => String(getCommentId(item)) !== targetId)
    delete replyStateMap.value[targetId]
    post.commentCount = Math.max(0, Number(post.commentCount || 0) - (1 + replyCount))
}

const handleDeleteComment = async (comment: any, parent?: any) => {
    const commentId = getCommentId(comment)
    if (!commentId || !canDeleteComment(comment) || isDeleteCommentLoading(comment)) return
    const post = activeCommentPost.value
    if (!post) return

    if (String(commentId).startsWith('local-')) {
        proxy?.$modal?.msgWarning?.('评论正在同步，请稍后重试')
        await loadCommentList(post)
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

watch(
    () => commentDialogVisible.value,
    value => {
        if (!value) {
            commentDialogComments.value = []
            activeCommentPost.value = null
            commentDialogLoading.value = false
            clearReplyTarget()
            replyStateMap.value = {}
            resetDeleteCommentLoading()
        }
    }
)
</script>

<style scoped lang="scss">
.posts-feed-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-bottom: 40px;
}

.empty-feed {
    padding: 40px 0;
    display: flex;
    justify-content: center;
}
</style>
