import type { OssCredentialType } from '@/utils/content/ossUpload'

export type PostId = number | string

export interface ContentPostAuthor {
    id?: PostId
    userId?: PostId
    nickName?: string
    userName?: string
    avatar?: string
    [key: string]: unknown
}

export interface ContentPostTag {
    id?: PostId
    tagId?: PostId
    name?: string
    tagName?: string
    label?: string
    [key: string]: unknown
}

export interface ContentPostItem {
    id?: PostId
    postId?: PostId
    originalPostId?: PostId
    postType?: string | number
    content?: string
    mediaUrls?: string | string[] | Array<Record<string, unknown>>
    files?: string | string[] | Array<Record<string, unknown>>
    cover?: string
    coverUrl?: string
    thumbnail?: string
    poster?: string
    image?: string
    userId?: PostId
    authorId?: PostId
    targetUserId?: PostId
    createBy?: PostId
    nickName?: string
    userName?: string
    avatar?: string
    userAvatar?: string
    user?: ContentPostAuthor
    author?: ContentPostAuthor
    tags?: ContentPostTag[]
    tagIds?: PostId[]
    tagStr?: string
    likeCount?: number
    commentCount?: number
    bookmarkCount?: number
    collectCount?: number
    repostCount?: number
    shareCount?: number
    isLiked?: boolean
    like?: boolean
    isCollected?: boolean
    bookmark?: boolean
    createTime?: string
    createDate?: string
    [key: string]: unknown
}

export interface ListPostResponse<T = ContentPostItem> {
    rows?: T[]
    list?: T[]
    records?: T[]
    items?: T[]
    data?: T[] | {
        rows?: T[]
        list?: T[]
        records?: T[]
        items?: T[]
        total?: number
        count?: number
        [key: string]: unknown
    }
    total?: number
    count?: number
    [key: string]: unknown
}

export interface PostActionResponse<T = unknown> {
    code?: number
    msg?: string
    message?: string
    data?: T
    [key: string]: unknown
}

export interface TogglePostActionData {
    active?: boolean
    count?: number
    [key: string]: unknown
}

export type TogglePostActionResponse = PostActionResponse<TogglePostActionData>
export type CreatePostResponse = PostActionResponse<ContentPostItem>
export type DeletePostResponse = PostActionResponse

export interface CreatePostPayload {
    postType: string
    content: string
    mediaUrls: string[]
    originalPostId: PostId
    tags: string
    circleId: string
    isQuestion: string
}

export interface AddPostPayload {
    postType: string
    content: string
    tagStr?: string
    tags?: string
    files?: File[]
    coverFile?: File | null
    mediaUrls?: string | string[]
    originalPostId?: PostId
    circleId?: PostId
    isQuestion?: string | number | boolean
    ossType?: OssCredentialType | string
}

export interface UpdatePostTagPayload {
    postId: PostId
    tagStr: string
}

export interface LikePostPayload {
    postId: PostId
    targetUserId: PostId
}

export interface BookmarkPostPayload {
    postId: PostId
    targetUserId: PostId
}

export interface AddCommentPayload {
    postId: PostId
    content: string
    targetUserId: PostId
    parentCommentId?: PostId
    replyUserId?: PostId
}

export interface RepostPostPayload {
    originalPostId: PostId
    content: string
}

export interface ListPostByAppParams {
    tagId?: PostId
    postType?: string
    lastId?: PostId
    lastCreateTime?: string
    limit?: number
    content?: string
    targetUserId?: PostId
    circleId?: PostId
    isQuestion?: number | string
    isCircle?: number | string
}

export interface RecommendFeedParams {
    lastId?: PostId
    lastCreateTime?: string
    limit?: number
    isQuestion?: number | string
    circleId?: PostId
    isCircle?: number | string
}

export interface ListPostByLikeParams {
    lastId?: PostId
    lastCreateTime?: string
    limit?: number
    targetUserId?: PostId
}

export interface ListPostByBookMarkParams {
    lastId?: PostId
    lastCreateTime?: string
    limit?: number
    targetUserId?: PostId
}

export interface DeletePostParams {
    postIds: PostId[]
}

export interface PinPostManuallyParams {
    postId?: PostId
    days?: number
}

export interface UnpinPostManuallyParams {
    postId?: PostId
}
