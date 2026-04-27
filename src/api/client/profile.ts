import request from '@/utils/request'

export type ClientUserId = string | number

export function getClientUserProfile(userId: ClientUserId): Promise<any> {
    return request({
        url: '/system/user/app/getInfoById',
        method: 'get',
        params: { userId }
    }) as Promise<any>
}
