import request from '@/utils/request'

export interface TopbarConfigItem {
    [key: string]: any
}

export interface TopbarConfigResponse {
    code?: number
    msg?: string
    total?: number
    data?: TopbarConfigItem[] | Record<string, any>
    rows?: TopbarConfigItem[]
}

export interface TopbarListParams {
    pageNum?: number
    pageSize?: number
    code?: string
    name?: string
    isActive?: string
}

export interface AddTopbarPayload {
    code: string
    name: string
    sort?: string | number
    isActive?: string
}

export interface UpdateTopbarPayload extends AddTopbarPayload {
    id: number
}

/**
 * 查询顶部导航栏配置列表
 */
export function listTopbarConfig(params?: TopbarListParams) {
    return request<TopbarConfigResponse>({
        url: '/content/topbar/list',
        method: 'get',
        params
    })
}

export function parseTopbarRows(payload: TopbarConfigResponse | any): TopbarConfigItem[] {
    const rows = (payload as any)?.rows ?? (payload as any)?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    return []
}

/**
 * 新增顶部导航栏配置
 */
export function addTopbarConfig(data: AddTopbarPayload) {
    return request({
        url: '/content/topbar/add',
        method: 'post',
        data
    })
}

/**
 * 更新顶部导航栏配置
 */
export function updateTopbarConfig(data: UpdateTopbarPayload) {
    return request({
        url: '/content/topbar/update',
        method: 'post',
        data
    })
}

/**
 * 删除顶部导航栏配置
 */
export function deleteTopbarConfig(id: number | string) {
    return request({
        url: `/content/topbar/${id}`,
        method: 'delete'
    })
}
