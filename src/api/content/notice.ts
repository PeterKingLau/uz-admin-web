import request from '@/utils/request'

export interface AnnouncementItem {
    [key: string]: any
}

export interface AnnouncementListParams {
    pageNum?: number
    pageSize?: number
    title?: string
}

export interface AnnouncementListResponse {
    code?: number
    msg?: string
    total?: number
    data?: AnnouncementItem[] | Record<string, any>
    rows?: AnnouncementItem[]
}

export function listAnnouncements(params?: AnnouncementListParams) {
    return request<AnnouncementListResponse>({
        url: '/content/announcement/list',
        method: 'get',
        params
    })
}

export interface AnnouncementAddPayload {
    title: string
    content: string
    jumpUrl: string
    status: string
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
