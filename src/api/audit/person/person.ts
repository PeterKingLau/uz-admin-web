// src/api/audit.ts

import request from '@/utils/request'
import { UserAuditDetailQuery, AuditUserAvatarData, UserAuditDetailResponse } from './person.types'

// 个人资料审核列表
export function listUserAuditDetail(query: UserAuditDetailQuery): Promise<UserAuditDetailResponse> {
    return request({
        url: '/system/sysUserAuditDetail/list',
        method: 'get',
        params: query
    })
}

// 个人资料审核（通过 / 驳回）
export function auditUserAvatar(data: AuditUserAvatarData): Promise<any> {
    return request({
        url: '/system/sysUserAuditDetail/auditAvatar',
        method: 'post',
        data
    })
}
