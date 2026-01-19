<template>
    <div class="app-container user-profile-page">
        <div class="profile-header">
            <div class="banner">
                <img :src="userInfo.bgImage || defaultBg" alt="banner" />
                <div class="banner-mask"></div>
            </div>
            <div class="user-info-wrapper">
                <div class="avatar-container">
                    <el-avatar :size="100" :src="userInfo.avatar" class="avatar-img" />
                </div>
                <div class="info-content">
                    <div class="name-row">
                        <span class="nickname">{{ userInfo.nickName }}</span>
                        <div class="tags">
                            <el-tag size="small" effect="plain" round v-if="userInfo.age" class="gender-tag">
                                <Icon icon="ep:male" v-if="isMaleSex(userInfo.sex)" />
                                <Icon icon="ep:female" v-else-if="isFemaleSex(userInfo.sex)" />
                                {{ userInfo.age }}岁
                            </el-tag>
                            <el-tag size="small" type="info" effect="plain" round v-if="userInfo.location" class="location-tag">
                                <Icon icon="ep:location" /> {{ userInfo.location }}
                            </el-tag>
                        </div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-item" @click="openFollowDialog('following')">
                            <span class="num">{{ userInfo.following || 0 }}</span>
                            <span class="label">关注</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item" @click="openFollowDialog('followers')">
                            <span class="num">{{ userInfo.followers || 0 }}</span>
                            <span class="label">粉丝</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item" @click="openFollowDialog('mutual')">
                            <span class="num">{{ userInfo.mutualCount || 0 }}</span>
                            <span class="label">互关</span>
                        </div>
                    </div>
                    <div class="desc-row">
                        <p>{{ userInfo.signature || '暂时还没想到个性签名' }}</p>
                    </div>
                </div>
                <div class="action-btn">
                    <el-button type="primary" plain class="edit-btn" @click="goToProfile">编辑资料</el-button>
                </div>
            </div>
        </div>

        <ContentModule
            v-model="activeTab"
            :total="total"
            :like-count="likeTotal"
            :bookmark-count="bookmarkTotal"
            :post-list="postList"
            :collection-list="collectionList"
            :collection-loading="collectionLoading"
            :loading="loading"
            :no-more="noMore"
            :get-cover="getCover"
            :get-video-url="getVideoUrl"
            @tab-click="handleTabClick"
            @load-more="loadMore"
            @preview="handlePreview"
            @works-filter-change="handleWorksFilterChange"
            @create-collection="handleCreateCollection"
        />

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
                                :loading="previewFollowLoading"
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

        <el-dialog v-model="followDialogVisible" width="540px" append-to-body destroy-on-close class="follow-dialog custom-dialog-theme">
            <template #header>
                <div class="dialog-header-title">用户列表</div>
            </template>
            <div class="follow-dialog-body">
                <div class="sticky-tabs-header">
                    <el-tabs v-model="followActiveTab" class="follow-tabs" :stretch="true" @tab-click="handleFollowTabClick">
                        <el-tab-pane name="following">
                            <template #label>
                                <div class="tab-label">
                                    <span class="text">关注</span>
                                    <span class="count-badge" v-show="followStats.following > 0">{{ followStats.following }}</span>
                                </div>
                            </template>
                        </el-tab-pane>
                        <el-tab-pane name="followers">
                            <template #label>
                                <div class="tab-label">
                                    <span class="text">粉丝</span>
                                    <span class="count-badge" v-show="followStats.followers > 0">{{ followStats.followers }}</span>
                                </div>
                            </template>
                        </el-tab-pane>
                        <el-tab-pane name="mutual">
                            <template #label>
                                <div class="tab-label">
                                    <span class="text">互关</span>
                                    <span class="count-badge" v-show="followStats.mutualCount > 0">{{ followStats.mutualCount }}</span>
                                </div>
                            </template>
                        </el-tab-pane>
                    </el-tabs>
                </div>

                <div class="follow-list" ref="followListRef">
                    <div v-for="item in followList" :key="item.id || item.userId" class="follow-user-row">
                        <div class="left-section">
                            <el-avatar :size="48" :src="item.avatar" class="row-avatar">
                                {{ item.nickName?.charAt(0)?.toUpperCase() || 'U' }}
                            </el-avatar>
                        </div>

                        <div class="middle-section">
                            <div class="info-top">
                                <span class="nickname" :title="item.nickName">{{ item.nickName || '用户' }}</span>
                                <div class="user-badges">
                                    <Icon v-if="isMaleSex(item.sex)" icon="ep:male" class="gender-icon male" />
                                    <Icon v-else-if="isFemaleSex(item.sex)" icon="ep:female" class="gender-icon female" />
                                    <el-tag v-if="followActiveTab === 'mutual'" size="small" type="success" effect="dark" class="mini-tag">互关</el-tag>
                                </div>
                            </div>
                            <div class="info-bottom" :title="item.signature">
                                {{ item.signature || '这个人很懒，什么都没有写' }}
                            </div>
                        </div>

                        <div class="right-section">
                            <el-button
                                :type="item.isFollowing ? 'info' : 'primary'"
                                :plain="item.isFollowing"
                                :class="['action-btn', { 'is-following': item.isFollowing }]"
                                size="small"
                                round
                                :loading="isFollowActionLoading(item)"
                                @click.stop="toggleFollow(item)"
                            >
                                {{ item.isFollowing ? '已关注' : '关注' }}
                            </el-button>
                        </div>
                    </div>

                    <div v-if="followLoading" class="loading-state">
                        <el-icon class="is-loading"><Loading /></el-icon> 加载中...
                    </div>

                    <div v-if="followNoMore && followList.length > 0" class="no-more-state">- 暂时没有更多了 -</div>

                    <el-empty v-if="!followLoading && followList.length === 0" description="暂无相关用户" :image-size="100" />
                    <div ref="followTriggerRef" class="follow-load-trigger" aria-hidden="true"></div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { addComment, bookmarkPost, likePost, listPostByApp, listPostByBookMark, listPostByLike, repostPost } from '@/api/content/post'
