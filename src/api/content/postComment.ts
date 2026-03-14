import request from '@/utils/request'
import type { DeleteCommentPayload, ListCommentRepliesParams, ListTopCommentsParams } from './postComment.types'

export type { DeleteCommentPayload, ListCommentRepliesParams, ListTopCommentsParams } from './postComment.types'

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
