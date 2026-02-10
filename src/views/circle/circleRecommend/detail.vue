<template>
    <div class="circle-detail-page">
        <div class="page-wrapper">
            <CircleDetailLeftSidebar :circle-name="circleInfo.name" @go-back="goBack" />

            <main v-loading="loading" class="main-content">
                <CircleDetailHeader
                    :circle-info="circleInfo"
                    :join-loading="joinLoading"
                    :is-owner="isCircleOwner"
                    :delete-loading="deleteLoading"
                    :get-img-url="getImgUrl"
                    :format-number="formatNumber"
                    @join="handleJoin"
                    @delete="handleDeleteCircle"
                />
                <div class="floating-publish-bar" @click="handlePublish">
                    <el-avatar :size="36" :src="userAvatar || ''" class="publish-avatar">
                        {{ userName?.charAt(0) }}
                    </el-avatar>
                    <span class="publish-placeholder">与圈友分享你的想法...</span>
                    <el-button class="publish-plus" type="primary" circle size="small" @click.stop="handlePublish"> + </el-button>
                </div>
                <CircleDetailPosts
                    :post-list="postList"
                    :loading-posts="loadingPosts"
                    :get-img-url="getImgUrl"
                    :format-time="formatTime"
                    :format-action-count="formatActionCount"
                />
            </main>

            <CircleDetailRightSidebar
                :user-avatar="userAvatar"
                :user-name="userName"
                :circle-info="circleInfo"
                :managers="managers"
                :other-members="otherMembers"
                :get-img-url="getImgUrl"
                @show-all="showAllMembers = true"
                @publish="handlePublish"
            />
        </div>

        <CircleMembersDialog
            v-model="showAllMembers"
            :dialog-managers="dialogManagers"
            :dialog-others="dialogOthers"
            :is-circle-owner="isCircleOwner"
            :can-manage-members="canManageMembers"
            :current-user-id="userStore.id"
            :all-members-loading="allMembersLoading"
            :all-members="allMembers"
            :all-members-finished="allMembersFinished"
            :get-img-url="getImgUrl"
            @load-more="fetchAllMembers(true)"
            @set-admin="handleSetAdmin"
            @kick-member="handleKickMember"
        />

        <CirclePublishDialog
            v-model="publishVisible"
            :circle-id="resolveCircleId(circleInfo.id ?? route.params.id ?? route.query.id)"
            @published="fetchPosts"
        />
    </div>
</template>

<script setup lang="ts" name="CircleDetail">
import { ref, onMounted, getCurrentInstance, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getImgUrl } from '@/utils/img'
import { POST_TYPE } from '@/utils/enum'
import {
    closeCircle,
    getCircleInfo,
    getCircleMemberList,
    joinCircle,
    exitCircle,
    setCircleAdmin,
    removeCircleMember,
    type CircleItem
} from '@/api/content/circleManagement'
import { listPostByApp } from '@/api/content/post'
import useUserStore from '@/store/modules/user'
import { useCircleJoinStore } from '@/store/modules/circleJoin'
import CircleDetailLeftSidebar from './components/circleDetailLeftSidebar.vue'
import CircleDetailHeader from './components/circleDetailHeader.vue'
import CircleDetailPosts from './components/circleDetailPosts.vue'
import CircleDetailRightSidebar from './components/circleDetailRightSidebar.vue'
import CircleMembersDialog from './components/circleMembersDialog.vue'
import CirclePublishDialog from './components/circlePublishDialog.vue'
import type { PostItem } from '@/types/circle'

const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()
const circleJoinStore = useCircleJoinStore()

const userAvatar = computed(() => userStore.avatar)
const userName = computed(() => userStore.nickName || userStore.name || '用户')

interface CircleInfoExtended extends CircleItem {
    joined?: boolean
    memberCount?: number
    postCount?: number
    memberLabel?: string
    avatar?: string
    rules?: string[]
}

interface MemberItem {
    id: string | number
    userId?: string | number
    name: string
    avatar?: string
    description?: string
    isManager?: boolean
    followed?: boolean
    isSelf?: boolean
    _adminLoading?: boolean
    _kickLoading?: boolean
}