import { addCollection, listMyCollections } from '@/api/content/collection'
import { listFollowers, listFollowing, listMutual, selectFollowNum, toggleFollowUser } from '@/api/content/userFollow'
import { getUserProfile } from '@/api/system/user'
import useUserStore from '@/store/modules/user'
import { getImgUrl } from '@/utils/img'
import { POST_TYPE } from '@/utils/enum'
import ContentModule from './components/ContentModule/index.vue'
import defaultBg from '@/assets/images/bg_profile.jpeg'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const VIDEO_PLAYER_CACHE_KEY = 'video-player-payload'

const activeTab = ref('works')
const loading = ref(false)
const noMore = ref(false)
const total = ref(0)
const likeTotal = ref(0)
const bookmarkTotal = ref(0)
const postList = ref([])
const collectionList = ref([])
const collectionLoading = ref(false)
const createCollectionLoading = ref(false)
const profileInfo = ref({})
const followStats = ref({
    following: 0,
    followers: 0,
    mutualCount: 0
})

const previewVisible = ref(false)
const previewPost = ref(null)
const previewFollowLoading = ref(false)
const likeActionLoading = ref(false)
const bookmarkActionLoading = ref(false)
const commentActionLoading = ref(false)
const repostActionLoading = ref(false)
const commentDraft = ref('')
const commentInputRef = ref(null)
const isActionInputFocused = ref(false)

const followDialogVisible = ref(false)
const followActiveTab = ref('following')
const followList = ref([])
const followLoading = ref(false)
const followNoMore = ref(false)
const followListRef = ref(null)
const followTriggerRef = ref(null)
const followLastId = ref(undefined)
const followPageSize = 20
const followTabSet = new Set(['following', 'followers', 'mutual'])
const followRequestId = ref(0)
const followActionLoading = reactive({})
let followObserver = null

const queryParams = reactive({
    pageNum: 1,
    limit: 15,
    targetUserId: null,
    lastId: undefined,
    lastCreateTime: undefined,
    postType: undefined
})

const allowedPostTypes = [String(POST_TYPE.TEXT), String(POST_TYPE.IMAGE), String(POST_TYPE.VIDEO)]
const allowedPostTypeSet = new Set(allowedPostTypes)
const resolvePostType = value => {
    const fallback = allowedPostTypes.join(',')
    if (value === undefined || value === null || value === '') return fallback
    const normalized = String(value)
    return allowedPostTypeSet.has(normalized) ? normalized : fallback
}
const isBodyScrollLocked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const clampStats = (following, followers, mutualCount) => {
    const followingCount = Math.max(0, Number(following) || 0)
    const followerCount = Math.max(0, Number(followers) || 0)
    const mutualCountValue = Math.max(0, Number(mutualCount) || 0)
    return { following: followingCount, followers: followerCount, mutualCount: Math.min(mutualCountValue, followingCount, followerCount) }
}

const normalizeSexValue = value => {
    if (value === null || value === undefined) return ''
    return String(value)
}

const isMaleSex = value => normalizeSexValue(value) === '0'
const isFemaleSex = value => normalizeSexValue(value) === '1'

