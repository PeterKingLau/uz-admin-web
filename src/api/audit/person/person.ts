

import request from '@/utils/request'
import { UserAuditDetailQuery, AuditUserAvatarData, UserAuditDetailResponse } from './person.types'


export function listUserAuditDetail(query: UserAuditDetailQuery): Promise<UserAuditDetailResponse> {
    return request({
        url: '/system/sysUserAuditDetail/list',
        method: 'get',
        params: query
    })
}


export function auditUserAvatar(data: AuditUserAvatarData): Promise<any> {
    return request({
        url: '/system/sysUserAuditDetail/auditAvatar',
        method: 'post',
        data
    })
}
