import request from '@/utils/request'

export function selectFollowNum(params: { targetUserId?: number | string }): Promise<any> {
    return request({
        url: '/content/userFollow/app/v1/selectFollowNum',
        method: 'get',
        params
    }) as Promise<any>
}

export function listFollowing(params: { lastId?: number | string; size?: number | string }): Promise<any> {
    return request({
        url: '/content/userFollow/app/v1/following',
        method: 'get',
        params
    }) as Promise<any>
}

export function listFollowers(params: { lastId?: number | string; size?: number | string }): Promise<any> {
    return request({
        url: '/content/userFollow/app/v1/followers',
        method: 'get',
        params
    }) as Promise<any>
}

export function listMutual(params: { lastId?: number | string; size?: number | string }): Promise<any> {
    return request({
        url: '/content/userFollow/app/v1/mutual',
        method: 'get',
        params
    }) as Promise<any>
}

export function toggleFollowUser(data: { targetUserId: number | string }): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/follow',
        method: 'post',
        data
    }) as Promise<any>
}
