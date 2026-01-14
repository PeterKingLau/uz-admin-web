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
                                <Icon icon="ep:male" v-if="userInfo.sex === '1'" />
                                <Icon icon="ep:female" v-else />
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

        <div class="content-body">
            <el-tabs v-model="activeTab" class="custom-tabs" @tab-click="handleTabClick">
                <el-tab-pane label="作品" name="works">
                    <template #label>
                        <div class="tab-label">
                            作品 <span class="count">{{ total }}</span>
                        </div>
                    </template>
                </el-tab-pane>
                <el-tab-pane label="私密" name="private">
                    <template #label>
                        <div class="tab-label">私密 <Icon icon="ep:lock" class="ml-1" /></div>
                    </template>
                </el-tab-pane>
                <el-tab-pane label="喜欢" name="likes">
                    <template #label>
                        <div class="tab-label">
                            喜欢 <span class="count">{{ userInfo.likedCount || 0 }}</span>
                        </div>
                    </template>
                </el-tab-pane>
            </el-tabs>

            <div class="post-grid" v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading || noMore" :infinite-scroll-distance="10">
                <div v-for="item in postList" :key="item.id" class="post-card" @click="handlePreview(item)">
                    <div class="cover-wrapper">
                        <img v-if="item.postType === POST_TYPE.IMAGE" :src="getCover(item)" alt="cover" loading="lazy" />

                        <div v-else-if="item.postType === POST_TYPE.VIDEO" class="video-wrapper">
                            <video :src="getVideoUrl(item)" muted playsinline preload="metadata" class="video-cover"></video>
                            <div class="play-icon">
                                <Icon icon="mdi:play" />
                            </div>
                        </div>

                        <div v-else class="text-cover">
                            <span>{{ item.content }}</span>
                        </div>

                        <div class="card-stat"><Icon icon="ep:star" /> {{ item.likeCount || 0 }}</div>
                        <div class="type-badge" v-if="item.postType === POST_TYPE.IMAGE">
                            <Icon icon="ep:picture" />
                        </div>
                    </div>
                    <div class="post-desc">
                        {{ item.content }}
                    </div>
                </div>
            </div>

            <div v-if="loading" class="loading-state">
                <el-icon class="is-loading"><Loading /></el-icon> 加载中...
            </div>

            <div v-if="noMore && postList.length > 0" class="no-more-state">- 暂时没有更多了 -</div>

            <el-empty v-if="!loading && postList.length === 0" description="暂无内容" :image-size="160" />
        </div>

        <teleport to="body">
            <div v-if="showVideoPlayer" class="video-viewer-mask" @click="closeVideoPlayer">
                <div class="video-viewer-close">
                    <Icon icon="ep:close" />
                </div>
                <div class="video-container" @click.stop>
                    <video v-if="showVideoPlayer && currentVideoSrc" ref="playerRef" class="video-js video-player-content" playsinline></video>
                </div>
            </div>
        </teleport>

        <el-image-viewer v-if="showImageViewer" :url-list="previewImgList" :initial-index="0" @close="showImageViewer = false" />

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

                <div
                    class="follow-list"
                    v-infinite-scroll="loadMoreFollow"
                    :infinite-scroll-disabled="followLoading || followNoMore"
                    :infinite-scroll-distance="10"
                >
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
                                    <Icon v-if="item.sex === '1'" icon="ep:male" class="gender-icon male" />
                                    <Icon v-else-if="item.sex === '0'" icon="ep:female" class="gender-icon female" />
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
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, computed, getCurrentInstance, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { listPostByApp } from '@/api/content/post'
import { listFollowers, listFollowing, listMutual, selectFollowNum, toggleFollowUser } from '@/api/content/userFollow'
import { getUserProfile } from '@/api/system/user'
import useUserStore from '@/store/modules/user'
import { getImgUrl } from '@/utils/img'
import { POST_TYPE } from '@/utils/enum'

const router = useRouter()
const userStore = useUserStore()
const { proxy } = getCurrentInstance()

const defaultBg = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
const activeTab = ref('works')
const loading = ref(false)
const noMore = ref(false)
const total = ref(0)
const postList = ref([])
const profileInfo = ref({})
const followStats = ref({
    following: 0,
    followers: 0,
    mutualCount: 0
})

const showVideoPlayer = ref(false)
const currentVideoSrc = ref('')
const showImageViewer = ref(false)
const previewImgList = ref([])
const playerRef = ref(null)
let player = null

const followDialogVisible = ref(false)
const followActiveTab = ref('following')
const followList = ref([])
const followLoading = ref(false)
const followNoMore = ref(false)
const followLastId = ref(undefined)
const followPageSize = 20
const followTabSet = new Set(['following', 'followers', 'mutual'])
const followRequestId = ref(0)
const followActionLoading = reactive({})

