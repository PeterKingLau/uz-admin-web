import request from '@/utils/request'
import type { CreateTablePayload, GenTablePayload, GenTableQuery, ImportTablePayload, TableId, TableName } from './gen.types'

export type { CreateTablePayload, GenTablePayload, GenTableQuery, ImportTablePayload, TableId, TableName } from './gen.types'

export function listTable(query: GenTableQuery) {
    return request({
        url: '/tool/gen/list',
        method: 'get',
        params: query
    })
}

export function listDbTable(query: GenTableQuery) {
    return request({
        url: '/tool/gen/db/list',
        method: 'get',
        params: query
    })
}

export function getGenTable(tableId: TableId) {
    return request({
        url: '/tool/gen/' + tableId,
        method: 'get'
    })
}

export function updateGenTable(data: GenTablePayload) {
    return request({
        url: '/tool/gen',
        method: 'put',
        data
    })
}

export function importTable(data: ImportTablePayload) {
    return request({
        url: '/tool/gen/importTable',
        method: 'post',
        params: data
    })
}

export function createTable(data: CreateTablePayload) {
    return request({
        url: '/tool/gen/createTable',
        method: 'post',
        params: data
    })
}

export function previewTable(tableId: string) {
    return request({
        url: '/tool/gen/preview/' + tableId,
        method: 'get'
    })
}

export function delTable(tableId: string) {
    return request({
        url: '/tool/gen/' + tableId,
        method: 'delete'
    })
}

export function genCode(tableName: TableName) {
    return request({
        url: '/tool/gen/genCode/' + tableName,
        method: 'get'
    })
}

export function synchDb(tableName: TableName) {
    return request({
        url: '/tool/gen/synchDb/' + tableName,
        method: 'get'
    })
}
