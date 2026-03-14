export interface ListTopCommentsParams {
    postId: number | string
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
}

export interface ListCommentRepliesParams {
    postId: number | string
    parentId: number | string
    lastId?: number | string
    lastCreateTime?: string
    limit?: number
}

export interface DeleteCommentPayload {
    id: number | string
    userId?: number | string
}