const queryParams = reactive({
    pageNum: 1,
    limit: 15,
    targetUserId: null,
    lastId: undefined,
    lastCreateTime: undefined,
    postType: undefined
})

const clampStats = (following, followers, mutualCount) => {
    const f1 = Math.max(0, Number(following) || 0)
    const f2 = Math.max(0, Number(followers) || 0)
    const m = Math.max(0, Number(mutualCount) || 0)
    return { following: f1, followers: f2, mutualCount: Math.min(m, f1, f2) }
}

const userInfo = computed(() => {
    const profile = profileInfo.value || {}
    const avatar = profile.avatar ? getImgUrl(profile.avatar) : userStore.avatar || ''
    const s = clampStats(followStats.value.following, followStats.value.followers, followStats.value.mutualCount)
    return {
        ...profile,
        nickName: profile.nickName || userStore.nickName || '未知用户',
        avatar,
        following: s.following,
        followers: s.followers,
        mutualCount: s.mutualCount,
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
    const s = clampStats(followStats.value.following, followStats.value.followers, followList.value.length)
    followStats.value = { ...followStats.value, mutualCount: s.mutualCount }
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
        const res = await api({
            lastId: followLastId.value,
            size: followPageSize
        })
        const dataList = Array.isArray(res?.data) ? res.data : Array.isArray(res?.rows) ? res.rows : []
        if (requestId !== followRequestId.value || !followDialogVisible.value) return

        if (dataList.length > 0) {
            const normalized = normalizeFollowList(dataList, activeTab)
            followList.value = [...followList.value, ...normalized]
            followLastId.value = dataList[dataList.length - 1]?.id
            if (dataList.length < followPageSize) followNoMore.value = true
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

        const s = clampStats(nextFollowing, followStats.value.followers, nextMutual)
        followStats.value = { ...followStats.value, following: s.following, mutualCount: s.mutualCount }

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

const playerOptions = {
    controls: true,
    autoplay: true,
    muted: false,
    loop: false,
    preload: 'auto',
    playbackRates: [0.5, 1, 1.25, 1.5, 2]
}

const buildSources = url => {
    const u = String(url || '').trim()
    if (!u) return []
    return [{ src: u, type: guessMime(u) }]
}

const guessMime = url => {
    const u = String(url || '').toLowerCase()
    if (u.includes('.m3u8')) return 'application/x-mpegURL'
    if (u.includes('.mpd')) return 'application/dash+xml'
    if (u.includes('.webm')) return 'video/webm'
    if (u.includes('.ogg') || u.includes('.ogv')) return 'video/ogg'
    return 'video/mp4'
}

const initPlayer = async () => {
    if (!showVideoPlayer.value || !currentVideoSrc.value) return
    await nextTick()
    const el = playerRef.value
    if (!el) return

    if (!player) {
        const videojsLib = proxy?.$videojs
        if (!videojsLib) return
        player = videojsLib(el, { ...playerOptions, sources: buildSources(currentVideoSrc.value) })
    } else {
        player.src(buildSources(currentVideoSrc.value))
    }

    player.play?.()
}

const stopPlayer = () => {
    if (!player) return
    player.pause?.()
    player.dispose?.()
    player = null
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
            postType: queryParams.postType
        }

        const res = await listPostByApp(params)
        const dataList = Array.isArray(res.data) ? res.data : []

        if (dataList.length > 0) {
            const normalizedList = dataList.map(item => ({
                ...item,
                mediaList: parseMediaUrls(item.mediaUrls || item.fileList || item.files || [])
            }))
            postList.value = [...postList.value, ...normalizedList]

            const lastItem = dataList[dataList.length - 1]
            queryParams.lastId = lastItem.id
            queryParams.lastCreateTime = lastItem.createTime

            if (dataList.length < queryParams.limit) noMore.value = true
        } else {
            noMore.value = true
        }
    } catch (error) {
        console.error(error)
        noMore.value = true
    } finally {
        loading.value = false
    }
}

const getProfile = async () => {
    try {
        const res = await getUserProfile()
        profileInfo.value = res.data || {}
    } catch (error) {
        console.error(error)
    }
}

const getFollowStats = async () => {
    try {
        const res = await selectFollowNum({ targetUserId: queryParams.targetUserId })
        const data = res?.data ?? {}

        const rawFollowing = data.followerCount ?? 0
        const rawFollowers = data.fans ?? 0
        const rawMutual = data.eachOtherCount ?? 0

        const useMutualListCount = followDialogVisible.value && followActiveTab.value === 'mutual'
        const mutualFrom = useMutualListCount ? followList.value.length : rawMutual

        const s = clampStats(rawFollowing, rawFollowers, mutualFrom)
        followStats.value = s
        syncMutualCountFromListIfNeeded()
    } catch (error) {
        console.error(error)
    }
}

const loadMore = () => {
    if (!noMore.value) getList()
}

const handleTabClick = tab => {
    if (tab.props.name === 'works') {
    }
}

const handlePreview = item => {
    if (item.postType === POST_TYPE.VIDEO) {
        currentVideoSrc.value = getVideoUrl(item)
        showVideoPlayer.value = true
    } else if (item.postType === POST_TYPE.IMAGE) {
        previewImgList.value = getMediaList(item)
        showImageViewer.value = true
    }
}

const closeVideoPlayer = () => {
    stopPlayer()
    showVideoPlayer.value = false
    currentVideoSrc.value = ''
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
    getList()
})

onActivated(() => {
    getProfile()
    getFollowStats()
})

watch(
    () => [showVideoPlayer.value, currentVideoSrc.value],
    () => {
        if (showVideoPlayer.value) initPlayer()
        else stopPlayer()
    }
)

onBeforeUnmount(() => {
    stopPlayer()
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

    .content-body {
        padding: 0 32px 40px;

        :deep(.custom-tabs) {
            .el-tabs__nav-wrap::after {
                background-color: var(--el-border-color-light);
                height: 1px;
            }

            .el-tabs__item {
                font-size: 16px;
                padding: 0 24px;
                color: var(--el-text-color-secondary);

                &.is-active {
                    color: var(--el-text-color-primary);
                    font-weight: 600;
                }

                .tab-label {
                    display: flex;
                    align-items: center;

                    .count {
                        margin-left: 4px;
                        font-size: 12px;
                        background: var(--el-fill-color-dark);
                        padding: 0 6px;
                        border-radius: 10px;
                        color: var(--el-text-color-secondary);
                    }
                }
            }

            .el-tabs__active-bar {
                background-color: var(--el-color-warning);
                height: 3px;
                border-radius: 3px;
            }
        }

        .post-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px;
            margin-top: 20px;

            .post-card {
                position: relative;
                cursor: pointer;
                border-radius: 8px;
                overflow: hidden;
                background-color: var(--el-bg-color-overlay);
                border: 1px solid var(--el-border-color-extra-light);
                transition: all 0.3s;

                &:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--el-box-shadow-light);

                    .cover-wrapper::after {
                        opacity: 1;
                    }
                }

                .cover-wrapper {
                    position: relative;
                    width: 100%;
                    padding-bottom: 133%;
                    background: var(--el-fill-color-darker);

                    &::after {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.1);
                        opacity: 0;
                        transition: opacity 0.3s;
                        z-index: 1;
                        pointer-events: none;
                    }

                    img {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        z-index: 0;
                    }

                    .video-wrapper {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 0;

                        .video-cover {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }

                        .play-icon {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            font-size: 32px;
                            color: #fff;
                            opacity: 0.8;
                            z-index: 2;
                            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
                        }
                    }

                    .text-cover {
                        position: absolute;
                        inset: 0;
                        padding: 16px;
                        font-size: 14px;
                        color: var(--el-text-color-primary);
                        background: var(--el-fill-color-light);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;

                        span {
                            display: -webkit-box;
                            -webkit-line-clamp: 4;
                            line-clamp: 4;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                        }
                    }

                    .card-stat {
                        position: absolute;
                        bottom: 8px;
                        left: 8px;
                        color: #fff;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
                        z-index: 2;
                    }

                    .type-badge {
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        color: #fff;
                        background: rgba(0, 0, 0, 0.3);
                        padding: 4px;
                        border-radius: 4px;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        z-index: 2;
                    }
                }

                .post-desc {
                    padding: 8px 10px;
                    font-size: 13px;
                    color: var(--el-text-color-regular);
                    line-height: 1.4;
                    display: -webkit-box;
                    line-clamp: 2;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    background: var(--el-bg-color-overlay);
                }
            }
        }

        .loading-state,
        .no-more-state {
            text-align: center;
            padding: 30px 0;
            color: var(--el-text-color-secondary);
            font-size: 13px;
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

.video-viewer-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;

    .video-viewer-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #fff;
        font-size: 20px;
        z-index: 10000;
        transition: background 0.3s;

        &:hover {
            background: rgba(255, 255, 255, 0.4);
        }
    }

    .video-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .video-player-content {
            max-width: 100%;
            max-height: 100%;
            width: 100%;
            height: 100%;
            object-fit: contain;
            outline: none;
        }
    }
}
</style>
