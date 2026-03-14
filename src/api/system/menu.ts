import request from '@/utils/request'
import type { MenuId, MenuPayload, MenuQuery, RoleId } from './menu.types'

export type { MenuId, MenuPayload, MenuQuery, RoleId } from './menu.types'

export function listMenu(query?: MenuQuery) {
    return request({
        url: '/system/menu/list',
        method: 'get',
        params: query
    })
}

export function getMenu(menuId: MenuId) {
    return request({
        url: '/system/menu/' + menuId,
        method: 'get'
    })
}

export function treeselect() {
    return request({
        url: '/system/menu/treeselect',
        method: 'get'
    })
}

export function roleMenuTreeselect(roleId: RoleId) {
    return request({
        url: '/system/menu/roleMenuTreeselect/' + roleId,
        method: 'get'
    })
}

export function addMenu(data: MenuPayload) {
    return request({
        url: '/system/menu',
        method: 'post',
        data
    })
}

export function updateMenu(data: MenuPayload) {
    return request({
        url: '/system/menu',
        method: 'put',
        data
    })
}

export function delMenu(menuId: MenuId) {
    return request({
        url: '/system/menu/' + menuId,
        method: 'delete'
    })
}

export function getRouters() {
    return request({
        url: '/getRouters',
        method: 'get'
    })
}