const userInfo = computed(() => {
    const profile = profileInfo.value || {}
    const avatar = profile.avatar ? getImgUrl(profile.avatar) : userStore.avatar || ''
    const stats = clampStats(followStats.value.following, followStats.value.followers, followStats.value.mutualCount)
    return {
        ...profile,
        nickName: profile.nickName || userStore.nickName || '未知用户',
        avatar,
        following: stats.following,
        followers: stats.followers,
        mutualCount: stats.mutualCount,
        likes: profile.likes ?? 0,
        likedCount: profile.likedCount ?? 0
    }
})

const normalizeFollowTab = value => (followTabSet.has(value) ? value : 'following')

const followApiMap = {
    following: listFollowing,
    followers: listFollowers,
    mutual: listMutual
}

const resolveFollowState = (item, activeTab) => {
    if (typeof item?.isFollowing === 'boolean') return item.isFollowing
    if (typeof item?.isFollow === 'boolean') return item.isFollow
    if (typeof item?.followed === 'boolean') return item.followed
    if (typeof item?.followStatus === 'boolean') return item.followStatus
    if (item?.followStatus != null) return String(item.followStatus) === '1'
    if (item?.isFollowing != null) return String(item.isFollowing) === '1'
    if (item?.isFollow != null) return String(item.isFollow) === '1'
    if (item?.followed != null) return String(item.followed) === '1'
    const relation = String(item?.relationType || '').toUpperCase()
    if (relation === 'MUTUAL' || relation === 'FOLLOWING') return true
    if (relation === 'FOLLOWER') return false
    return activeTab === 'following' || activeTab === 'mutual'
}

const normalizeFollowList = (list, activeTab) =>
    list.map(item => ({
        ...item,
        avatar: getImgUrl(item.avatar || ''),
        isFollowing: resolveFollowState(item, activeTab)
    }))

const getFollowTargetId = item => item?.userId ?? item?.id

const isFollowActionLoading = item => {
    const targetUserId = getFollowTargetId(item)
    if (targetUserId == null) return false
    return Boolean(followActionLoading[targetUserId])
}

const isMutualLikeRow = item => {
    if (followActiveTab.value === 'mutual') return true
    const relation = String(item?.relationType || item?.relation || item?.followRelation || '').toUpperCase()
    if (relation === 'MUTUAL' || relation === 'EACH_OTHER' || relation === 'BOTH') return true
    if (item?.isMutual != null) return String(item.isMutual) === '1' || item.isMutual === true
    if (item?.mutual != null) return String(item.mutual) === '1' || item.mutual === true
    return false
}

const syncMutualCountFromListIfNeeded = () => {
    if (!followDialogVisible.value) return
    if (followActiveTab.value !== 'mutual') return
    const stats = clampStats(followStats.value.following, followStats.value.followers, followList.value.length)
    followStats.value = { ...followStats.value, mutualCount: stats.mutualCount }
}

const resetFollowList = () => {
    followList.value = []
    followLastId.value = undefined
    followNoMore.value = false
    followLoading.value = false
    followRequestId.value += 1
}

const getFollowList = async () => {
    if (followLoading.value || followNoMore.value) return
    followLoading.value = true
    const requestId = followRequestId.value
    const activeTab = followActiveTab.value

    try {
        const api = followApiMap[activeTab]
        const response = await api({
            lastId: followLastId.value,
            size: followPageSize
        })
        const responseList = Array.isArray(response?.data) ? response.data : Array.isArray(response?.rows) ? response.rows : []
        if (requestId !== followRequestId.value || !followDialogVisible.value) return

        if (responseList.length > 0) {
            const normalized = normalizeFollowList(responseList, activeTab)
            followList.value = [...followList.value, ...normalized]
            followLastId.value = responseList[responseList.length - 1]?.id
            if (responseList.length < followPageSize) followNoMore.value = true
            syncMutualCountFromListIfNeeded()
        } else {
            followNoMore.value = true
            syncMutualCountFromListIfNeeded()
        }
    } catch (error) {
        console.error(error)
        if (requestId === followRequestId.value) followNoMore.value = true
    } finally {
        if (requestId === followRequestId.value) followLoading.value = false
    }
}

const loadMoreFollow = () => {
    if (!followNoMore.value) getFollowList()
}

const handleFollowIntersect = entries => {
    if (!entries?.some(entry => entry.isIntersecting)) return
    if (!followNoMore.value && !followLoading.value) loadMoreFollow()
}

const setupFollowObserver = async () => {
    if (followObserver) followObserver.disconnect()
    await nextTick()
    if (!followListRef.value || !followTriggerRef.value) return
    followObserver = new IntersectionObserver(handleFollowIntersect, {
        root: followListRef.value,
        rootMargin: '0px 0px 120px 0px',
        threshold: 0.01
    })
    followObserver.observe(followTriggerRef.value)
}

