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
