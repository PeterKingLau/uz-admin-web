import request from '@/utils/request'
import type { DeptId, DeptPayload, DeptQuery } from './dept.types'

export type { DeptId, DeptPayload, DeptQuery } from './dept.types'

export function listDept(query?: DeptQuery) {
    return request({
        url: '/system/dept/list',
        method: 'get',
        params: query
    })
}

export function listDeptExcludeChild(deptId: DeptId) {
    return request({
        url: '/system/dept/list/exclude/' + deptId,
        method: 'get'
    })
}

export function getDept(deptId: DeptId) {
    return request({
        url: '/system/dept/' + deptId,
        method: 'get'
    })
}

export function addDept(data: DeptPayload) {
    return request({
        url: '/system/dept',
        method: 'post',
        data
    })
}

export function updateDept(data: DeptPayload) {
    return request({
        url: '/system/dept',
        method: 'put',
        data
    })
}

export function delDept(deptId: DeptId) {
    return request({
        url: '/system/dept/' + deptId,
        method: 'delete'
    })
}
