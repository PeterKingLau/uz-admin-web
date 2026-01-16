import request from '@/utils/request'

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

export function listTopComments(params: ListTopCommentsParams): Promise<any> {
    return request({
        url: '/content/postComment/app/v1/top',
        method: 'get',
        params
    }) as unknown as Promise<any>
}

export function listCommentReplies(params: ListCommentRepliesParams): Promise<any> {
    return request({
        url: '/content/postComment/app/v1/getReplies',
        method: 'get',
        params
    }) as unknown as Promise<any>
}

export function deleteComment(data: DeleteCommentPayload): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/deleteComment',
        method: 'post',
        data
    }) as unknown as Promise<any>
}