const loading = ref(false)
const loadingPosts = ref(false)
const joinLoading = ref(false)
const deleteLoading = ref(false)
const showAllMembers = ref(false)
const allMembers = ref<MemberItem[]>([])
const allMembersLoading = ref(false)
const allMembersFinished = ref(false)
const allMembersLastId = ref<number | string | undefined>(undefined)

const circleInfo = ref<Partial<CircleInfoExtended>>({})
const postList = ref<PostItem[]>([])
const memberList = ref<MemberItem[]>([])

const publishVisible = ref(false)

const managers = computed(() => memberList.value.filter(m => m.isManager))
const otherMembers = computed(() => memberList.value.filter(m => !m.isManager))
const dialogManagers = computed(() => allMembers.value.filter(m => m.isManager))
const dialogOthers = computed(() => allMembers.value.filter(m => !m.isManager))
const isCircleOwner = computed(() => {
    const ownerId = circleInfo.value.ownerUserId
    if (ownerId != null) return String(ownerId) === String(userStore.id)
    const creator = circleInfo.value.createBy
    if (!creator) return false
    return String(creator) === String(userStore.id) || creator === userStore.name || creator === userStore.nickName
})
const canManageMembers = computed(() => {
    if (isCircleOwner.value) return true
    const selfId = userStore.id
    if (selfId == null) return false
    return memberList.value.some(member => {
        if (!member?.isManager) return false
        const memberId = member.userId ?? member.id
        return memberId != null && String(memberId) === String(selfId)
    })
})

function formatNumber(num?: number): string {
    if (!num) return '0'
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w'
    }
    return String(num)
}

function formatActionCount(num?: number, suffix?: string): string {
    if (!num) return suffix || ''
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w' + (suffix ? ' ' + suffix : '')
    }
    return String(num) + (suffix ? ' ' + suffix : '')
}

