<template>
    <div class="circle-detail-page">
        <div class="page-wrapper">
            <CircleDetailLeftSidebar :circle-name="circleInfo.name" @go-back="goBack" />

            <main v-loading="loading" class="main-content">
                <CircleDetailHeader
                    :circle-info="circleInfo"
                    :join-loading="joinLoading"
                    :get-img-url="getImgUrl"
                    :format-number="formatNumber"
                    @join="handleJoin"
                />
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
            :current-user-id="userStore.id"
            :all-members-loading="allMembersLoading"
            :all-members="allMembers"
            :all-members-finished="allMembersFinished"
            :get-img-url="getImgUrl"
            @load-more="fetchAllMembers(true)"
            @set-admin="handleSetAdmin"
        />
    </div>
</template>

<script setup lang="ts" name="CircleDetail">
import { ref, onMounted, getCurrentInstance, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getImgUrl } from '@/utils/img'
import { getCircleInfo, getCircleMemberList, joinCircle, exitCircle, setCircleAdmin, type CircleItem } from '@/api/content/circleManagement'
import { listPostByApp } from '@/api/content/post'
import useUserStore from '@/store/modules/user'
import { useCircleJoinStore } from '@/store/modules/circleJoin'
import CircleDetailLeftSidebar from './circleDetailLeftSidebar.vue'
import CircleDetailHeader from './circleDetailHeader.vue'
import CircleDetailPosts from './circleDetailPosts.vue'
import CircleDetailRightSidebar from './circleDetailRightSidebar.vue'
import CircleMembersDialog from './circleMembersDialog.vue'

const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance() || {}
const userStore = useUserStore()
const circleJoinStore = useCircleJoinStore()

const userAvatar = computed(() => userStore.avatar)
const userName = computed(() => userStore.nickName || userStore.name || '我')

interface CircleInfoExtended extends CircleItem {
    joined?: boolean
    memberCount?: number
    postCount?: number
    memberLabel?: string
    avatar?: string
    rules?: string[]
}

interface PostItem {
    id: string | number
    title: string
    content?: string
    authorName?: string
    authorAvatar?: string
    images?: string[]
    videoUrl?: string
    isTop?: boolean
    likeCount?: number
    commentCount?: number
    createTime?: string
    updateTime?: string
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
}

const loading = ref(false)
const loadingPosts = ref(false)
const joinLoading = ref(false)
const showFullIntro = ref(false)
const showAllMembers = ref(false)
const allMembers = ref<MemberItem[]>([])
const allMembersLoading = ref(false)
const allMembersFinished = ref(false)
const allMembersLastId = ref<number | string | undefined>(undefined)

const circleInfo = ref<Partial<CircleInfoExtended>>({})
const postList = ref<PostItem[]>([])
const memberList = ref<MemberItem[]>([])

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

function resolveImageList(item: any): string[] {
    const raw = item?.images ?? item?.imageList ?? item?.pictureList ?? item?.pictures ?? item?.mediaUrls ?? item?.files
    if (Array.isArray(raw)) {
        return raw.map(entry => (typeof entry === 'string' ? entry : (entry?.url ?? entry?.src ?? entry?.path ?? ''))).filter(Boolean)
    }
    if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed) return []
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed)
                return Array.isArray(parsed) ? parsed : []
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
    return []
}

function normalizePostItem(item: any): PostItem {
    const author = item?.author ?? item?.user ?? {}
    return {
        id: item?.id ?? item?.postId ?? item?.topicId ?? item?.contentId ?? item?.pk ?? item?.uuid,
        title: item?.title ?? item?.postTitle ?? item?.topicTitle ?? '',
        content: item?.content ?? item?.text ?? item?.summary ?? item?.desc ?? '',
        authorName: item?.authorName ?? item?.nickName ?? item?.userName ?? author?.nickName ?? author?.name ?? '',
        authorAvatar: item?.authorAvatar ?? item?.avatar ?? item?.userAvatar ?? author?.avatar ?? '',
        images: resolveImageList(item),
        isTop: Boolean(item?.isTop ?? item?.top ?? item?.pinned),
        likeCount: item?.likeCount ?? item?.likes ?? item?.thumbCount,
        commentCount: item?.commentCount ?? item?.comments ?? item?.replyCount,
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
    const resolvedUserId =
        item?.userId ??
        item?.uid ??
        item?.memberUserId ??
        item?.accountId ??
        item?.creatorId ??
        item?.ownerId
    const resolvedId = item?.id ?? item?.memberId ?? item?.memberRecordId ?? null
    const resolvedName = item?.name ?? item?.nickName ?? item?.userName ?? ''
    const selfId = userStore.id
    const selfName = userStore.nickName || userStore.name || ''
    const isSelf =
        (selfId != null &&
            (String(resolvedUserId ?? '') === String(selfId) || String(resolvedId ?? '') === String(selfId))) ||
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
        const res = await listPostByApp({ limit: 20, circleId })
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

    try {
        joinLoading.value = true
        if (circleInfo.value.joined) {
            await exitCircle(id)
            circleInfo.value.joined = false
            persistJoinState(String(id), false)
            proxy?.$modal?.msgSuccess?.('已退出')
        } else {
            await joinCircle(id)
            circleInfo.value.joined = true
            persistJoinState(String(id), true)
            proxy?.$modal?.msgSuccess?.('加入成功')
        }
    } catch (error: any) {
        proxy?.$modal?.msgError?.('操作失败')
    } finally {
        joinLoading.value = false
    }
}

async function handleSetAdmin(member: MemberItem) {
    if (!isCircleOwner.value || member.isManager || member._adminLoading) return
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

function handlePublish() {}
function goBack() {
    router.push('/circle-manage/circle-recommend')
}

onMounted(() => {
    fetchCircleInfo()
    fetchPosts()
    fetchMembers()
})

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
    background-color: var(--el-bg-color-page);
    --circle-card-bg: var(--el-bg-color);
    --circle-card-border: var(--el-border-color-light);
    --circle-hover-bg: var(--el-fill-color-light);
    --circle-text-main: var(--el-text-color-primary);
    --circle-text-sub: var(--el-text-color-regular);
    --circle-text-muted: var(--el-text-color-secondary);
}

.page-wrapper {
    display: flex;
    max-width: 1360px;
    margin: 0 auto;
    padding: 24px 32px;
    gap: 24px;
    align-items: flex-start;
}

.main-content {
    flex: 1;
    min-width: 0;
    background: transparent;
    min-height: 80vh;
}
@media screen and (max-width: 1200px) {
    .page-wrapper {
        margin: 0 20px;
    }
}

@media screen and (max-width: 1024px) {
    .page-wrapper {
        justify-content: center;
        margin: 0 16px;
    }
}

@media screen and (max-width: 768px) {
    .page-wrapper {
        flex-direction: column;
        padding-top: 0;
        margin: 0;
    }
}
</style>
