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
                    @edit-tag="handleEditTag"
                    @pin="handlePin"
                    @unpin="handleUnpin"
                />

                <el-empty v-else description="暂无内容" :image-size="100" />
            </div>

            <el-dialog v-model="editTagVisible" title="编辑标签" width="520px" @closed="resetEditTag">
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

        <div v-if="previewVisible" class="post-preview-mask" @click.self="closePreview">
            <button type="button" class="preview-close" @click="closePreview" aria-label="关闭">
                <Icon icon="mdi:close" />
            </button>

            <div class="post-preview-panel">
                <div v-if="previewPost" class="post-preview-body">
                    <div class="preview-media-pane">
                        <el-carousel v-if="previewMediaList.length > 1" height="100%" :autoplay="false" indicator-position="outside" class="preview-carousel">
                            <el-carousel-item v-for="(url, index) in previewMediaList" :key="`${previewPost.id}-${index}`">
                                <el-image :src="url" fit="contain" class="preview-media-img" />
                            </el-carousel-item>
                        </el-carousel>
                        <el-image v-else-if="previewMediaList.length === 1" :src="previewMediaList[0]" fit="contain" class="preview-media-img single" />
                        <div v-else class="preview-media-empty">暂无图片</div>
                    </div>

                    <div class="preview-detail-pane">
                        <div class="detail-header">
                            <div class="author-block">
                                <el-avatar :size="36" :src="resolveAvatar(previewPost.avatar)">
                                    {{ previewPost.nickName?.charAt(0).toUpperCase() || 'U' }}
                                </el-avatar>
                                <div class="author-meta">
                                    <div class="name">{{ previewPost.nickName || '未知用户' }}</div>
                                    <div class="time">{{ previewPost.createTime || '-' }}</div>
                                </div>
                            </div>
                            <el-button
                                round
                                size="small"
                                class="follow-btn"
                                :class="{ 'is-following': isPreviewFollowing }"
                                :loading="followActionLoading"
                                :disabled="isPreviewAuthorSelf"
                                @click="handlePreviewFollow"
                            >
                                {{ isPreviewFollowing ? '已关注' : '关注' }}
                            </el-button>
                        </div>

                        <div class="detail-content">
                            <div v-if="previewPost.content" class="detail-text">{{ previewPost.content }}</div>
                            <div v-else class="detail-text empty">（无正文内容）</div>
                        </div>

                        <div v-if="previewTags.length" class="detail-tags">
                            <span v-for="tag in previewTags" :key="tag" class="detail-tag">#{{ tag }}</span>
                        </div>

                        <div class="detail-meta">
                            <span>{{ previewPost.createTime || '-' }}</span>
                            <span>评论 {{ previewPost.commentCount ?? 0 }}</span>
                        </div>

                        <el-divider class="detail-divider" />

                        <div class="detail-comments">
                            <div class="comment-count">共 {{ previewPost.commentCount ?? 0 }} 条评论</div>
                            <div v-if="previewComments.length" class="comment-list">
                                <div v-for="item in previewComments" :key="item.id || item.commentId || item._id" class="comment-item">
                                    <el-avatar :size="28" :src="resolveAvatar(item.avatar)" />
                                    <div class="comment-body">
                                        <div class="comment-user">{{ item.nickName || item.userName || item.username || '用户' }}</div>
                                        <div class="comment-text">{{ item.content || item.comment || '-' }}</div>
                                        <div class="comment-time">{{ item.createTime || item.time || '-' }}</div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="comment-empty">
                                <Icon icon="mdi:sofa-outline" />
                                <span>暂无评论，快来抢沙发~</span>
                            </div>
                        </div>

                        <div class="detail-actions action-bar" :class="{ 'is-input-expanded': isActionInputExpanded }">
                            <div class="action-input">
                                <el-input
                                    ref="commentInputRef"
                                    v-model="commentDraft"
                                    class="action-input-inner"
                                    :type="isActionInputExpanded ? 'textarea' : 'text'"
                                    :rows="isActionInputExpanded ? 3 : 1"
                                    maxlength="200"
                                    placeholder="说点什么..."
                                    @keydown.enter.exact.prevent="submitPreviewComment"
                                    @focus="isActionInputFocused = true"
                                    @blur="handleActionInputBlur"
                                />
                            </div>

                            <div class="action-icons" :class="{ hidden: isActionInputExpanded }">
                                <button
                                    type="button"
                                    class="action-icon like"
                                    :class="{ active: isPreviewLiked, loading: likeActionLoading }"
                                    :disabled="likeActionLoading"
                                    @click="handlePreviewAction('like')"
                                    aria-label="点赞"
                                >
                                    <Icon :icon="isPreviewLiked ? 'mdi:heart' : 'mdi:heart-outline'" />
                                    <span class="num">{{ previewPost?.likeCount ?? 0 }}</span>
                                </button>

                                <button
                                    type="button"
                                    class="action-icon collect"
                                    :class="{ active: isPreviewCollected, loading: bookmarkActionLoading }"
                                    :disabled="bookmarkActionLoading"
                                    @click="handlePreviewAction('collect')"
                                    aria-label="收藏"
                                >
                                    <Icon :icon="isPreviewCollected ? 'mdi:star' : 'mdi:star-outline'" />
                                    <span class="num">{{ previewPost?.bookmarkCount ?? 0 }}</span>
                                </button>

                                <button type="button" class="action-icon comment" @click="focusCommentInput" aria-label="评论">
                                    <Icon icon="mdi:comment-outline" />
                                    <span class="num">{{ previewPost?.commentCount ?? 0 }}</span>
                                </button>

                                <button
                                    type="button"
                                    class="action-icon share"
                                    :class="{ loading: repostActionLoading }"
                                    :disabled="repostActionLoading"
                                    @click="handlePreviewAction('share')"
                                    aria-label="转发"
                                >
                                    <Icon icon="mdi:share-variant-outline" />
                                    <span class="num">{{ previewPost?.repostCount ?? 0 }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup name="ContentList" lang="ts">
import { ref, reactive, computed, onMounted, onActivated, onBeforeUnmount, getCurrentInstance, nextTick, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import ContentQueryForm from './components/ContentQueryForm.vue'
import FeedList from './components/FeedList.vue'
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
import { getInterestAll } from '@/api/content/interest'
import { toggleFollowUser } from '@/api/content/userFollow'
import { useEnumOptions } from '@/hooks/useEnumOptions'
import modal from '@/plugins/modal'
import useUserStore from '@/store/modules/user'

const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()

const queryParams = reactive<{
    postType?: string
    content: string
    tagId?: number | string
    lastId?: number
    lastCreateTime?: string
    limit: number
}>({
    postType: undefined,
    content: '',
    tagId: undefined,
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
const followActionLoading = ref(false)
const likeActionLoading = ref(false)
const bookmarkActionLoading = ref(false)
const commentActionLoading = ref(false)
const repostActionLoading = ref(false)
const commentDraft = ref('')
const commentInputRef = ref<any | null>(null)
const isActionInputFocused = ref(false)

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

const allowedPostTypes = ['1', '2', '3']
const postTypeOptions = useEnumOptions('POST_TYPE', { includeKeys: allowedPostTypes })
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

const previewMediaList = computed(() => normalizeMediaList(previewPost.value).map(resolveMediaUrl).filter(Boolean))

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

const buildPreviewComment = (content: string) => ({
    id: `local-${Date.now()}`,
    content,
    nickName: userStore.nickName || (userStore as any).name || '我',
    avatar: userStore.avatar || '',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
})

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
            const fallback = allowedPostTypes.join(',')
            if (value === undefined || value === null || value === '') return fallback
            const normalized = String(value)
            return allowedPostTypes.includes(normalized) ? normalized : fallback
        }

        const params = {
            postType: resolvePostType(queryParams.postType),
            content: queryParams.content?.trim() || undefined,
            tagId: queryParams.tagId || undefined,
            lastId: queryParams.lastId,
            lastCreateTime: queryParams.lastCreateTime,
            limit: queryParams.limit
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

        if (!isLoadMore) postList.value = records
        else postList.value = postList.value.concat(records)

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
    if (type !== '2') return
    previewPost.value = post
    previewVisible.value = true
}

function resetPreview() {
    previewPost.value = null
    commentDraft.value = ''
}

function closePreview() {
    previewVisible.value = false
    resetPreview()
}

function focusCommentInput() {
    nextTick(() => {
        commentInputRef.value?.focus?.()
    })
}

function handleActionInputBlur() {
    isActionInputFocused.value = false
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
    commentActionLoading.value = true
    try {
        await addComment({ postId, targetUserId, content })
        post.commentCount = Number(post.commentCount || 0) + 1
        appendPreviewComment(post, buildPreviewComment(content))
        commentDraft.value = ''
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
        await (proxy as any)?.$modal?.confirm(isBatch ? `确认删除选中的 ${ids.length} 条帖子？` : '确认删除该条内容吗？删除后不可恢复。')
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

watch(previewVisible, visible => {
    isBodyScrollLocked.value = visible
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
    z-index: 3000;
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
