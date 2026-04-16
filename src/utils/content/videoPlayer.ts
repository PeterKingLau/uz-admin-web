import { POST_TYPE } from '@/utils/enum'

export const VIDEO_PLAYER_CACHE_KEY = 'video-player-payload'

type UserStoreLike = {
    id?: unknown
    userId?: unknown
    nickName?: string
    name?: string
    avatar?: string
}

type RouteLike = {
    fullPath?: string
}

type RouterLike = {
    push: (location: { name: string; params: { id: unknown }; query: { from: string } }) => unknown
}

type CacheSessionLike = {
    setJSON?: (key: string, value: unknown) => void
}

type OpenVideoPlayerPreviewOptions = {
    item: Record<string, any> | null | undefined
    getVideoUrl: (item: Record<string, any>) => string
    normalizePostFlags: (item: Record<string, any>) => Record<string, any>
    userStore: UserStoreLike
    cacheSession?: CacheSessionLike
    router: RouterLike
    route: RouteLike
}

export function buildCurrentUserPayload(userStore: UserStoreLike) {
    const currentUserId = userStore.id ?? userStore.userId ?? null
    return {
        id: currentUserId,
        userId: currentUserId,
        nickName: userStore.nickName || userStore.name || '',
        userName: userStore.name || userStore.nickName || '',
        avatar: userStore.avatar || ''
    }
}

export function openVideoPlayerPreview(options: OpenVideoPlayerPreviewOptions): boolean {
    const { item, getVideoUrl, normalizePostFlags, userStore, cacheSession, router, route } = options
    if (!item) return false
    if (String(item.postType) !== String(POST_TYPE.VIDEO)) return false

    const src = getVideoUrl(item)
    const postId = item?.postId ?? item?.id
    if (!src || postId == null) return false

    const from = route?.fullPath || ''
    const normalized = normalizePostFlags(item)
    const cacheKey = `${VIDEO_PLAYER_CACHE_KEY}:${postId}`

    cacheSession?.setJSON?.(cacheKey, {
        id: postId,
        src,
        post: normalized,
        userInfo: buildCurrentUserPayload(userStore),
        from
    })

    router.push({ name: 'VideoPlayer', params: { id: postId }, query: { from } })
    return true
}
