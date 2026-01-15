<template>
    <div class="video-player-page">
        <VideoModule
            v-if="ready"
            v-model="visible"
            :src="currentVideoSrc"
            :post="currentPost"
            :user-info="currentUserInfo"
            :use-teleport="false"
            @close="handleClose"
            @action="handleAction"
        />
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addComment, bookmarkPost, likePost } from '@/api/content/post'
import cache from '@/plugins/cache'
import modal from '@/plugins/modal'
import useUserStore from '@/store/modules/user'
import VideoModule from '@/views/content/personProfile/components/VideoModule/index.vue'

const VIDEO_PLAYER_CACHE_KEY = 'video-player-payload'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const visible = ref(true)
const currentPost = ref({})
const currentVideoSrc = ref('')
const currentUserInfo = ref({})
const fromPath = ref('')

const likeActionLoading = reactive({})
const bookmarkActionLoading = reactive({})
const commentActionLoading = reactive({})

const ready = computed(() => Boolean(currentVideoSrc.value))

const resolveFallbackUser = () => ({
    id: userStore.id,
    userId: userStore.id,
    nickName: userStore.nickName,
    userName: userStore.name,
    avatar: userStore.avatar
})

const fallbackPath = computed(() => {
    const from = route.query.from
    return typeof from === 'string' && from ? from : '/index'
})

const loadPayload = () => {
    const rawId = route.params.id
    const postId = Array.isArray(rawId) ? rawId[0] : rawId
    if (postId == null || postId === '') {
        currentUserInfo.value = resolveFallbackUser()
        return false
    }
    const cacheKey = `${VIDEO_PLAYER_CACHE_KEY}:${postId}`
    const cached = cache.session.getJSON(cacheKey)
    if (!cached || typeof cached !== 'object') {
        currentUserInfo.value = resolveFallbackUser()
        return false
    }
    currentPost.value = cached.post ? { ...cached.post } : {}
    currentVideoSrc.value = cached.src || ''
    currentUserInfo.value = cached.userInfo && Object.keys(cached.userInfo).length > 0 ? cached.userInfo : resolveFallbackUser()
    fromPath.value = cached.from || ''
    return Boolean(currentVideoSrc.value)
}

const handleClose = () => {
    visible.value = false
    router.replace(fromPath.value || fallbackPath.value)
}

const getPostId = post => post?.postId ?? post?.id ?? null

const getPostTargetUserId = post =>
    post?.targetUserId ??
    post?.userId ??
    post?.authorId ??
    post?.createBy ??
    post?.user?.id ??
    post?.author?.id ??
    currentUserInfo.value?.id ??
    currentUserInfo.value?.userId ??
    null

const isLikeActionLoading = post => {
    const postId = getPostId(post)
    if (postId == null) return false
    return Boolean(likeActionLoading[postId])
}

const isBookmarkActionLoading = post => {
    const postId = getPostId(post)
    if (postId == null) return false
    return Boolean(bookmarkActionLoading[postId])
}

const isCommentActionLoading = post => {
    const postId = getPostId(post)
    if (postId == null) return false
    return Boolean(commentActionLoading[postId])
}

const handleAction = async (type, payload) => {
    if (type === 'like') {
        const post = currentPost.value || {}
        const postId = getPostId(post)
        const targetUserId = getPostTargetUserId(post)
        if (!postId || !targetUserId || isLikeActionLoading(post)) return
        likeActionLoading[postId] = true
        const wasLiked = Boolean(post.isLiked ?? post.like)
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
            likeActionLoading[postId] = false
        }
    }
    if (type === 'collect') {
        const post = currentPost.value || {}
        const postId = getPostId(post)
        const targetUserId = getPostTargetUserId(post)
        if (!postId || !targetUserId || isBookmarkActionLoading(post)) return
        bookmarkActionLoading[postId] = true
        const wasCollected = Boolean(post.isCollected ?? post.bookmark)
        try {
            const res = await bookmarkPost({ postId, targetUserId })
            const active = res?.data?.active
            const nextCollected = typeof active === 'boolean' ? active : !wasCollected
            if (nextCollected !== wasCollected) {
                post.isCollected = nextCollected
                post.bookmark = nextCollected
                const nextCount = Number(post.bookmarkCount || post.collectCount || 0) + (nextCollected ? 1 : -1)
                post.bookmarkCount = Math.max(0, nextCount)
                if (post.collectCount != null) post.collectCount = post.bookmarkCount
            }
        } catch (error) {
            console.error(error)
        } finally {
            bookmarkActionLoading[postId] = false
        }
    }
    if (type === 'comment') {
        const post = currentPost.value || {}
        const postId = getPostId(post)
        const targetUserId = getPostTargetUserId(post)
        if (!postId || !targetUserId || isCommentActionLoading(post)) return
        const parentCommentId = payload?.parentCommentId
        const replyUserId = payload?.replyUserId
        let content = String(payload?.content ?? '').trim()
        if (!content) {
            try {
                const res = await modal.prompt('Please enter a comment')
                content = String(res?.value ?? '').trim()
            } catch (error) {
                return
            }
        }
        if (!content) return
        commentActionLoading[postId] = true
        try {
            await addComment({ postId, targetUserId, content, parentCommentId, replyUserId })
            post.commentCount = Number(post.commentCount || 0) + 1
        } catch (error) {
            console.error(error)
        } finally {
            commentActionLoading[postId] = false
        }
    }
}

onMounted(() => {
    if (!loadPayload()) {
        handleClose()
    }
})
</script>

<style scoped lang="scss">
.video-player-page {
    width: 100%;
    min-height: 100vh;
    background: #000;
}
</style>
