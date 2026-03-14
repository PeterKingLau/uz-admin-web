import request from '@/utils/request'
import type { InfoId, LogininforQuery, UserName } from './logininfor.types'

export type { InfoId, LogininforQuery, UserName } from './logininfor.types'

export function list(query: LogininforQuery) {
    return request({
        url: '/monitor/logininfor/list',
        method: 'get',
        params: query
    })
}

export function delLogininfor(infoId: InfoId) {
    return request({
        url: '/monitor/logininfor/' + infoId,
        method: 'delete'
    })
}

export function unlockLogininfor(userName: UserName) {
    return request({
        url: '/monitor/logininfor/unlock/' + userName,
        method: 'get'
    })
}

export function cleanLogininfor() {
    return request({
        url: '/monitor/logininfor/clean',
        method: 'delete'
    })
}
