import request from '@/utils/request'
import type { FollowListParams, SelectFollowNumParams, ToggleFollowUserPayload } from './userFollow.types'

export type { FollowListParams, SelectFollowNumParams, ToggleFollowUserPayload, UserId } from './userFollow.types'

export function selectFollowNum(params: SelectFollowNumParams): Promise<any> {
    return request({
        url: '/content/userFollow/app/v1/selectFollowNum',
        method: 'get',
        params
    }) as Promise<any>
}

export function listFollowing(params: FollowListParams): Promise<any> {
    return request({
        url: '/content/userFollow/app/v1/following',
        method: 'get',
        params
    }) as Promise<any>
}

export function listFollowers(params: FollowListParams): Promise<any> {
    return request({
        url: '/content/userFollow/app/v1/followers',
        method: 'get',
        params
    }) as Promise<any>
}

export function listMutual(params: FollowListParams): Promise<any> {
    return request({
        url: '/content/userFollow/app/v1/mutual',
        method: 'get',
        params
    }) as Promise<any>
}

export function toggleFollowUser(data: ToggleFollowUserPayload): Promise<any> {
    return request({
        url: '/content/postInfo/app/v1/follow',
        method: 'post',
        data
    }) as Promise<any>
}
