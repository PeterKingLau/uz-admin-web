import request from '@/utils/request'
import type { AddTopbarPayload, TopbarConfigItem, TopbarConfigResponse, TopbarListParams, UpdateTopbarPayload } from './topbar.types'

export type { AddTopbarPayload, TopbarConfigItem, TopbarConfigResponse, TopbarListParams, UpdateTopbarPayload } from './topbar.types'

export function listTopbarConfig(params?: TopbarListParams) {
    return request<TopbarConfigResponse>({
        url: '/content/topbar/list',
        method: 'get',
        params
    })
}

export function parseTopbarRows(payload: TopbarConfigResponse | any): TopbarConfigItem[] {
    const rows = (payload as any)?.rows ?? (payload as any)?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    return []
}

export function addTopbarConfig(data: AddTopbarPayload) {
    return request({
        url: '/content/topbar/add',
        method: 'post',
        data
    })
}

export function updateTopbarConfig(data: UpdateTopbarPayload) {
    return request({
        url: '/content/topbar/update',
        method: 'post',
        data
    })
}

export function deleteTopbarConfig(id: number | string) {
    return request({
        url: `/content/topbar/${id}`,
        method: 'delete'
    })
}
