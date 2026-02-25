import { parseTime } from '@/utils/utils'
import { getImgUrl } from '@/utils/img'

type AnyRecord = Record<string, any>

const toTrimmedString = (value: unknown) => String(value ?? '').trim()

const getMediaCandidate = (value: AnyRecord) => value?.url || value?.src || value?.path || value?.fileUrl || ''

export const resolveMediaUrl = (url: unknown, resolver?: (raw: string) => string) => {
    const raw = toTrimmedString(url)
    if (!raw) return ''
    if (resolver) return resolver(raw)
    if (/^https?:\/\//i.test(raw)) return raw
    return getImgUrl(raw)
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

export const parseMediaUrls = (raw: unknown) =>
    parseMediaRaw(raw)
        .map(item => (typeof item === 'string' ? item : getMediaCandidate(item)))
        .map(item => String(item || '').trim())
        .filter(Boolean)

export const normalizeMediaUrls = (raw: unknown, resolver?: (raw: string) => string) =>
    parseMediaUrls(raw)
        .map(item => resolveMediaUrl(item, resolver))
        .filter(Boolean)

export const formatRelativeTime = (time: unknown) => {
    if (!time) return ''
    let date = new Date(time as string)
    if (Number.isNaN(date.getTime())) {
        date = new Date(String(time).replace(/-/g, '/'))
    }
    if (Number.isNaN(date.getTime())) return String(time)
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    if (diff < 86400 * 3) return `${Math.floor(diff / 86400)}天前`
    return parseTime(time as string, '{m}-{d}') || ''
}

export const getCommentId = (comment: AnyRecord) => comment?.id ?? comment?.commentId ?? comment?._id ?? null

export const getCommentUserId = (comment: AnyRecord) => comment?.userId ?? comment?.user?.id ?? comment?.authorId ?? comment?.createBy ?? null

export const getCommentReplyCount = (comment: AnyRecord) => {
    const value = comment?.replyCount ?? comment?.replyNum ?? comment?.replyCnt ?? 0
    return Math.max(0, Number(value) || 0)
}

export const normalizeCommentList = (response: AnyRecord) => {
    if (!response) return []
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.rows)) return response.rows
    if (Array.isArray(response?.list)) return response.list
    const data = response?.data ?? {}
    if (Array.isArray(data?.list)) return data.list
    if (Array.isArray(data?.rows)) return data.rows
    if (Array.isArray(data?.records)) return data.records
    if (Array.isArray(data?.items)) return data.items
    return []
}

export const resolveFollowFlag = (value: unknown) => {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    const text = String(value).trim().toLowerCase()
    if (['1', 'true', 'yes', 'y'].includes(text)) return true
    if (['0', 'false', 'no', 'n'].includes(text)) return false
    return undefined
}

export const resolvePreviewFollowState = (target: AnyRecord) => {
    if (!target) return false
    const raw = target.follow ?? target.isFollow ?? target.isFollowing ?? target.followed ?? target.followStatus ?? target.following
    const normalized = resolveFollowFlag(raw)
    if (typeof normalized === 'boolean') return normalized
    const relation = String(target.relationType || target.relation || target.followRelation || '').toUpperCase()
    return relation === 'MUTUAL' || relation === 'FOLLOWING'
}

export const setPreviewFollowState = (target: AnyRecord, nextFollowing: boolean) => {
    if (!target) return
    target.follow = nextFollowing
    target.isFollow = nextFollowing
    target.isFollowing = nextFollowing
    target.followed = nextFollowing
    target.followStatus = nextFollowing ? '1' : '0'
}

export const toLocalDateTime = (date = new Date()) => {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export const appendPreviewComment = (post: AnyRecord, comment: AnyRecord) => {
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
