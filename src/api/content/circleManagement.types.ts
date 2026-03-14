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

export interface CircleInfoResponse {
    data?: CircleItem
    code?: number
    msg?: string
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

export interface CircleMemberListResponse {
    data?: CircleMemberItem[]
    code?: number
    msg?: string
}
