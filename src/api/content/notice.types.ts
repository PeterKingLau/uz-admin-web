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

export interface AnnouncementAddPayload {
    title: string
    content: string
    jumpUrl: string
    status: string
}
