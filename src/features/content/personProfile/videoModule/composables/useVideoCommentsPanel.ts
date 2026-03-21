import { computed, reactive, ref, watch, type ComputedRef } from 'vue'
import { deleteComment, listCommentReplies, listTopComments } from '@/api/content/postComment'
import { getPostByCollection } from '@/api/content/collection'
import { listPostByApp } from '@/api/content/post'
import { selectFollowNum } from '@/api/content/userFollow'
import { getUserInfoById } from '@/api/system/user'
import { getImgUrl } from '@/utils/img'
import {
    getCommentName,
    getPostId,
    isCollectionVideoPost,
    normalizeCollectionPosts,
    resolveCollectionId,
    resolveCollectionNameFromResponse,
    resolveFollowFlag
} from '../helpers'

type AnyRecord = Record<string, any>

interface UseVideoCommentsPanelOptions {
    visible: ComputedRef<boolean>
    postData: ComputedRef<AnyRecord>
    userInfo: ComputedRef<AnyRecord>
    authorInfo: ComputedRef<AnyRecord>
    authorUserId: ComputedRef<string | number | null>
    authorName: ComputedRef<string>
    authorAvatar: ComputedRef<string>
    currentUserId: ComputedRef<string | number | null>
    proxy: any
    focusCommentInput: () => void
    emitAction: (type: string, payload?: any) => void
    emitSelectCollection: (post: AnyRecord) => void
}

