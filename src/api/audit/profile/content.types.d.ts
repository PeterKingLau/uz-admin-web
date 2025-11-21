// 列表查询参数
export interface ContentAuditQuery {
    pageNum?: number
    pageSize?: number
    auditStatus?: string
    keyword?: string
    [key: string]: any
}

// 审核入参
export interface AuditPostData {
    id: number
    auditStatus: string
    reason: string
}

// 通用分页结果
export interface PageResult<T> {
    total: number
    rows: T[]
}

// 单条内容
export interface ContentItem {
    id: number
    title: string
    coverUrl?: string
    createTime: string
    auditStatus: string
    [key: string]: any
}
