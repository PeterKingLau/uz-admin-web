import request from '@/utils/request'
import type { AnnouncementAddPayload, AnnouncementItem, AnnouncementListParams, AnnouncementListResponse } from './notice.types'

export type { AnnouncementAddPayload, AnnouncementItem, AnnouncementListParams, AnnouncementListResponse } from './notice.types'

export function listAnnouncements(params?: AnnouncementListParams) {
    return request<AnnouncementListResponse>({
        url: '/content/announcement/list',
        method: 'get',
        params
    })
}

export function addAnnouncement(data: AnnouncementAddPayload) {
    return request({
        url: '/content/announcement/add',
        method: 'post',
        data
    })
}

export function deleteAnnouncement(ids: string | number) {
    return request({
        url: `/content/announcement/${ids}`,
        method: 'get'
    })
}

export function parseAnnouncementRows(payload: AnnouncementListResponse | any): AnnouncementItem[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    return []
}
