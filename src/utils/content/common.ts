import { parseTime } from '@/utils/utils'
import { getImgUrl } from '@/utils/img'

type AnyRecord = Record<string, any>

const toTrimmedString = (value: unknown) => String(value ?? '').trim()

const getMediaCandidate = (value: AnyRecord) => value?.url || value?.src || value?.path || value?.fileUrl || ''

const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i
const ALLOWED_RICH_TEXT_TAGS = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    's',
    'strike',
    'del',
    'u',
    'a',
    'blockquote',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr'
])
const SELF_CLOSING_RICH_TEXT_TAGS = new Set(['br', 'hr'])

export const isRichTextContent = (value: unknown) => HTML_TAG_RE.test(String(value || ''))

export const escapeHtml = (value: unknown) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

const isSafeLink = (value: string) => /^(https?:|mailto:|tel:|#|\/)/i.test(value)

const sanitizeRichTextNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent || '')
    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const element = node as HTMLElement
    const tag = element.tagName.toLowerCase()
    const children = Array.from(element.childNodes).map(sanitizeRichTextNode).join('')
    if (!ALLOWED_RICH_TEXT_TAGS.has(tag)) return children

    const attrs: string[] = []
    if (tag === 'a') {
        const href = String(element.getAttribute('href') || '').trim()
        if (href && isSafeLink(href)) {
            attrs.push(`href="${escapeHtml(href)}"`)
            attrs.push('target="_blank"')
            attrs.push('rel="noopener noreferrer"')
        }
    }

    if (SELF_CLOSING_RICH_TEXT_TAGS.has(tag)) return `<${tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`
    return `<${tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>${children}</${tag}>`
}

export const sanitizeRichTextHtml = (value: unknown) => {
    const source = String(value || '').trim()
    if (!source) return ''
    if (!isRichTextContent(source)) return escapeHtml(source).replace(/\n/g, '<br>')
    if (typeof DOMParser === 'undefined' || typeof Node === 'undefined') {
        return escapeHtml(source.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    }

    const doc = new DOMParser().parseFromString(source, 'text/html')
    return Array.from(doc.body.childNodes).map(sanitizeRichTextNode).join('').trim()
}

export const stripHtmlToText = (value: unknown) => {
    const source = String(value || '').trim()
    if (!source) return ''
    if (!isRichTextContent(source)) return source
    if (typeof DOMParser === 'undefined') {
        return source.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }

    const doc = new DOMParser().parseFromString(source, 'text/html')
    return String(doc.body.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

export const resolveMediaUrl = (url: unknown, resolver?: (raw: string) => string) => {
    const raw = toTrimmedString(url)
    if (!raw) return ''
    if (resolver) return resolver(raw)
    if (/^https?:\/\//i.test(raw) || raw.startsWith('//') || /^(blob|data|file):/i.test(raw)) return raw.startsWith('//') ? `${window.location.protocol}${raw}` : raw
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

export const getCommentUserId = (comment: AnyRecord) =>
    comment?.userId ??
    comment?.commentUserId ??
    comment?.fromUserId ??
    comment?.authorId ??
    comment?.createBy ??
    comment?.user?.userId ??
    comment?.user?.id ??
    comment?.author?.userId ??
    comment?.author?.id ??
    null

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

export const createMediaViewerPayloadPost = (post: AnyRecord) => {
    if (!post) return null
    return {
        id: post.id ?? post.postId ?? null,
        postId: post.postId ?? post.id ?? null,
        content: post.content ?? '',
        nickName: post.nickName ?? post.authorName ?? post.userName ?? post.user?.nickName ?? post.author?.nickName ?? '',
        userName: post.userName ?? post.username ?? post.user?.userName ?? post.author?.userName ?? '',
        avatar: post.avatar ?? post.userAvatar ?? post.authorAvatar ?? post.user?.avatar ?? post.author?.avatar ?? '',
        userAvatar: post.userAvatar ?? post.avatar ?? post.authorAvatar ?? post.user?.avatar ?? post.author?.avatar ?? '',
        createTime: post.createTime ?? post.createDate ?? '',
        createDate: post.createDate ?? post.createTime ?? '',
        tags: Array.isArray(post.tags) ? post.tags : [],
        tagStr: post.tagStr ?? ''
    }
}
