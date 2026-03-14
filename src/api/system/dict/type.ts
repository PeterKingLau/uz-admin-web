import request from '@/utils/request'
import type { DictId, DictTypePayload, DictTypeQuery } from './type.types'

export type { DictId, DictTypePayload, DictTypeQuery } from './type.types'

export function listType(query: DictTypeQuery) {
    return request({
        url: '/system/dict/type/list',
        method: 'get',
        params: query
    })
}

export function getType(dictId: DictId) {
    return request({
        url: '/system/dict/type/' + dictId,
        method: 'get'
    })
}

export function addType(data: DictTypePayload) {
    return request({
        url: '/system/dict/type',
        method: 'post',
        data
    })
}

export function updateType(data: DictTypePayload) {
    return request({
        url: '/system/dict/type',
        method: 'put',
        data
    })
}

export function delType(dictId: DictId) {
    return request({
        url: '/system/dict/type/' + dictId,
        method: 'delete'
    })
}

export function refreshCache() {
    return request({
        url: '/system/dict/type/refreshCache',
        method: 'delete'
    })
}

export function optionselect() {
    return request({
        url: '/system/dict/type/optionselect',
        method: 'get'
    })
}
