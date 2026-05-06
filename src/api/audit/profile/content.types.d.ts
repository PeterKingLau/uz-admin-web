
export interface ContentAuditQuery {
    pageNum?: number
    pageSize?: number
    auditStatus?: string
    keyword?: string
    [key: string]: any
}


export interface AuditPostData {
    id: number
    auditStatus: string
    reason: string
}


export interface PageResult<T> {
    total: number
    rows: T[]
}


export interface ContentItem {
    id: number
    title: string
    coverUrl?: string
    createTime: string
    auditStatus: string
    [key: string]: any
}
