export interface UserAuditDetailQuery {
    pageNum: number
    pageSize: number
    applyType?: string
    auditStatus?: string
    [key: string]: any
}

export interface AuditUserAvatarData {
    id: number
    auditStatus: string 
    auditRemark?: string 
}

export interface UserAuditDetailResponse {
    rows: any[]
    total: number
}
