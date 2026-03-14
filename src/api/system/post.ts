import request from '@/utils/request'
import type { PostId, PostPayload, PostQuery } from './post.types'

export type { PostId, PostPayload, PostQuery } from './post.types'

export function listPost(query: PostQuery) {
    return request({
        url: '/system/post/list',
        method: 'get',
        params: query
    })
}

export function getPost(postId: PostId) {
    return request({
        url: '/system/post/' + postId,
        method: 'get'
    })
}

export function addPost(data: PostPayload) {
    return request({
        url: '/system/post',
        method: 'post',
        data
    })
}

export function updatePost(data: PostPayload) {
    return request({
        url: '/system/post',
        method: 'put',
        data
    })
}

export function delPost(postId: PostId) {
    return request({
        url: '/system/post/' + postId,
        method: 'delete'
    })
}
