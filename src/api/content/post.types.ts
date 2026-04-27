import type { OssCredentialType } from '@/utils/content/ossUpload'

export interface CreatePostPayload {
    postType: string
    content: string
    mediaUrls: string[]
    originalPostId: number | string
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
    originalPostId?: number | string
    circleId?: string | number
    isQuestion?: string | number | boolean
    ossType?: OssCredentialType | string
}

export interface UpdatePostTagPayload {
    postId: number | string
    tagStr: string
}

export interface LikePostPayload {
    postId: number | string
    targetUserId: number | string
}

export interface BookmarkPostPayload {
    postId: number | string
    targetUserId: number | string
}

export interface AddCommentPayload {
    postId: number | string
    content: string
    targetUserId: number | string
    parentCommentId?: number | string
    replyUserId?: number | string
}

export interface RepostPostPayload {
    originalPostId: number | string
    content: string
}

export interface ListPostByAppParams {
    tagId?: number | string
    postType?: string
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
    content?: string
    targetUserId?: number | string
    circleId?: number | string
    isQuestion?: number | string
    isCircle?: number | string
}

export interface RecommendFeedParams {
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
    isQuestion?: number | string
    circleId?: number | string
    isCircle?: number | string
}

export interface ListPostByLikeParams {
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
    targetUserId?: number | string
}

export interface ListPostByBookMarkParams {
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
    targetUserId?: number | string
}

export interface DeletePostParams {
    postIds: Array<string | number>
}

export interface PinPostManuallyParams {
    postId?: number | string
    days?: number
}

export interface UnpinPostManuallyParams {
    postId?: number | string
}
