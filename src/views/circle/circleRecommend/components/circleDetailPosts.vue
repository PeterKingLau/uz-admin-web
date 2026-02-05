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
        v-model="commentDialogVisible"
        :post="activeCommentPost"
        :comments="commentDialogComments"
        :loading="commentDialogLoading"
        :get-img-url="getImgUrl"
        :format-time="formatTime"
        :user-avatar="currentUserAvatar"
        :user-name="currentUserName"
        @submit="handleSubmitComment"
    />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue'
import { addComment, bookmarkPost, likePost, repostPost } from '@/api/content/post'
import { listTopComments } from '@/api/content/postComment'
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

const resolveCommentList = (raw: any) => {
    if (!raw) return []
    if (Array.isArray(raw?.records)) return raw.records
    if (Array.isArray(raw?.list)) return raw.list
    if (Array.isArray(raw?.items)) return raw.items
    if (Array.isArray(raw)) return raw
    return []
}

const loadCommentList = async (post: PostItem) => {
    const postId = post?.id
    if (!postId) return
    commentDialogLoading.value = true
    try {
        const res = await listTopComments({ postId, limit: 20 })
        const raw = (res as any)?.data ?? res
        commentDialogComments.value = resolveCommentList(raw)
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

const buildLocalComment = (content: string) => ({
    id: `local-${Date.now()}`,
    content,
    createTime: new Date().toISOString(),
    userName: userStore.nickName || userStore.name || '用户',
    userAvatar: userStore.avatar
})

const handleSubmitComment = async (content: string) => {
    const post = activeCommentPost.value
    if (!post) return
    const postId = post?.id
    const targetUserId = getTargetUserId(post)
    const key = getPostKey(post)
    if (!postId || !targetUserId || !key || isCommentLoading(post)) return
    commentActionLoading[key] = true
    try {
        await addComment({ postId, targetUserId, content })
        post.commentCount = Number(post.commentCount || 0) + 1
        commentDialogComments.value = [buildLocalComment(content), ...commentDialogComments.value]
    } catch (error) {
        console.error(error)
    } finally {
        commentActionLoading[key] = false
    }
}

watch(
    () => commentDialogVisible.value,
    value => {
        if (!value) {
            commentDialogComments.value = []
            activeCommentPost.value = null
            commentDialogLoading.value = false
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
