import request from '@/utils/request'
import type { DictCode, DictDataPayload, DictDataQuery, DictType } from './data.types'

export type { DictCode, DictDataPayload, DictDataQuery, DictType } from './data.types'

export function listData(query: DictDataQuery) {
    return request({
        url: '/system/dict/data/list',
        method: 'get',
        params: query
    })
}

export function getData(dictCode: DictCode) {
    return request({
        url: '/system/dict/data/' + dictCode,
        method: 'get'
    })
}

export function getDicts(dictType: DictType) {
    return request({
        url: '/system/dict/data/type/' + dictType,
        method: 'get'
    })
}

export function addData(data: DictDataPayload) {
    return request({
        url: '/system/dict/data',
        method: 'post',
        data
    })
}

export function updateData(data: DictDataPayload) {
    return request({
        url: '/system/dict/data',
        method: 'put',
        data
    })
}

export function delData(dictCode: DictCode) {
    return request({
        url: '/system/dict/data/' + dictCode,
        method: 'delete'
    })
}