export function useVideoCommentsPanel(options: UseVideoCommentsPanelOptions) {
    const { visible, postData, userInfo, authorInfo, authorUserId, authorName, authorAvatar, currentUserId, proxy, focusCommentInput, emitAction, emitSelectCollection } =
        options

    const commentPanelVisible = ref(false)
    const commentDraft = ref('')
    const commentItems = ref<AnyRecord[]>([])
    const commentLoading = ref(false)
    const commentNoMore = ref(false)
    const commentLastId = ref<number | string | undefined>(undefined)
    const commentLastCreateTime = ref<string | undefined>(undefined)
    const localCommentCount = ref(0)
    const commentRefreshing = ref(false)
    const replyStateMap = ref<Record<string | number, AnyRecord>>({})
    const replyTarget = ref<AnyRecord | null>(null)
    const deleteCommentLoading = reactive<Record<string | number, boolean>>({})

    const repostDialogVisible = ref(false)
    const repostContent = ref('')
    const canSubmitRepost = computed(() => Boolean(repostContent.value.trim()))

    const commentPageSize = 10
    const authorWorksPageSize = 12
    const activePostId = computed(() => getPostId(postData.value))
    const activeCollectionId = computed(() => resolveCollectionId(postData.value))
    const showAuthorWorksTab = computed(() => authorUserId.value != null && authorUserId.value !== '')
    const resolveCollectionName = (post: AnyRecord) =>
        post?.collectionName || post?.postCollectionDto?.collectionName || post?.collection?.name || post?.collection?.title || post?.collectionTitle || ''
    const collectionNameFromApi = ref('')
    const activeCollectionName = computed(() => collectionNameFromApi.value || resolveCollectionName(postData.value))
    const showCollectionTab = computed(() => Boolean(activeCollectionId.value))
    const activePanelTab = ref('comments')
    const collectionPosts = ref<AnyRecord[]>([])
    const collectionLoading = ref(false)
    const collectionLoaded = ref(false)
    const collectionVideoPosts = computed(() => collectionPosts.value.filter(item => isCollectionVideoPost(item)))
    const authorProfile = ref<AnyRecord>({})
    const authorProfileLoading = ref(false)
    const authorProfileLoaded = ref(false)
    const authorStatInfo = ref({ followers: 0 })
    const authorWorksLoading = ref(false)
    const authorWorksLoaded = ref(false)
    const authorWorksNoMore = ref(false)
    const authorWorksLastId = ref<number | string | undefined>(undefined)
    const authorWorksLastCreateTime = ref<string | undefined>(undefined)
    const authorVideoPosts = ref<AnyRecord[]>([])

    const getCommentId = (comment: AnyRecord) => comment?.id ?? comment?.commentId ?? null
    const getCommentUserId = (comment: AnyRecord) => comment?.userId ?? comment?.user?.id ?? comment?.authorId ?? comment?.createBy ?? null
    const canDeleteComment = (comment: AnyRecord) => {
        const userId = currentUserId.value
        const commentUserId = getCommentUserId(comment)
        if (userId == null || commentUserId == null) return false
        return String(userId) === String(commentUserId)
    }
    const isDeleteCommentLoading = (comment: AnyRecord) => {
        const commentId = getCommentId(comment)
        return commentId != null && Boolean(deleteCommentLoading[commentId])
    }
    const commentPlaceholder = computed(() => (replyTarget.value ? `回复 @${replyTarget.value.replyUserName}` : '善语结善缘，恶语伤人心'))

    const currentAuthorFollow = computed(() =>
        resolveFollowFlag(
            postData.value?.follow ??
                postData.value?.isFollow ??
                postData.value?.isFollowing ??
                postData.value?.followed ??
                postData.value?.followStatus ??
                postData.value?.following
        )
    )
    const authorPanelName = computed(() => {
        const profile = authorProfile.value || {}
        const fallback = authorInfo.value || {}
        return (
            profile.nickName ||
            profile.userName ||
            profile.name ||
            fallback.nickName ||
            fallback.userName ||
            fallback.name ||
            authorName.value ||
            '未知用户'
        )
    })
    const authorPanelAvatar = computed(() => {
        const profile = authorProfile.value || {}
        const fallback = authorInfo.value || {}
        const avatar =
            profile.avatar || profile.userAvatar || profile.headImg || fallback.avatar || fallback.userAvatar || fallback.headImg || authorAvatar.value || ''
        return getImgUrl(avatar)
    })
    const authorPanelSignature = computed(() => {
        const profile = authorProfile.value || {}
        const fallback = authorInfo.value || {}
        return String(profile.signature ?? fallback.signature ?? '').trim()
    })
    const authorPanelFollowers = computed(() => Math.max(0, Number(authorStatInfo.value.followers || authorInfo.value?.followers || 0)))
    const authorPanelLikedCount = computed(() => {
        const profile = authorProfile.value || {}
        const fallback = authorInfo.value || {}
        return Math.max(0, Number(profile.likedCount ?? profile.likes ?? fallback.likedCount ?? fallback.likes ?? 0))
    })

    const normalizeResponsePayload = (response: AnyRecord) => response?.data ?? response?.rows ?? response ?? {}
    const resolveAuthorProfilePayload = (response: AnyRecord) => {
        const data = normalizeResponsePayload(response)
        const profile = data?.user ?? data?.profile ?? data?.userInfo ?? data?.userProfile ?? data
        return { data, profile: profile && typeof profile === 'object' ? profile : {} }
    }
    const normalizeAuthorWorkPost = (item: AnyRecord) => {
        const like = resolveFollowFlag(item?.like ?? item?.isLiked ?? item?.liked ?? item?.likeStatus ?? item?.isLike)
        const bookmark = resolveFollowFlag(item?.bookmark ?? item?.isCollected ?? item?.collected ?? item?.collectStatus ?? item?.isCollect)
        const follow = resolveFollowFlag(
            item?.follow ?? item?.isFollow ?? item?.isFollowing ?? item?.followed ?? item?.followStatus ?? item?.following ?? currentAuthorFollow.value
        )
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

    const resetAuthorProfile = () => {
        authorProfile.value = {}
        authorStatInfo.value = { followers: 0 }
        authorProfileLoading.value = false
        authorProfileLoaded.value = false
    }

    const resetAuthorWorks = () => {
        authorVideoPosts.value = []
        authorWorksLoading.value = false
        authorWorksLoaded.value = false
        authorWorksNoMore.value = false
        authorWorksLastId.value = undefined
        authorWorksLastCreateTime.value = undefined
    }

    const ensureReplyState = (commentId: string | number | null) => {
        if (!commentId) return null
        if (!replyStateMap.value[commentId]) {
            replyStateMap.value[commentId] = {
                open: false,
                loading: false,
                noMore: false,
                lastId: undefined,
                lastCreateTime: undefined,
                list: []
            }
        }
        return replyStateMap.value[commentId]
    }

    const resolveReplyState = (comment: AnyRecord) => {
        const commentId = getCommentId(comment)
        return ensureReplyState(commentId) || { open: false, loading: false, noMore: true, list: [] }
    }

    const findCommentById = (commentId: string | number | null) => commentItems.value.find(item => getCommentId(item) === commentId)

    const clearReplyTarget = () => {
        replyTarget.value = null
    }

    const handleReplyToComment = (comment: AnyRecord) => {
        const commentId = getCommentId(comment)
        if (!commentId) return
        replyTarget.value = {
            parentId: commentId,
            replyUserId: comment?.userId ?? comment?.user?.id ?? null,
            replyUserName: getCommentName(comment)
        }
        focusCommentInput()
    }

    const handleReplyToReply = (reply: AnyRecord, parent: AnyRecord) => {
        const parentId = getCommentId(parent)
        if (!parentId) return
        replyTarget.value = {
            parentId,
            replyUserId: reply?.userId ?? reply?.user?.id ?? null,
            replyUserName: getCommentName(reply)
        }
        focusCommentInput()
    }

    const resetComments = () => {
        commentItems.value = []
        commentLoading.value = false
        commentNoMore.value = false
        commentLastId.value = undefined
        commentLastCreateTime.value = undefined
        replyStateMap.value = {}
    }

    const loadTopComments = async ({ reset = false, silent = false }: { reset?: boolean; silent?: boolean } = {}) => {
        const postId = activePostId.value
        if (reset) {
            commentLastId.value = undefined
            commentLastCreateTime.value = undefined
            commentNoMore.value = false
            replyStateMap.value = {}
            if (!silent) commentItems.value = []
        }
        if (!postId) return
        if (!reset && commentNoMore.value) return
        if (silent) {
            if (commentRefreshing.value) return
            commentRefreshing.value = true
        } else {
            if (commentLoading.value || commentRefreshing.value) return
            commentLoading.value = true
        }
        try {
            const res = await listTopComments({
                postId,
                lastId: commentLastId.value,
                lastCreateTime: commentLastCreateTime.value,
                limit: commentPageSize
            })
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.rows) ? res.rows : []
            if (list.length) {
                commentItems.value = reset ? [...list] : [...commentItems.value, ...list]
                const lastItem = list[list.length - 1]
                commentLastId.value = lastItem?.id ?? commentLastId.value
                commentLastCreateTime.value = lastItem?.createTime ?? commentLastCreateTime.value
                if (list.length < commentPageSize) commentNoMore.value = true
            } else {
                if (reset) commentItems.value = []
                commentNoMore.value = true
            }
        } catch (error) {
            console.error(error)
        } finally {
            if (silent) commentRefreshing.value = false
            else commentLoading.value = false
        }
    }

    const loadMoreComments = () => {
        if (activePanelTab.value !== 'comments' || commentLoading.value || commentNoMore.value) return
        loadTopComments()
    }

    const loadReplies = async (comment: AnyRecord) => {
        const postId = activePostId.value
        const parentId = getCommentId(comment)
        if (!postId || !parentId) return
        const state = ensureReplyState(parentId)
        if (!state || state.loading || state.noMore) return
        state.loading = true
        try {
            const res = await listCommentReplies({
                postId,
                parentId,
                lastId: state.lastId,
                lastCreateTime: state.lastCreateTime,
                limit: commentPageSize
            })
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.rows) ? res.rows : []
            if (list.length) {
                state.list = [...state.list, ...list]
                const lastItem = list[list.length - 1]
                state.lastId = lastItem?.id ?? state.lastId
                state.lastCreateTime = lastItem?.createTime ?? state.lastCreateTime
                if (list.length < commentPageSize) state.noMore = true
            } else {
                state.noMore = true
            }
        } catch (error) {
            console.error(error)
        } finally {
            state.loading = false
        }
    }

    const toggleReplies = (comment: AnyRecord) => {
        const commentId = getCommentId(comment)
        const state = ensureReplyState(commentId)
        if (!state) return
        state.open = !state.open
        if (state.open && state.list.length === 0) {
            loadReplies(comment)
        }
    }

    const updateCommentCount = (delta: number) => {
        const next = Number(localCommentCount.value || 0) + delta
        localCommentCount.value = Math.max(0, next)
    }

    const resolveReplyRemoveCount = (commentId: string | number, comment: AnyRecord | undefined) => {
        const rawCount = Number(comment?.replyCount || 0)
        const replyCount = Number.isFinite(rawCount) ? rawCount : 0
        const state = replyStateMap.value?.[commentId]
        const loadedCount = Array.isArray(state?.list) ? state.list.length : 0
        return Math.max(replyCount, loadedCount)
    }

    const removeLocalComment = (commentId: string | number, parent?: AnyRecord) => {
        const targetId = String(commentId)
        if (parent) {
            const parentId = getCommentId(parent)
            const state = ensureReplyState(parentId)
            if (state) {
                state.list = state.list.filter((item: AnyRecord) => String(getCommentId(item)) !== targetId)
            }
            parent.replyCount = Math.max(0, Number(parent.replyCount || 0) - 1)
            updateCommentCount(-1)
        } else {
            const comment = findCommentById(commentId)
            const removeReplies = resolveReplyRemoveCount(targetId, comment)
            commentItems.value = commentItems.value.filter(item => String(getCommentId(item)) !== targetId)
            if (replyStateMap.value?.[targetId]) {
                delete replyStateMap.value[targetId]
            }
            updateCommentCount(-(1 + Math.max(0, removeReplies)))
        }
    }

    const handleDeleteComment = async (comment: AnyRecord, parent?: AnyRecord) => {
        const commentId = getCommentId(comment)
        if (!commentId || !canDeleteComment(comment) || isDeleteCommentLoading(comment)) return
        if (String(commentId).startsWith('local-')) {
            proxy?.$modal?.msgWarning?.('评论正在同步，请稍后重试')
            loadTopComments({ reset: true, silent: true })
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
            await deleteComment({ id: commentId, userId: currentUserId.value ?? undefined })
            removeLocalComment(commentId, parent)
            proxy?.$modal?.msgSuccess?.('删除成功')
        } catch (error) {
            console.error(error)
            proxy?.$modal?.msgError?.('删除失败')
        } finally {
            deleteCommentLoading[commentId] = false
        }
    }

    const isCurrentCollectionPost = (post: AnyRecord) => {
        const id = getPostId(post)
        if (id == null || activePostId.value == null) return false
        return String(id) === String(activePostId.value)
    }

    const loadCollectionPosts = async (force = false) => {
        if (collectionLoading.value) return
        if (!force && collectionLoaded.value) return
        const collectionId = activeCollectionId.value
        if (!collectionId) return
        collectionLoading.value = true
        try {
            const res = await getPostByCollection({ collectionId })
            collectionPosts.value = normalizeCollectionPosts(res)
            const resolvedName = resolveCollectionNameFromResponse(res)
            if (resolvedName) collectionNameFromApi.value = resolvedName
            collectionLoaded.value = true
        } catch (error) {
            console.error(error)
            collectionPosts.value = []
            collectionLoaded.value = false
        } finally {
            collectionLoading.value = false
        }
    }

    const loadAuthorProfile = async (force = false) => {
        const targetUserId = authorUserId.value
        if (!targetUserId) return
        if (authorProfileLoading.value) return
        if (!force && authorProfileLoaded.value) return
        authorProfileLoading.value = true
        try {
            const [profileResult, statResult] = await Promise.allSettled([getUserInfoById(targetUserId), selectFollowNum({ targetUserId })])
            let hasLoaded = false

            if (profileResult.status === 'fulfilled') {
                const { profile } = resolveAuthorProfilePayload(profileResult.value)
                authorProfile.value = profile || {}
                hasLoaded = true
            }

            if (statResult.status === 'fulfilled') {
                const responseData = statResult.value?.data ?? {}
                authorStatInfo.value = {
                    followers: Math.max(0, Number(responseData.fans ?? authorStatInfo.value.followers ?? 0))
                }
                hasLoaded = true
            }

            authorProfileLoaded.value = hasLoaded
        } catch (error) {
            console.error(error)
        } finally {
            authorProfileLoading.value = false
        }
    }

    const loadAuthorWorks = async ({ reset = false }: { reset?: boolean } = {}) => {
        const targetUserId = authorUserId.value
        if (!targetUserId) return
        if (authorWorksLoading.value) return
        if (reset) {
            authorWorksLastId.value = undefined
            authorWorksLastCreateTime.value = undefined
            authorWorksNoMore.value = false
            authorVideoPosts.value = []
        } else if (authorWorksNoMore.value) {
            return
        }
        authorWorksLoading.value = true
        try {
            const res = await listPostByApp({
                limit: authorWorksPageSize,
                targetUserId,
                lastId: authorWorksLastId.value,
                lastCreateTime: authorWorksLastCreateTime.value,
                postType: '3'
            })
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.rows) ? res.rows : []
            const normalizedList = list.filter((item: AnyRecord) => isCollectionVideoPost(item)).map((item: AnyRecord) => normalizeAuthorWorkPost(item))
            authorVideoPosts.value = reset ? normalizedList : [...authorVideoPosts.value, ...normalizedList]
            const lastItem = list[list.length - 1]
            authorWorksLastId.value = lastItem?.id ?? authorWorksLastId.value
            authorWorksLastCreateTime.value = lastItem?.createTime ?? authorWorksLastCreateTime.value
            authorWorksNoMore.value = list.length < authorWorksPageSize
            authorWorksLoaded.value = true
        } catch (error) {
            console.error(error)
        } finally {
            authorWorksLoading.value = false
        }
    }

    const loadMoreAuthorWorks = () => {
        if (activePanelTab.value !== 'authorWorks' || authorWorksLoading.value || authorWorksNoMore.value) return
        loadAuthorWorks()
    }

    const openAuthorWorksPanel = () => {
        if (!showAuthorWorksTab.value) return
        commentPanelVisible.value = true
        activePanelTab.value = 'authorWorks'
        loadAuthorProfile()
        if (!authorWorksLoaded.value || authorVideoPosts.value.length === 0) {
            loadAuthorWorks({ reset: true })
        }
    }

    const openRepostDialog = () => {
        repostContent.value = ''
        repostDialogVisible.value = true
    }

    const submitRepost = () => {
        const content = repostContent.value.trim()
        if (!content) {
            proxy?.$modal?.msgWarning?.('请输入转发内容')
            return
        }
        emitAction('share', { content })
        repostDialogVisible.value = false
    }

    const toggleCommentPanel = () => {
        commentPanelVisible.value = !commentPanelVisible.value
        if (commentPanelVisible.value) {
            focusCommentInput()
            if (activePanelTab.value === 'collection' && showCollectionTab.value) {
                loadCollectionPosts()
            }
            if (activePanelTab.value === 'authorWorks' && showAuthorWorksTab.value) {
                loadAuthorProfile()
                if (!authorWorksLoaded.value || authorVideoPosts.value.length === 0) {
                    loadAuthorWorks({ reset: true })
                }
            }
            return
        }
        clearReplyTarget()
        commentDraft.value = ''
        activePanelTab.value = 'comments'
    }

    const openDetailPanel = () => {
        commentPanelVisible.value = true
        activePanelTab.value = 'detail'
    }

    const submitComment = () => {
        const content = String(commentDraft.value || '').trim()
        if (!content) return
        const now = new Date()
        const parentId = replyTarget.value?.parentId ?? null
        const replyUserId = replyTarget.value?.replyUserId ?? null
        const replyUserName = replyTarget.value?.replyUserName ?? ''
        const draftItem = {
            id: `local-${now.getTime()}`,
            userId: userInfo.value?.id ?? userInfo.value?.userId ?? null,
            content,
            userName: userInfo.value?.nickName || userInfo.value?.userName || '',
            nickName: userInfo.value?.nickName || '',
            createTime: now.toISOString(),
            avatar: userInfo.value?.avatar || '',
            userAvatar: userInfo.value?.avatar || '',
            user: {
                avatar: userInfo.value?.avatar || ''
            }
        }
        if (parentId) {
            const parent = findCommentById(parentId)
            if (parent) {
                parent.replyCount = Number(parent.replyCount || 0) + 1
                const state = ensureReplyState(parentId)
                if (state) {
                    state.open = true
                    state.list = [
                        ...state.list,
                        {
                            ...draftItem,
                            parentId,
                            replyUserId,
                            replyUserNickName: replyUserName
                        }
                    ]
                }
            }
        } else {
            commentItems.value = [draftItem, ...commentItems.value]
        }
        emitAction('comment', {
            content,
            parentCommentId: parentId,
            replyUserId,
            onSuccess: () => loadTopComments({ reset: true, silent: true })
        })
        commentDraft.value = ''
        clearReplyTarget()
    }

    const setPanelTab = (value: string) => {
        if (activePanelTab.value === value) return
        activePanelTab.value = value
        if (value === 'collection' && showCollectionTab.value) {
            loadCollectionPosts()
        }
        if (value === 'authorWorks' && showAuthorWorksTab.value) {
            loadAuthorProfile()
            if (!authorWorksLoaded.value || authorVideoPosts.value.length === 0) {
                loadAuthorWorks({ reset: true })
            }
        }
    }

    const handlePanelTabClick = (tab: AnyRecord) => {
        const next = tab?.props?.name ?? tab?.paneName ?? activePanelTab.value
        setPanelTab(next)
    }

    const handleSelectCollectionPost = (post: AnyRecord) => {
        if (isCurrentCollectionPost(post)) return
        emitSelectCollection(post)
    }

    const resetPanelState = () => {
        commentPanelVisible.value = false
        repostDialogVisible.value = false
        commentDraft.value = ''
        repostContent.value = ''
        clearReplyTarget()
        activePanelTab.value = 'comments'
    }

    watch(
        () => [commentPanelVisible.value, activePostId.value],
        ([open, postId], [, prevPostId]) => {
            if (!postId) return
            if (!open) {
                if (postId !== prevPostId) resetComments()
                return
            }
            if (postId !== prevPostId || commentItems.value.length === 0) {
                loadTopComments({ reset: true })
            }
        }
    )

    watch(
        () => commentPanelVisible.value,
        open => {
            if (!open) {
                clearReplyTarget()
                commentDraft.value = ''
                activePanelTab.value = 'comments'
            } else if (activePanelTab.value === 'authorWorks' && showAuthorWorksTab.value) {
                loadAuthorProfile()
                if (!authorWorksLoaded.value || authorVideoPosts.value.length === 0) {
                    loadAuthorWorks({ reset: true })
                }
            }
        }
    )

    watch(
        () => activeCollectionId.value,
        () => {
            collectionPosts.value = []
            collectionLoaded.value = false
            collectionNameFromApi.value = ''
            if (!showCollectionTab.value) activePanelTab.value = 'comments'
        }
    )

    watch(
        () => authorUserId.value,
        () => {
            resetAuthorProfile()
            resetAuthorWorks()
            if (!showAuthorWorksTab.value && activePanelTab.value === 'authorWorks') {
                activePanelTab.value = 'comments'
                return
            }
            if (commentPanelVisible.value && activePanelTab.value === 'authorWorks' && showAuthorWorksTab.value) {
                loadAuthorProfile()
                loadAuthorWorks({ reset: true })
            }
        }
    )

    watch(
        () => [activePostId.value, postData.value?.commentCount],
        ([, count]) => {
            const next = Number(count ?? 0)
            localCommentCount.value = Number.isFinite(next) ? next : 0
        },
        { immediate: true }
    )

    watch(
        () => visible.value,
        nextVisible => {
            if (!nextVisible) {
                resetPanelState()
            }
        }
    )

    return {
        commentPanelVisible,
        commentDraft,
        commentItems,
        commentLoading,
        commentNoMore,
        localCommentCount,
        commentPlaceholder,
        replyTarget,
        repostDialogVisible,
        repostContent,
        canSubmitRepost,
        activePanelTab,
        showAuthorWorksTab,
        authorPanelName,
        authorPanelAvatar,
        authorPanelSignature,
        authorPanelFollowers,
        authorPanelLikedCount,
        authorWorksLoading,
        authorWorksNoMore,
        authorVideoPosts,
        activeCollectionName,
        showCollectionTab,
        collectionLoading,
        collectionVideoPosts,
        canDeleteComment,
        resolveReplyState,
        loadMoreComments,
        loadMoreAuthorWorks,
        handleReplyToComment,
        handleReplyToReply,
        toggleReplies,
        loadReplies,
        handleDeleteComment,
        clearReplyTarget,
        openRepostDialog,
        submitRepost,
        toggleCommentPanel,
        openDetailPanel,
        openAuthorWorksPanel,
        submitComment,
        handlePanelTabClick,
        handleSelectCollectionPost,
        isCurrentCollectionPost
    }
}
