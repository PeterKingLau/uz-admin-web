import request from '@/utils/request'
import type { NoticeId, NoticePayload, NoticeQuery } from './notice.types'

export type { NoticeId, NoticePayload, NoticeQuery } from './notice.types'

export function listNotice(query: NoticeQuery) {
    return request({
        url: '/system/notice/list',
        method: 'get',
        params: query
    })
}

export function getNotice(noticeId: NoticeId) {
    return request({
        url: '/system/notice/' + noticeId,
        method: 'get'
    })
}

export function addNotice(data: NoticePayload) {
    return request({
        url: '/system/notice',
        method: 'post',
        data
    })
}

export function updateNotice(data: NoticePayload) {
    return request({
        url: '/system/notice',
        method: 'put',
        data
    })
}

export function delNotice(noticeId: NoticeId) {
    return request({
        url: '/system/notice/' + noticeId,
        method: 'delete'
    })
}
