export interface UserAuditDetailQuery {
    pageNum: number
    pageSize: number
    applyType?: string
    auditStatus?: string
    [key: string]: any
}

export interface AuditUserAvatarData {
    id: number
    auditStatus: string // '1' 为通过, '2' 为驳回
    auditRemark?: string // 可选
}

export interface UserAuditDetailResponse {
    rows: any[]
    total: number
}