watch(followDialogVisible, visible => {
    if (visible) setupFollowObserver()
    else {
        followObserver?.disconnect()
        followObserver = null
    }
})

watch(
    () => followLoading.value,
    next => {
        if (!next && followObserver && followTriggerRef.value) {
            followObserver.unobserve(followTriggerRef.value)
            followObserver.observe(followTriggerRef.value)
        }
    }
)

watch(previewVisible, visible => {
    isBodyScrollLocked.value = visible
})

const handleFollowTabClick = tab => {
    const nextTab = normalizeFollowTab(tab?.props?.name ?? tab?.paneName ?? followActiveTab.value)
    if (nextTab !== followActiveTab.value) followActiveTab.value = nextTab
    if (!followDialogVisible.value) return
    getFollowStats()
    resetFollowList()
    getFollowList()
}

const removeRowFromFollowList = targetUserId => {
    followList.value = followList.value.filter(row => getFollowTargetId(row) !== targetUserId)
    syncMutualCountFromListIfNeeded()
}

const toggleFollow = async item => {
    const targetUserId = getFollowTargetId(item)
    if (!targetUserId || isFollowActionLoading(item)) return
    followActionLoading[targetUserId] = true

    const wasFollowing = Boolean(item.isFollowing)
    const active = followActiveTab.value
    const wasMutual = isMutualLikeRow(item)
    const nowFollowing = !wasFollowing

    try {
        await toggleFollowUser({ targetUserId })
        item.isFollowing = nowFollowing

        let nextFollowing = followStats.value.following
        let nextMutual = followStats.value.mutualCount

        if (active === 'following') {
            nextFollowing = Math.max(0, Number(nextFollowing || 0) + (nowFollowing ? 1 : -1))
            if (!nowFollowing && wasMutual) nextMutual = Math.max(0, Number(nextMutual || 0) - 1)
        } else if (active === 'mutual') {
            nextFollowing = Math.max(0, Number(nextFollowing || 0) + (nowFollowing ? 1 : -1))
            if (!nowFollowing) nextMutual = Math.max(0, Number(nextMutual || 0) - 1)
        } else if (active === 'followers') {
            if (nowFollowing) {
                nextFollowing = Math.max(0, Number(nextFollowing || 0) + 1)
                nextMutual = Math.max(0, Number(nextMutual || 0) + 1)
            } else {
                nextFollowing = Math.max(0, Number(nextFollowing || 0) - 1)
                if (wasMutual) nextMutual = Math.max(0, Number(nextMutual || 0) - 1)
            }
        }

        const stats = clampStats(nextFollowing, followStats.value.followers, nextMutual)
        followStats.value = { ...followStats.value, following: stats.following, mutualCount: stats.mutualCount }

        if (wasFollowing && (active === 'following' || active === 'mutual')) {
            removeRowFromFollowList(targetUserId)
        } else if (active === 'mutual' && !nowFollowing) {
            removeRowFromFollowList(targetUserId)
        }

        getFollowStats()
    } catch (error) {
        console.error(error)
    } finally {
        followActionLoading[targetUserId] = false
    }
}

const getCover = item => {
    const mediaList = getMediaList(item)
    return mediaList[0] || ''
}

const getVideoUrl = item => {
    const mediaList = getMediaList(item)
    return mediaList[1] || mediaList[0] || ''
}

const getMediaList = item => {
    if (Array.isArray(item.mediaList) && item.mediaList.length > 0) return item.mediaList
    return parseMediaUrls(item.mediaUrls || item.fileList || item.files || [])
}

const previewMediaList = computed(() => {
    const post = previewPost.value
    if (!post) return []
    return getMediaList(post)
})

