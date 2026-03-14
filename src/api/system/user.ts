import request from '@/utils/request'
import { parseStrEmpty } from '@/utils/utils'
import type {
    AuthRolePayload,
    ChangeUserStatusPayload,
    ResetUserPwdPayload,
    UpdateUserPwdPayload,
    UserId,
    UserPayload,
    UserQuery
} from './user.types'

export type { AuthRolePayload, ChangeUserStatusPayload, ResetUserPwdPayload, UpdateUserPwdPayload, UserId, UserPayload, UserQuery } from './user.types'

export function listUser(query: UserQuery) {
    return request({
        url: '/system/user/list',
        method: 'get',
        params: query
    })
}

export function getUser(userId?: UserId) {
    return request({
        url: '/system/user/' + parseStrEmpty(userId == null ? '' : String(userId)),
        method: 'get'
    })
}

export function addUser(data: UserPayload) {
    return request({
        url: '/system/user',
        method: 'post',
        data
    })
}

export function updateUser(data: UserPayload) {
    return request({
        url: '/system/user',
        method: 'put',
        data
    })
}

export function delUser(userId: UserId) {
    return request({
        url: '/system/user/' + userId,
        method: 'delete'
    })
}

export function resetUserPwd(userId: UserId, password: string) {
    const data: ResetUserPwdPayload = {
        userId,
        password
    }
    return request({
        url: '/system/user/resetPwd',
        method: 'put',
        data
    })
}

export function changeUserStatus(userId: UserId, status: string | number) {
    const data: ChangeUserStatusPayload = {
        userId,
        status
    }
    return request({
        url: '/system/user/changeStatus',
        method: 'put',
        data
    })
}

export function getUserProfile() {
    return request({
        url: '/system/user/profile',
        method: 'get'
    })
}

export function getUserInfoById(userId?: UserId) {
    return request({
        url: '/system/user/app/getInfoById',
        method: 'get',
        params: { userId }
    })
}

export function updateUserProfile(data: UserPayload) {
    return request({
        url: '/system/user/profile',
        method: 'put',
        data
    })
}

export function updateUserPwd(oldPassword: string, newPassword: string) {
    const data: UpdateUserPwdPayload = {
        oldPassword,
        newPassword
    }
    return request({
        url: '/system/user/profile/updatePwd',
        method: 'put',
        data
    })
}

export function uploadAvatar(data: FormData | UserPayload) {
    return request({
        url: '/system/user/profile/avatar',
        method: 'post',
        data
    })
}

export function getAuthRole(userId: string) {
    return request({
        url: '/system/user/authRole/' + userId,
        method: 'get'
    })
}

export function updateAuthRole(data: AuthRolePayload) {
    return request({
        url: '/system/user/authRole',
        method: 'put',
        params: data
    })
}

export function deptTreeSelect() {
    return request({
        url: '/system/user/deptTree',
        method: 'get'
    })
}
