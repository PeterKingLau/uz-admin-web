import request from '@/utils/request'

export interface CreateCirclePayload {
    name: string
    description: string
    coverUrl: string
}

export interface UpdateCirclePayload extends CreateCirclePayload {
    id: number | string
}

export interface CircleItem {
    id: number | string
    name: string
    description: string
    coverUrl: string
    type?: string | number
    ownerUserId?: number | string
    memberCount?: number
    postCount?: number
    status?: string | number
    auditStatus?: string | number
    reason?: string | null
    remark?: string | null
    createBy?: string
    updateBy?: string
    member?: boolean
    createTime?: string
    updateTime?: string
    [key: string]: any
}

export interface CircleListResponse {
    code?: number
    msg?: string
    total?: number
    data?: CircleItem[] | Record<string, any>
    rows?: CircleItem[]
}

export interface CircleListParams {
    pageNum?: number
    pageSize?: number
    name?: string
    cursorId?: number | string
}

export interface CircleMemberItem {
    id: number | string
    userId?: number | string
    nickName?: string
    avatar?: string
    signature?: string
    role?: string
    relationType?: string
    status?: string
    [key: string]: any
}

export interface CircleMemberListParams {
    circleId?: number | string
    lastId?: number | string
    limit?: number
}

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
    return request<{ data?: CircleItem; code?: number; msg?: string }>({
        url: '/content/circleManagement/getInfoById',
        method: 'get',
        params: { id }
    })
}

export function getCircleMemberList(params?: CircleMemberListParams) {
    return request<{ data?: CircleMemberItem[]; code?: number; msg?: string }>({
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