function formatTime(time?: string): string {
    if (!time) return ''
    try {
        const date = new Date(time)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes}分钟前`
        if (hours < 24) return `${hours}小时前`
        if (days < 7) return `${days}天前`

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')

        if (year === now.getFullYear()) {
            return `${month}-${day} ${hour}:${minute}`
        }
        return `${year}-${month}-${day} ${hour}:${minute}`
    } catch (error) {
        return time
    }
}

function getArrayFrom(value: any): any[] {
    if (Array.isArray(value)) return value
    if (Array.isArray(value?.records)) return value.records
    if (Array.isArray(value?.list)) return value.list
    if (Array.isArray(value?.items)) return value.items
    return []
}

const VIDEO_URL_RE = /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i
const isVideoUrl = (url?: string) => VIDEO_URL_RE.test(url || '')

function parseMediaRaw(raw: any): any[] {
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
                    .map(entry => entry.trim())
                    .filter(Boolean)
            }
        }
        return trimmed
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean)
    }
    if (typeof raw === 'object') return [raw]
    return []
}

function normalizeMediaEntry(entry: any): { url: string; isVideo: boolean } {
    if (typeof entry === 'string') {
        return { url: entry, isVideo: isVideoUrl(entry) }
    }
    const url = entry?.url ?? entry?.src ?? entry?.path ?? entry?.fileUrl ?? ''
    const typeRaw = entry?.type ?? entry?.fileType ?? entry?.mimeType ?? entry?.mediaType ?? ''
    const type = String(typeRaw || '').toLowerCase()
    const isVideo = type.startsWith('video') || type.includes('video') || isVideoUrl(url)
    return { url, isVideo }
}

function resolveMediaEntries(item: any): Array<{ url: string; isVideo: boolean }> {
    const sources = [item?.mediaUrls, item?.mediaList, item?.files, item?.resources, item?.images, item?.imageList, item?.pictureList, item?.pictures]
    const entries: Array<{ url: string; isVideo: boolean }> = []
    sources.forEach(source => {
        parseMediaRaw(source).forEach(entry => {
            const normalized = normalizeMediaEntry(entry)
            if (normalized.url) entries.push(normalized)
        })
    })
    const seen = new Set<string>()
    return entries.filter(entry => {
        const key = String(entry.url)
        if (!key) return false
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

function resolveImageList(item: any): string[] {
    return resolveMediaEntries(item)
        .filter(entry => !entry.isVideo)
        .map(entry => entry.url)
}

function resolveVideoUrl(item: any): string {
    const direct = item?.videoUrl ?? item?.video ?? item?.url ?? item?.src ?? item?.fileUrl ?? ''
    if (direct) return direct
    const entries = resolveMediaEntries(item)
    const candidate = entries.find(entry => entry.isVideo)
    if (candidate?.url) return candidate.url
    if (String(item?.postType ?? '') === POST_TYPE.VIDEO) {
        return entries[0]?.url ?? ''
    }
    return ''
}

function normalizePostItem(item: any): PostItem {
    const author = item?.author ?? item?.user ?? {}
    const authorId = item?.authorId ?? item?.userId ?? item?.uid ?? item?.createBy ?? author?.id ?? author?.userId ?? author?.uid
    return {
        id: item?.id ?? item?.postId ?? item?.topicId ?? item?.contentId ?? item?.pk ?? item?.uuid,
        title: item?.title ?? item?.postTitle ?? item?.topicTitle ?? '',
        content: item?.content ?? item?.text ?? item?.summary ?? item?.desc ?? '',
        authorId,
        authorName: item?.authorName ?? item?.nickName ?? item?.userName ?? author?.nickName ?? author?.name ?? '',
        authorAvatar: item?.authorAvatar ?? item?.avatar ?? item?.userAvatar ?? author?.avatar ?? '',
        images: resolveImageList(item),
        videoUrl: resolveVideoUrl(item),
        postType: item?.postType ?? item?.type ?? item?.postTypeCode ?? item?.contentType ?? '',
        isTop: Boolean(item?.isTop ?? item?.top ?? item?.pinned),
        likeCount: item?.likeCount ?? item?.likes ?? item?.thumbCount,
        isLiked: item?.isLiked ?? item?.like ?? item?.liked ?? item?.thumbed ?? item?.thumb,
        like: item?.like ?? item?.liked ?? item?.isLiked,
        commentCount: item?.commentCount ?? item?.comments ?? item?.replyCount,
        isCollected: item?.isCollected ?? item?.bookmark ?? item?.collected ?? item?.collectStatus ?? item?.isCollect,
        bookmark: item?.bookmark ?? item?.collect ?? item?.isCollected,
        bookmarkCount: item?.bookmarkCount ?? item?.collectCount ?? item?.favorites,
        collectCount: item?.collectCount ?? item?.bookmarkCount,
        shareCount: item?.shareCount ?? item?.repostCount ?? item?.forwardCount,
        repostCount: item?.repostCount ?? item?.shareCount,
        createTime: item?.createTime ?? item?.createdAt,
        updateTime: item?.updateTime ?? item?.updatedAt
    }
}

function normalizeMemberItem(item: any): MemberItem {
    const roleValue = item?.role ?? item?.roleType ?? item?.roleId
    const roleText = roleValue == null ? '' : String(roleValue).toLowerCase()
    const isManagerByRole = roleText === '1' || roleText === '2' || roleText === 'manager' || roleText === 'owner' || roleText === 'admin'
    const relationValue = item?.relationType ?? item?.relation
    const relationText = relationValue == null ? '' : String(relationValue).toLowerCase()
    const relationFollowed = relationText !== '' && relationText !== '0' && relationText !== 'false' && relationText !== 'none'
    const resolvedUserId = item?.userId ?? item?.uid ?? item?.memberUserId ?? item?.accountId ?? item?.creatorId ?? item?.ownerId
    const resolvedId = item?.id ?? item?.memberId ?? item?.memberRecordId ?? null
    const resolvedName = item?.name ?? item?.nickName ?? item?.userName ?? ''
    const selfId = userStore.id
    const selfName = userStore.nickName || userStore.name || ''
    const isSelf =
        (selfId != null && (String(resolvedUserId ?? '') === String(selfId) || String(resolvedId ?? '') === String(selfId))) ||
        (selfName && resolvedName && String(resolvedName) === String(selfName))
    return {
        id: resolvedId ?? item?.userId ?? item?.uid,
        userId: resolvedUserId,
        name: item?.name ?? item?.nickName ?? item?.userName ?? '',
        avatar: item?.avatar ?? item?.userAvatar ?? '',
        description: item?.signature ?? item?.remark ?? item?.bio ?? '',
        isManager: Boolean(item?.isManager ?? item?.manager ?? item?.isOwner) || isManagerByRole,
        followed: Boolean(item?.followed ?? item?.isFollowed ?? item?.following) || relationFollowed,
        isSelf
    }
}

function resolvePersistedJoinState(circleId: string): boolean | null {
    if (!circleId) return null
    return circleJoinStore.getJoined(userStore.id, circleId)
}

function persistJoinState(circleId: string, joined: boolean) {
    if (!circleId) return
    circleJoinStore.setJoined(userStore.id, circleId, joined)
}

function toFiniteNumber(value: unknown): number | undefined {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

function resolveMemberCountFromResponse(payload: any): number | undefined {
    const data = payload?.data ?? payload
    const candidates = [
        data?.memberCount,
        data?.memberNum,
        data?.memberTotal,
        data?.circleMemberCount,
        payload?.memberCount,
        payload?.memberNum,
        payload?.memberTotal
    ]
    for (const candidate of candidates) {
        const parsed = toFiniteNumber(candidate)
        if (parsed != null) return Math.max(0, Math.floor(parsed))
    }
    return undefined
}

function applyJoinState(nextJoined: boolean, nextMemberCount?: number) {
    const previousJoined = Boolean(circleInfo.value.joined)
    circleInfo.value.joined = nextJoined

    if (nextMemberCount != null && Number.isFinite(nextMemberCount)) {
        circleInfo.value.memberCount = Math.max(0, Math.floor(nextMemberCount))
        return
    }

    if (previousJoined === nextJoined) return
    const explicitCount = toFiniteNumber(circleInfo.value.memberCount)
    const fallbackCount = memberList.value.length > 0 ? memberList.value.length : undefined
    const baseCount = explicitCount ?? fallbackCount
    if (baseCount == null) return
    circleInfo.value.memberCount = Math.max(0, baseCount + (nextJoined ? 1 : -1))
}

function resolveCurrentRouteCircleId(): string | number | undefined {
    return resolveCircleId(route.params.id ?? route.query.id)
}

function hydrateJoinedStateFromCache() {
    const currentCircleId = resolveCircleId(circleInfo.value.id ?? resolveCurrentRouteCircleId())
    if (!currentCircleId) return
    const persistedJoined = resolvePersistedJoinState(String(currentCircleId))
    if (persistedJoined == null) return
    if (circleInfo.value.id == null) {
        circleInfo.value.id = currentCircleId as any
    }
    circleInfo.value.joined = persistedJoined
}

function resolveCircleId(value: unknown): string | number | undefined {
    if (value == null) return undefined
    if (Array.isArray(value)) return resolveCircleId(value[0])
    if (typeof value === 'string' || typeof value === 'number') return value
    return undefined
}

async function fetchCircleInfo() {
    const id = (route.params.id || route.query.id) as string | undefined
    if (!id) {
        proxy?.$modal?.msgError?.('圈子ID不存在')
        router.push('/circle/plaza')
        return
    }

    loading.value = true
    try {
        const res = await getCircleInfo(id)
        const detail = (res as any)?.data ?? res
        if (detail) {
            const joinedFromApi = detail?.member ?? detail?.joined
            const persistedJoined = resolvePersistedJoinState(String(detail?.id ?? id))
            circleInfo.value = {
                ...detail,
                joined: persistedJoined ?? joinedFromApi
            }
            if (circleInfo.value.id != null && joinedFromApi != null) {
                if (persistedJoined == null || persistedJoined === Boolean(joinedFromApi)) {
                    persistJoinState(String(circleInfo.value.id), Boolean(joinedFromApi))
                }
            }
        }
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('获取圈子信息失败')
    } finally {
        loading.value = false
    }
}

async function fetchPosts() {
    const circleId = (route.params.id || route.query.id) as string | undefined
    if (!circleId) return
    loadingPosts.value = true
    try {
        const res = await listPostByApp({ limit: 20, circleId, isCircle: 1 })
        const raw = (res as any)?.data ?? res
        const list = getArrayFrom(raw)
        postList.value = list.map(normalizePostItem).filter(item => item.id !== undefined && item.id !== null)
    } catch (error) {
        console.error(error)
    } finally {
        loadingPosts.value = false
    }
}

async function fetchMembers() {
    const id = (route.params.id || route.query.id) as string | undefined
    if (!id) return
    try {
        const res = await getCircleMemberList({ circleId: id, limit: 20 })
        const raw = (res as any)?.data ?? res
        const list = getArrayFrom(raw)
        const seenMemberIds = new Set<string>()
        memberList.value = list.map(normalizeMemberItem).filter(item => {
            if (item.id === undefined || item.id === null) return false
            const key = String(item.id)
            if (seenMemberIds.has(key)) return false
            seenMemberIds.add(key)
            return true
        })
    } catch (error) {
        console.error(error)
    }
}

function resetAllMembers() {
    allMembers.value = []
    allMembersLastId.value = undefined
    allMembersFinished.value = false
}

function markMemberAsManager(targetId: string | number) {
    const targetKey = String(targetId)
    const updateList = (list: MemberItem[]) => {
        list.forEach(member => {
            if (member.id != null && String(member.id) === targetKey) {
                member.isManager = true
            }
        })
    }
    updateList(memberList.value)
    updateList(allMembers.value)
}

async function fetchAllMembers(loadMore = false) {
    const id = (route.params.id || route.query.id) as string | undefined
    if (!id) return
    if (allMembersLoading.value || allMembersFinished.value) return
    if (!loadMore) resetAllMembers()
    allMembersLoading.value = true
    try {
        const res = await getCircleMemberList({
            circleId: id,
            lastId: allMembersLastId.value,
            limit: 20
        })
        const raw = (res as any)?.data ?? res
        const list = getArrayFrom(raw)
        const nextList = list.map(normalizeMemberItem)
        if (nextList.length < 20) {
            allMembersFinished.value = true
        }
        if (nextList.length) {
            allMembersLastId.value = nextList[nextList.length - 1].id as number | string
            allMembers.value = allMembers.value.concat(nextList)
        }
    } catch (error) {
        console.error(error)
    } finally {
        allMembersLoading.value = false
    }
}

async function handleJoin() {
    if (joinLoading.value) return
    const id = circleInfo.value.id
    if (!id) return
    if (isCircleOwner.value && circleInfo.value.joined) {
        proxy?.$modal?.msgWarning?.('圈主无法退出圈子')
        return
    }

    try {
        joinLoading.value = true
        if (circleInfo.value.joined) {
            const response = await exitCircle(id)
            applyJoinState(false, resolveMemberCountFromResponse(response))
            persistJoinState(String(id), false)
            proxy?.$modal?.msgSuccess?.('已退出')
        } else {
            const response = await joinCircle(id)
            applyJoinState(true, resolveMemberCountFromResponse(response))
            persistJoinState(String(id), true)
            proxy?.$modal?.msgSuccess?.('加入成功')
        }
    } catch (error: any) {
        proxy?.$modal?.msgError?.('操作失败')
    } finally {
        joinLoading.value = false
    }
}

async function handleDeleteCircle() {
    if (!isCircleOwner.value || deleteLoading.value) return
    const circleId = resolveCircleId(circleInfo.value.id ?? route.params.id ?? route.query.id)
    if (!circleId) {
        proxy?.$modal?.msgError?.('圈子ID不存在')
        return
    }
    try {
        await proxy?.$modal?.confirm?.('确定删除该圈子吗？删除后不可恢复。', '提示')
    } catch {
        return
    }

    deleteLoading.value = true
    try {
        await closeCircle(circleId)
        proxy?.$modal?.msgSuccess?.('删除成功')
        router.push('/circle-manage/circle-recommend')
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('删除失败')
    } finally {
        deleteLoading.value = false
    }
}

async function handleKickMember(member: MemberItem) {
    if (!canManageMembers.value || member._kickLoading) return
    if (member.isSelf) return
    const circleId = circleInfo.value.id
    const targetUserId = member.userId ?? member.id
    if (!circleId || !targetUserId) return

    try {
        await proxy?.$modal?.confirm?.(`确定将「${member.name || '该成员'}」移出圈子吗？`, '提示')
    } catch {
        return
    }

    try {
        member._kickLoading = true
        await removeCircleMember(circleId, targetUserId)
        proxy?.$modal?.msgSuccess?.('已踢出成员')
        await fetchMembers()
        if (showAllMembers.value) {
            await fetchAllMembers()
        }
    } catch (error) {
        console.error(error)
        proxy?.$modal?.msgError?.('踢出失败')
    } finally {
        member._kickLoading = false
    }
}

async function handleSetAdmin(member: MemberItem) {
    if (!canManageMembers.value || member.isManager || member._adminLoading) return
    const circleId = circleInfo.value.id
    if (!circleId || !member.id) return

    try {
        member._adminLoading = true
        await setCircleAdmin(circleId, member.id)
        markMemberAsManager(member.id)
        await fetchMembers()
        proxy?.$modal?.msgSuccess?.('设置成功')
    } catch (error: any) {
        proxy?.$modal?.msgError?.('设置失败')
    } finally {
        member._adminLoading = false
    }
}

const handlePublish = () => {
    publishVisible.value = true
}
function goBack() {
    router.push('/circle-manage/circle-recommend')
}

onMounted(() => {
    hydrateJoinedStateFromCache()
    fetchCircleInfo()
    fetchPosts()
    fetchMembers()
})

watch(
    () => [userStore.id, route.params.id, route.query.id],
    () => {
        hydrateJoinedStateFromCache()
    },
    { immediate: true }
)

watch(
    () => showAllMembers.value,
    value => {
        if (value) {
            fetchAllMembers()
        }
    }
)
</script>

<style scoped lang="scss">
.circle-detail-page {
    width: 100%;
    min-height: 100vh;
    background-color: var(--el-bg-color-page);
    --circle-card-bg: var(--el-bg-color);
    --circle-card-radius: 16px;
    --circle-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    --circle-primary-color: var(--el-color-primary);
    --circle-text-main: var(--el-text-color-primary);
    --circle-text-sub: var(--el-text-color-regular);
    --circle-text-muted: var(--el-text-color-secondary);
    --circle-border-color: var(--el-border-color-light);
}

:global(html.dark) .circle-detail-page {
    background-color: #0f1115;
    --circle-card-bg: #1b1f26;
    --circle-card-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    --circle-text-main: #e5e7eb;
    --circle-text-sub: #cbd5e1;
    --circle-text-muted: #94a3b8;
    --circle-border-color: #2a2f3a;
}

.page-wrapper {
    display: flex;
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px;
    gap: 24px;
    align-items: flex-start;
    position: relative;
}

.main-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 90px;
}

.floating-publish-bar {
    position: fixed;
    left: 50%;
    bottom: 10%;
    transform: translateX(-50%);
    width: min(360px, calc(50% - 48px));
    min-width: 240px;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 999px;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-black) 8%, transparent);
    cursor: pointer;
}

.publish-avatar {
    flex-shrink: 0;
}

.publish-placeholder {
    flex: 1;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.publish-plus {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: var(--el-color-primary);
    color: var(--el-color-white);
    font-size: 18px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

@media screen and (max-width: 1200px) {
    .page-wrapper {
        max-width: 100%;
        padding: 20px;
    }
}

@media screen and (max-width: 992px) {
    .page-wrapper {
        flex-direction: column;
        align-items: stretch;
        padding: 16px;
    }

    .main-content {
        order: 2;
    }

    .floating-publish-bar {
        border-radius: 16px;
    }
}
</style>
