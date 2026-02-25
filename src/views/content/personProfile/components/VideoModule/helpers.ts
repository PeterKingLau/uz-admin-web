import { parseTime } from '@/utils/utils'
import { getImgUrl } from '@/utils/img'
import { POST_TYPE } from '@/utils/enum'

type AnyRecord = Record<string, any>

export const resolveActiveFlag = (value: unknown) => {
    if (typeof value === 'boolean') return value
    return value != null ? String(value) === '1' : false
}

export const resolveFollowFlag = (value: unknown) => {
    if (typeof value === 'boolean') return value
    return value != null ? String(value) === '1' : false
}

export const clampRate = (value: unknown) => {
    const n = Number(value)
    if (!Number.isFinite(n)) return 1
    return Math.min(8, Math.max(0.1, n))
}

export const formatCount = (num: unknown) => {
    const n = Number(num || 0)
    if (!n) return '0'
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
    return String(n)
}

export const formatDate = (time: unknown) => {
    if (!time) return ''
    return parseTime(time as string, '{m}-{d}') || ''
}

export const getPostId = (post: AnyRecord) => post?.postId ?? post?.id ?? null

export const resolveCollectionId = (post: AnyRecord) => post?.collectionId ?? post?.postCollectionDto?.collectionId ?? post?.collection?.id ?? null

export const resolveCollectionNameFromResponse = (res: AnyRecord) => {
    const data = res?.data ?? res ?? {}
    const collection =
        data?.collection ??
        data?.collectionInfo ??
        data?.collectionDetail ??
        data?.collectionDto ??
        data?.collectionVO ??
        data?.collectionEntity ??
        data?.info ??
        data?.detail ??
        null
    const name =
        data?.collectionName ||
        data?.collectionTitle ||
        data?.title ||
        collection?.name ||
        collection?.title ||
        collection?.collectionName ||
        collection?.collectionTitle ||
        ''
    return String(name || '').trim()
}

export const getCommentName = (comment: AnyRecord) =>
    comment?.nickName || comment?.userName || comment?.authorName || comment?.nickname || comment?.user?.nickName || '\u7528\u6237'

export const getCommentAvatar = (comment: AnyRecord) => {
    const avatar = comment?.avatar || comment?.userAvatar || comment?.user?.avatar || ''
    return getImgUrl(avatar)
}

export const formatCommentTime = (time: unknown) => {
    if (!time) return ''
    const date = new Date(time as string)
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000

    if (diff < 60) return '\u521a\u521a'
    if (diff < 3600) return `${Math.floor(diff / 60)}\u5206\u949f\u524d`
    if (diff < 86400) return `${Math.floor(diff / 3600)}\u5c0f\u65f6\u524d`
    if (diff < 86400 * 3) return `${Math.floor(diff / 86400)}\u5929\u524d`
    return parseTime(time as string, '{m}-{d}') || ''
}

export const parseMediaRaw = (raw: unknown): any[] => {
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

export const resolveMediaList = (post: AnyRecord) => [
    ...parseMediaRaw(post?.mediaUrls),
    ...parseMediaRaw(post?.mediaList),
    ...parseMediaRaw(post?.files),
    ...parseMediaRaw(post?.resources),
    ...parseMediaRaw(post?.videos)
]

export const resolveMediaUrl = (url: unknown) => (url ? getImgUrl(String(url)) : '')

export const isVideoUrl = (url: unknown) => /\.(mp4|mov|m3u8|mkv|webm|ogg|ogv|avi|wmv|flv)(\?|#|$)/i.test(String(url || ''))

export const resolveCollectionVideoUrl = (post: AnyRecord) => {
    const direct = post?.videoUrl || post?.video || post?.url || post?.src || ''
    if (direct) return resolveMediaUrl(direct)
    const list = resolveMediaList(post)
    const normalized = list
        .map(item => {
            if (typeof item === 'string') return item
            return item?.url || item?.src || item?.path || item?.fileUrl || ''
        })
        .filter(Boolean)
    const candidate = normalized.find(isVideoUrl) || normalized[0] || ''
    return resolveMediaUrl(candidate)
}

export const resolveCollectionCover = (post: AnyRecord) => {
    const cover = post?.cover || post?.coverUrl || post?.thumbnail || post?.poster || post?.image || post?.coverImage || ''
    if (cover) return resolveMediaUrl(cover)
    const list = resolveMediaList(post)
    const candidate = list
        .map(item => {
            if (typeof item === 'string') return item
            return item?.cover || item?.coverUrl || item?.thumbnail || item?.poster || item?.image || item?.url || item?.src || item?.path || ''
        })
        .filter(Boolean)[0]
    return resolveMediaUrl(candidate || '')
}

export const resolveVideoPoster = (post: AnyRecord) => {
    const poster = resolveCollectionCover(post)
    if (poster && !isVideoUrl(poster)) return poster
    return ''
}

export const resolveCollectionTitle = (post: AnyRecord) => {
    const title = post?.title || post?.postTitle || post?.content || post?.description || ''
    const text = String(title || '').trim()
    return text || '\u672a\u547d\u540d\u89c6\u9891'
}

export const isCollectionVideoPost = (post: AnyRecord) =>
    String(post?.postType ?? '') === POST_TYPE.VIDEO || Boolean(resolveCollectionVideoUrl(post))

export const normalizeCollectionPosts = (res: AnyRecord) => {
    const data = res?.data ?? res?.rows ?? res?.list ?? res?.records ?? []
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.posts)) return data.posts
    if (Array.isArray(res?.posts)) return res.posts
    return []
}

export const buildContentParts = (content: unknown) => {
    const text = String(content || '')
    if (!text) return []
    const regex = /#[^#\s]+/g
    const parts: Array<{ text: string; isTag: boolean }> = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(text))) {
        if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), isTag: false })
        parts.push({ text: match[0], isTag: true })
        lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isTag: false })
    return parts.length ? parts : [{ text, isTag: false }]
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const formatClock = (seconds: unknown) => {
    const sec = Math.max(0, Math.floor(Number(seconds) || 0))
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const r = sec % 60
    const mm = String(m).padStart(2, '0')
    const rr = String(r).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${rr}` : `${m}:${rr.padStart(2, '0')}`
}

export const isTypingTarget = (el: any) => {
    if (!el) return false
    const tag = String(el.tagName || '').toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
    if (el.isContentEditable) return true
    return false
}
