import request from '@/utils/request'
import type {
    CircleInfoResponse,
    CircleItem,
    CircleListParams,
    CircleListResponse,
    CircleMemberListParams,
    CircleMemberListResponse,
    CreateCirclePayload,
    UpdateCirclePayload
} from './circleManagement.types'

export type {
    CircleInfoResponse,
    CircleItem,
    CircleListParams,
    CircleListResponse,
    CircleMemberItem,
    CircleMemberListParams,
    CircleMemberListResponse,
    CreateCirclePayload,
    UpdateCirclePayload
} from './circleManagement.types'

export function createCircle(data: CreateCirclePayload) {
    return request({
        url: '/content/circleManagement/create',
        method: 'post',
        data
    })
}

export function updateCircle(data: UpdateCirclePayload) {
    return request({
        url: '/content/circleManagement/update',
        method: 'post',
        data
    })
}

export function listCircles(params?: CircleListParams) {
    return request<CircleListResponse>({
        url: '/content/circleManagement/recommendedCircles',
        method: 'get',
        params
    })
}

export function listMyJoinedCircles() {
    return request<CircleListResponse>({
        url: '/content/circleManagement/myJoinedCircles',
        method: 'get'
    })
}

export function closeCircle(id: number | string) {
    return request({
        url: `/content/circleManagement/close/${id}`,
        method: 'post'
    })
}

export function joinCircle(circleId: number | string) {
    return request({
        url: '/content/circleManagement/joinCircle',
        method: 'post',
        params: { circleId }
    })
}

export function exitCircle(circleId: number | string) {
    return request({
        url: '/content/circleManagement/exitCircle',
        method: 'post',
        params: { circleId }
    })
}

export function getCircleInfo(id: number | string) {
    return request<CircleInfoResponse>({
        url: '/content/circleManagement/getInfoById',
        method: 'get',
        params: { id }
    })
}

export function getCircleMemberList(params?: CircleMemberListParams) {
    return request<CircleMemberListResponse>({
        url: '/content/circleMemberList/getList',
        method: 'get',
        params
    })
}

export function setCircleAdmin(circleId: number | string, targetUserId: number | string) {
    return request({
        url: '/content/circleManagement/setAdmin',
        method: 'post',
        params: { circleId, targetUserId }
    })
}

export function removeCircleMember(circleId: number | string, targetUserId: number | string) {
    return request({
        url: '/content/circleManagement/kickMember',
        method: 'post',
        params: { circleId, targetUserId }
    })
}

export function parseCircleRows(payload: CircleListResponse | any): CircleItem[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    if (Array.isArray(rows?.items)) return rows.items
    return []
}