const previewTags = computed(() => {
    const post = previewPost.value
    if (!post) return []
    if (Array.isArray(post.tags)) {
        return post.tags.map(tag => tag?.tagName ?? tag?.name ?? tag?.label).filter(item => Boolean(item))
    }
    if (typeof post.tagStr === 'string') {
        return post.tagStr
            .split(',')
            .map(item => item.trim())
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

const resolveAvatar = avatar => getImgUrl(avatar || '')

const resolvePreviewFollowState = post => {
    if (!post) return false
    const rawFollowState = post.follow ?? post.isFollow ?? post.isFollowing ?? post.followed ?? post.followStatus ?? post.following
    if (typeof rawFollowState === 'boolean') return rawFollowState
    if (rawFollowState != null) return String(rawFollowState) === '1'
    const relation = String(post.relationType || post.relation || post.followRelation || '').toUpperCase()
    if (relation === 'MUTUAL' || relation === 'FOLLOWING') return true
    return false
}

const setPreviewFollowState = (post, nextFollowing) => {
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

const getPreviewPostId = post => post?.postId ?? post?.id ?? null

const getPreviewTargetUserId = post =>
    post?.targetUserId ?? post?.userId ?? post?.authorId ?? post?.createBy ?? post?.user?.id ?? post?.author?.id ?? userStore.id ?? null

const isPreviewAuthorSelf = computed(() => {
    const post = previewPost.value
    if (!post) return false
    const targetUserId = getPreviewTargetUserId(post)
    if (targetUserId == null || userStore.id == null) return false
    return String(targetUserId) === String(userStore.id)
})

const buildPreviewComment = content => ({
    id: `local-${Date.now()}`,
    content,
    nickName: userStore.nickName || userStore.name || '用户',
    avatar: userStore.avatar || '',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
})

const appendPreviewComment = (post, comment) => {
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

const normalizePostFlags = item => {
    const likeValue = item?.like ?? item?.isLiked ?? item?.liked ?? item?.likeStatus ?? item?.isLike
    const bookmarkValue = item?.bookmark ?? item?.isCollected ?? item?.collected ?? item?.collectStatus ?? item?.isCollect
    const like = typeof likeValue === 'boolean' ? likeValue : likeValue != null ? String(likeValue) === '1' : false
    const bookmark = typeof bookmarkValue === 'boolean' ? bookmarkValue : bookmarkValue != null ? String(bookmarkValue) === '1' : false
    return {
        ...item,
        like: activeTab.value === 'likes' ? true : like,
        bookmark: activeTab.value === 'bookmarks' ? true : bookmark
    }
}

const parseMediaUrls = mediaUrls => {
    let rawList = []
    if (Array.isArray(mediaUrls)) {
        rawList = mediaUrls
    } else if (typeof mediaUrls === 'string') {
        const trimmed = mediaUrls.trim()
        if (!trimmed) return []
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed)
                rawList = Array.isArray(parsed) ? parsed : []
            } catch (e) {
                rawList = []
            }
        } else {
            rawList = trimmed.split(',').map(item => item.trim())
        }
    } else if (mediaUrls && typeof mediaUrls === 'object') {
        rawList = [mediaUrls]
    }
    return rawList
        .map(item => {
            if (typeof item === 'string') return item
            return item?.url || item?.src || item?.path || ''
        })
        .filter(Boolean)
        .map(getImgUrl)
}

const getList = async () => {
    if (loading.value) return
    loading.value = true
    try {
        const params = {
            limit: queryParams.limit,
            targetUserId: queryParams.targetUserId,
            lastId: queryParams.lastId,
            lastCreateTime: queryParams.lastCreateTime,
            postType: resolvePostType(queryParams.postType)
        }
        const response =
            activeTab.value === 'likes'
                ? await listPostByLike(params)
                : activeTab.value === 'bookmarks'
                  ? await listPostByBookMark(params)
                  : await listPostByApp(params)
        const responseList = Array.isArray(response?.data) ? response.data : Array.isArray(response?.rows) ? response.rows : []
        let hasNonVideo = false
        if (responseList.length > 0) {
            const filteredList = responseList.filter(item => allowedPostTypeSet.has(String(item?.postType)))
            hasNonVideo = filteredList.length !== responseList.length
            const normalizedList = filteredList.map(item => ({
                ...normalizePostFlags(item),
                mediaList: parseMediaUrls(item.mediaUrls || item.fileList || item.files || [])
            }))
            postList.value = [...postList.value, ...normalizedList]
            const lastItem = responseList[responseList.length - 1]
            queryParams.lastId = lastItem.id
            queryParams.lastCreateTime = lastItem.createTime
            if (responseList.length < queryParams.limit) noMore.value = true
        } else {
            noMore.value = true
        }
        const totalFromResponse = response?.total ?? response?.data?.total ?? response?.count
        const nextTotal = hasNonVideo ? postList.value.length : Number.isFinite(Number(totalFromResponse)) ? Number(totalFromResponse) : postList.value.length
        if (activeTab.value === 'likes') {
            likeTotal.value = nextTotal
        } else if (activeTab.value === 'bookmarks') {
            bookmarkTotal.value = nextTotal
        } else {
            total.value = nextTotal
        }
    } catch (error) {
        console.error(error)
        noMore.value = true
    } finally {
        loading.value = false
    }
}

const resolveTotalFromResponse = (response, fallback = 0) => {
    const totalFromResponse = response?.total ?? response?.data?.total ?? response?.count
    const nextTotal = Number(totalFromResponse)
    if (Number.isFinite(nextTotal)) return nextTotal
    return fallback
}

const resolveTotalFromListResponse = (response, fallback = 0) => {
    const responseList = Array.isArray(response?.data) ? response.data : Array.isArray(response?.rows) ? response.rows : []
    const filteredList = responseList.filter(item => allowedPostTypeSet.has(String(item?.postType)))
    const hasNonVideo = filteredList.length !== responseList.length
    const resolvedTotal = resolveTotalFromResponse(response, Number.NaN)
    if (!hasNonVideo && Number.isFinite(resolvedTotal)) return resolvedTotal
    if (filteredList.length > 0) return filteredList.length
    if (Number.isFinite(resolvedTotal)) return resolvedTotal
    return fallback
}

const loadInitialTabTotals = async () => {
    const params = {
        limit: queryParams.limit,
        lastId: queryParams.lastId,
        lastCreateTime: queryParams.lastCreateTime,
        postType: resolvePostType(queryParams.postType)
    }
    if (queryParams.targetUserId !== null && queryParams.targetUserId !== undefined && queryParams.targetUserId !== '') {
        params.targetUserId = queryParams.targetUserId
    }
    try {
        const [likeResponse, bookmarkResponse] = await Promise.all([listPostByLike(params), listPostByBookMark(params)])
        likeTotal.value = resolveTotalFromListResponse(likeResponse, likeTotal.value)
        bookmarkTotal.value = resolveTotalFromListResponse(bookmarkResponse, bookmarkTotal.value)
    } catch (error) {
        console.error(error)
    }
}

const getCollectionList = async () => {
    if (collectionLoading.value) return
    collectionLoading.value = true
    try {
        const response = await listMyCollections()
        const responseList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
        collectionList.value = responseList
    } catch (error) {
        console.error(error)
    } finally {
        collectionLoading.value = false
    }
}

const handleWorksFilterChange = value => {
    if (value === 'collection') {
        getCollectionList()
    }
}

const handleCreateCollection = async payload => {
    if (createCollectionLoading.value) return
    const title = String(payload?.title || '').trim()
    const description = String(payload?.desc || '').trim()
    const coverUrl = String(payload?.coverUrl || '').trim()
    if (!title || !coverUrl) {
        proxy?.$modal?.msgWarning?.('请完善合集信息')
        return
    }
    createCollectionLoading.value = true
    proxy?.$modal?.loading?.('正在创建合集...')
    try {
        await addCollection({
            title,
            coverUrl,
            description,
            sortType: 0
        })
        proxy?.$modal?.msgSuccess?.('创建成功')
        getCollectionList()
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('创建失败')
    } finally {
        proxy?.$modal?.closeLoading?.()
        createCollectionLoading.value = false
    }
}

const getProfile = async () => {
    try {
        const response = await getUserProfile()
        const responseData = response?.data ?? {}
        const profile = responseData.user ?? responseData
        profileInfo.value = {
            ...profile,
            sex: normalizeSexValue(profile.sex ?? profile.gender ?? responseData.sex ?? responseData.gender)
        }
        const resolvedUserId = profile.userId ?? profile.id ?? responseData.userId ?? responseData.id ?? null
        if (resolvedUserId != null && resolvedUserId !== '' && queryParams.targetUserId !== resolvedUserId) {
            queryParams.targetUserId = resolvedUserId
            loadInitialTabTotals()
        }
    } catch (error) {
        console.error(error)
    }
}

const getFollowStats = async () => {
    try {
        const response = await selectFollowNum({ targetUserId: queryParams.targetUserId })
        const responseData = response?.data ?? {}
        const followingCountRaw = responseData.followerCount ?? 0
        const followersCountRaw = responseData.fans ?? 0
        const mutualCountRaw = responseData.eachOtherCount ?? 0
        const useMutualListCount = followDialogVisible.value && followActiveTab.value === 'mutual'
        const mutualFrom = useMutualListCount ? followList.value.length : mutualCountRaw
        const stats = clampStats(followingCountRaw, followersCountRaw, mutualFrom)
        followStats.value = stats
        syncMutualCountFromListIfNeeded()
    } catch (error) {
        console.error(error)
    }
}

const loadMore = () => {
    if (!noMore.value) getList()
}

const handleTabClick = tab => {
    const nextTab = tab?.props?.name ?? activeTab.value
    if (nextTab !== activeTab.value) {
        activeTab.value = nextTab
    }
    postList.value = []
    noMore.value = false
    queryParams.lastId = undefined
    queryParams.lastCreateTime = undefined
    getList()
}

const handlePreview = item => {
    if (!item) return
    if (item.postType === POST_TYPE.VIDEO) {
        const src = getVideoUrl(item)
        const postId = item?.postId ?? item?.id
        if (!src || postId == null) return
        const normalized = normalizePostFlags(item)
        const cacheKey = `${VIDEO_PLAYER_CACHE_KEY}:${postId}`
        proxy?.$cache?.session?.setJSON?.(cacheKey, {
            id: postId,
            src,
            post: normalized,
            userInfo: userInfo.value,
            from: route.fullPath
        })
        router.push({ name: 'VideoPlayer', params: { id: postId }, query: { from: route.fullPath } })
        return
    }

    previewPost.value = normalizePostFlags(item)
    commentDraft.value = ''
    isActionInputFocused.value = false
    previewVisible.value = true
}

const resetPreview = () => {
    previewPost.value = null
    commentDraft.value = ''
    isActionInputFocused.value = false
}

const closePreview = () => {
    previewVisible.value = false
    resetPreview()
}

const focusCommentInput = () => {
    nextTick(() => {
        commentInputRef.value?.focus?.()
    })
}

const handleActionInputBlur = () => {
    isActionInputFocused.value = false
}

const submitPreviewComment = async () => {
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

const handlePreviewAction = async type => {
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
            const response = await likePost({ postId, targetUserId })
            const activeState = response?.data?.active
            const nextLiked = typeof activeState === 'boolean' ? activeState : !wasLiked
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
            const response = await bookmarkPost({ postId, targetUserId })
            const activeState = response?.data?.active
            const nextCollected = typeof activeState === 'boolean' ? activeState : !wasCollected
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
            const promptResult = await proxy?.$modal?.prompt?.('请输入转发内容')
            content = String(promptResult?.value ?? '').trim()
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

const handlePreviewFollow = async () => {
    const post = previewPost.value
    if (!post || previewFollowLoading.value || isPreviewAuthorSelf.value) return
    const targetUserId = getPreviewTargetUserId(post)
    if (!targetUserId) return
    const wasFollowing = isPreviewFollowing.value
    previewFollowLoading.value = true
    try {
        await toggleFollowUser({ targetUserId })
        setPreviewFollowState(post, !wasFollowing)
    } catch (error) {
        console.error(error)
    } finally {
        previewFollowLoading.value = false
    }
}

const goToProfile = () => {
    router.push({ name: 'Profile' })
}

const openFollowDialog = type => {
    followActiveTab.value = normalizeFollowTab(type)
    followDialogVisible.value = true
    getFollowStats()
    resetFollowList()
    getFollowList()
}

onMounted(() => {
    queryParams.targetUserId = userStore.id
    getProfile()
    getFollowStats()
    loadInitialTabTotals()
    getList()
})

onActivated(() => {
    getProfile()
    getFollowStats()
    loadInitialTabTotals()
})

onBeforeUnmount(() => {
    followObserver?.disconnect()
    followObserver = null
    isBodyScrollLocked.value = false
})
</script>

<style lang="scss" scoped>
.user-profile-page {
    background-color: var(--el-bg-color);
    color: var(--el-text-color-primary);
    padding: 0;

    .profile-header {
        position: relative;
        margin-bottom: 20px;
        background-color: var(--el-bg-color);

        .banner {
            height: 200px;
            position: relative;
            overflow: hidden;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .banner-mask {
                position: absolute;
                inset: 0;
                background: linear-gradient(to bottom, transparent 60%, var(--el-bg-color) 100%);
            }
        }

        .user-info-wrapper {
            padding: 0 32px;
            position: relative;
            display: flex;
            align-items: flex-end;
            margin-top: -40px;

            .avatar-container {
                margin-right: 20px;
                padding: 4px;
                background: var(--el-bg-color);
                border-radius: 50%;
                z-index: 2;

                .avatar-img {
                    border: 1px solid var(--el-border-color-lighter);
                }
            }

            .info-content {
                flex: 1;
                padding-bottom: 4px;
                z-index: 2;

                .name-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;

                    .nickname {
                        font-size: 24px;
                        font-weight: 700;
                        margin-right: 12px;
                        color: var(--el-text-color-primary);
                    }

                    .tags {
                        display: flex;
                        gap: 6px;

                        :deep(.el-tag) {
                            border-color: transparent;
                            background-color: var(--el-fill-color);
                            color: var(--el-text-color-regular);

                            &.gender-tag {
                                padding: 0 8px;
                            }
                            &.location-tag {
                                max-width: 150px;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                        }
                    }
                }

                .stat-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 12px;
                    font-size: 15px;

                    .stat-divider {
                        width: 1px;
                        height: 12px;
                        background-color: var(--el-border-color);
                    }

                    .stat-item {
                        cursor: pointer;
                        display: flex;
                        align-items: baseline;
                        transition: opacity 0.2s;

                        .num {
                            font-weight: 700;
                            margin-right: 4px;
                            font-size: 16px;
                            color: var(--el-text-color-primary);
                        }
                        .label {
                            font-size: 13px;
                            color: var(--el-text-color-secondary);
                        }

                        &:hover {
                            opacity: 0.8;
                            .label {
                                color: var(--el-text-color-primary);
                            }
                        }
                    }
                }

                .desc-row {
                    font-size: 14px;
                    color: var(--el-text-color-regular);
                    line-height: 1.5;
                    white-space: pre-wrap;
                    max-width: 600px;
                }
            }

            .action-btn {
                padding-bottom: 15px;
                display: flex;
                gap: 12px;

                .edit-btn {
                    width: 120px;
                    font-weight: 500;
                }
            }
        }
    }
}

:deep(.custom-dialog-theme) {
    border-radius: 12px;
    overflow: hidden;

    .el-dialog__header {
        margin-right: 0;
        padding: 16px 20px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .dialog-header-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        .el-dialog__headerbtn {
            top: 16px;
            right: 16px;
        }
    }

    .el-dialog__body {
        padding: 0;
        background-color: var(--el-bg-color);
        min-height: 500px;
    }
}

.follow-dialog-body {
    height: 600px;
    display: flex;
    flex-direction: column;
    position: relative;

    .sticky-tabs-header {
        z-index: 10;
        background-color: var(--el-bg-color);
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .loading-state,
    .no-more-state {
        text-align: center;
        padding: 24px 0;
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }
}

:deep(.follow-tabs) {
    --el-tabs-header-height: 44px;

    .el-tabs__nav-wrap::after {
        display: none;
    }

    .el-tabs__item {
        font-size: 15px;
        height: 44px;
        line-height: 44px;
        color: var(--el-text-color-regular);
        padding: 0 20px;
        transition: all 0.3s;

        &.is-active {
            font-weight: 600;
            color: var(--el-text-color-primary);

            .count-badge {
                background-color: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
            }
        }
    }

    .el-tabs__active-bar {
        height: 3px;
        border-radius: 3px;
        background-color: var(--el-color-primary);
        bottom: 0;
    }

    .tab-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        position: relative;
        height: 100%;

        .count-badge {
            font-size: 12px;
            background-color: var(--el-fill-color);
            padding: 0 6px;
            border-radius: 10px;
            height: 18px;
            min-width: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-secondary);
            transition: all 0.3s;
            font-weight: 500;
            line-height: 1;
        }
    }
}

.follow-list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.follow-load-trigger {
    height: 1px;
}

.follow-user-row {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    transition: background-color 0.2s;
    cursor: default;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 80px;
        right: 0;
        height: 1px;
        background-color: var(--el-border-color-lighter);
        transform: scaleY(0.5);
    }

    &:last-child::after {
        display: none;
    }

    &:hover {
        background-color: var(--el-fill-color-light);

        &::after {
            opacity: 0;
        }
    }

    .left-section {
        flex-shrink: 0;
        margin-right: 14px;

        .row-avatar {
            border: 1px solid var(--el-border-color-lighter);
            transition: transform 0.2s;
            background-color: var(--el-fill-color-light);
        }
    }

    &:hover .row-avatar {
        transform: scale(1.05);
    }

    .middle-section {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;

        .info-top {
            display: flex;
            align-items: center;

            .nickname {
                font-size: 15px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                margin-right: 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 180px;
            }

            .user-badges {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .gender-icon {
                font-size: 13px;
                &.male {
                    color: #409eff;
                }
                &.female {
                    color: #f56c6c;
                }
            }

            .mini-tag {
                height: 18px;
                padding: 0 4px;
                font-size: 10px;
                line-height: 16px;
                border: none;
            }
        }

        .info-bottom {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 260px;
            line-height: 1.4;
        }
    }

    .right-section {
        flex-shrink: 0;
        margin-left: 16px;

        .action-btn {
            min-width: 72px;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;

            &.is-following {
                background-color: var(--el-fill-color);
                border-color: var(--el-border-color-light);
                color: var(--el-text-color-secondary);

                &:hover {
                    background-color: var(--el-fill-color-dark);
                    color: var(--el-text-color-regular);
                    border-color: var(--el-border-color);
                }
            }
        }
    }
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
