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
