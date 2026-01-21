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
            @select-collection="handleSelectCollectionPost"
        />
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addComment, bookmarkPost, likePost, repostPost } from '@/api/content/post'
import { toggleFollowUser } from '@/api/content/userFollow'
import cache from '@/plugins/cache'
import modal from '@/plugins/modal'
import useUserStore from '@/store/modules/user'
import { getImgUrl } from '@/utils/img'
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
const repostActionLoading = reactive({})

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

const parseMediaRaw = raw => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed) return []
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed)
                return Array.isArray(parsed) ? parsed : [parsed]
            } catch {
                return trimmed
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean)
            }
        }
        return trimmed
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    }
    if (typeof raw === 'object') return [raw]
    return []
}

const resolveMediaUrl = url => (url ? getImgUrl(url) : '')
const isVideoUrl = url => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(url || '')

const resolveVideoSrc = post => {
    if (!post) return ''
    const direct = post.videoUrl || post.video || post.url || post.src || ''
    if (direct) return resolveMediaUrl(direct)
    const list = [
        ...parseMediaRaw(post.mediaUrls),
        ...parseMediaRaw(post.mediaList),
        ...parseMediaRaw(post.files),
        ...parseMediaRaw(post.resources)
    ]
    const normalized = list
        .map(item => {
            if (typeof item === 'string') return item
            return item?.url || item?.src || item?.path || item?.fileUrl || ''
        })
        .filter(Boolean)
    const candidate = normalized.find(isVideoUrl) || normalized[0] || ''
    return resolveMediaUrl(candidate)
}

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

const resolveFollowFlag = value => {
    if (typeof value === 'boolean') return value
    return value != null ? String(value) === '1' : false
}

const setFollowState = (post, nextFollowing) => {
    if (!post) return
    post.follow = nextFollowing
    post.isFollow = nextFollowing
    post.isFollowing = nextFollowing
    post.followed = nextFollowing
    post.followStatus = nextFollowing ? '1' : '0'
}

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

const isRepostActionLoading = post => {
    const postId = getPostId(post)
    if (postId == null) return false
    return Boolean(repostActionLoading[postId])
}

const handleAction = async (type, payload) => {
    if (type === 'follow') {
        const post = currentPost.value || {}
        const targetUserId = getPostTargetUserId(post)
        if (!targetUserId) return
        try {
            await toggleFollowUser({ targetUserId })
            const wasFollowing = resolveFollowFlag(post.follow ?? post.isFollow ?? post.isFollowing ?? post.followed ?? post.followStatus ?? post.following)
            setFollowState(post, !wasFollowing)
        } catch (error) {
            console.error(error)
        }
    }
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
            const res = await addComment({ postId, targetUserId, content, parentCommentId, replyUserId })
            post.commentCount = Number(post.commentCount || 0) + 1
            payload?.onSuccess?.(res)
        } catch (error) {
            console.error(error)
        } finally {
            commentActionLoading[postId] = false
        }
    }
    if (type === 'share') {
        const post = currentPost.value || {}
        const postId = getPostId(post)
        if (!postId || isRepostActionLoading(post)) return
        let content = String(payload?.content ?? '').trim()
        if (!content) {
            try {
                const res = await modal.prompt('请输入转发内容')
                content = String(res?.value ?? '').trim()
            } catch (error) {
                return
            }
        }
        if (!content) return
        repostActionLoading[postId] = true
        try {
            await repostPost({ originalPostId: postId, content })
            post.shareCount = Number(post.shareCount || 0) + 1
        } catch (error) {
            console.error(error)
        } finally {
            repostActionLoading[postId] = false
        }
    }
}

const handleSelectCollectionPost = post => {
    const nextId = getPostId(post)
    const currentId = getPostId(currentPost.value)
    if (!nextId || (currentId != null && String(nextId) === String(currentId))) return
    const nextSrc = resolveVideoSrc(post)
    if (!nextSrc) return
    currentPost.value = { ...(post || {}) }
    currentVideoSrc.value = nextSrc
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
    background: var(--el-color-black);
}
</style>
