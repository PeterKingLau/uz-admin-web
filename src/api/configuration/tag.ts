import request from '@/utils/request'
import type {
    AddInterestCategoryPayload,
    AddInterestTagPayload,
    InterestCategoryListRes,
    InterestCategoryQuery,
    InterestTagListRes,
    InterestTagQuery,
    UpdateInterestCategoryPayload,
    UpdateInterestTagPayload
} from './tag.types'

export type {
    AddInterestCategoryPayload,
    AddInterestTagPayload,
    InterestCategoryBasePayload,
    InterestCategoryItem,
    InterestCategoryListRes,
    InterestCategoryQuery,
    InterestTagItem,
    InterestTagListRes,
    InterestTagQuery,
    UpdateInterestCategoryPayload,
    UpdateInterestTagPayload
} from './tag.types'

export function listInterestCategory(query: InterestCategoryQuery) {
    return request<InterestCategoryListRes>({
        url: '/content/interestCategory/list',
        method: 'get',
        params: query
    })
}

export function updateInterestCategory(data: UpdateInterestCategoryPayload) {
    return request({
        url: '/content/interestCategory/update',
        method: 'post',
        data
    })
}

export function addInterestCategory(data: AddInterestCategoryPayload) {
    return request({
        url: '/content/interestCategory',
        method: 'post',
        data
    })
}

export function deleteInterestCategory(id: number) {
    return request({
        url: '/content/interestCategory/delete',
        method: 'post',
        params: { id }
    })
}

export function listInterestTag(query: InterestTagQuery) {
    return request<InterestTagListRes>({
        url: '/content/interestTag/list',
        method: 'get',
        params: query
    })
}

export function addInterestTag(data: AddInterestTagPayload) {
    return request({
        url: '/content/interestTag',
        method: 'post',
        data
    })
}

export function updateInterestTag(data: UpdateInterestTagPayload) {
    return request({
        url: '/content/interestTag/update',
        method: 'post',
        data
    })
}

export function deleteInterestTag(id: number) {
    return request({
        url: '/content/interestTag/delete',
        method: 'post',
        params: { id }
    })
}
