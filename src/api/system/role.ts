import request from '@/utils/request'
import type { ChangeRoleStatusPayload, RoleAuthUserPayload, RoleId, RolePayload, RoleQuery } from './role.types'

export type { ChangeRoleStatusPayload, RoleAuthUserPayload, RoleId, RolePayload, RoleQuery } from './role.types'

export function listRole(query: RoleQuery) {
    return request({
        url: '/system/role/list',
        method: 'get',
        params: query
    })
}

export function getRole(roleId: RoleId) {
    return request({
        url: '/system/role/' + roleId,
        method: 'get'
    })
}

export function addRole(data: RolePayload) {
    return request({
        url: '/system/role',
        method: 'post',
        data
    })
}

export function updateRole(data: RolePayload) {
    return request({
        url: '/system/role',
        method: 'put',
        data
    })
}

export function dataScope(data: RolePayload) {
    return request({
        url: '/system/role/dataScope',
        method: 'put',
        data
    })
}

export function changeRoleStatus(roleId: RoleId, status: string | number) {
    const data: ChangeRoleStatusPayload = {
        roleId,
        status
    }
    return request({
        url: '/system/role/changeStatus',
        method: 'put',
        data
    })
}

export function delRole(roleId: RoleId) {
    return request({
        url: '/system/role/' + roleId,
        method: 'delete'
    })
}

export function allocatedUserList(query: RoleQuery) {
    return request({
        url: '/system/role/authUser/allocatedList',
        method: 'get',
        params: query
    })
}

export function unallocatedUserList(query: RoleQuery) {
    return request({
        url: '/system/role/authUser/unallocatedList',
        method: 'get',
        params: query
    })
}

export function authUserCancel(data: RoleAuthUserPayload) {
    return request({
        url: '/system/role/authUser/cancel',
        method: 'put',
        data
    })
}

export function authUserCancelAll(data: RoleAuthUserPayload) {
    return request({
        url: '/system/role/authUser/cancelAll',
        method: 'put',
        params: data
    })
}

export function authUserSelectAll(data: RoleAuthUserPayload) {
    return request({
        url: '/system/role/authUser/selectAll',
        method: 'put',
        params: data
    })
}

export function deptTreeSelect(roleId: RoleId) {
    return request({
        url: '/system/role/deptTree/' + roleId,
        method: 'get'
    })
}
