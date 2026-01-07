import request from '@/utils/request'

export interface TemplateItem {
    [key: string]: any
}

export interface TemplateListResponse {
    code?: number
    msg?: string
    total?: number
    data?: TemplateItem[] | Record<string, any>
    rows?: TemplateItem[]
}

export interface TemplateListParams {
    pageNum?: number
    pageSize?: number
    name?: string
    code?: string
    status?: string
}

export interface AddTemplatePayload {
    interestType: string
    abilityLevel: number
    valueType: string
    personalityTrait: string
    interestDesc: string
    abilityDesc: string
    valueDesc: string
    personalityDesc: string
    comprehensiveDesc: string
    representative: string
}

export interface UpdateTemplatePayload extends AddTemplatePayload {
    id: number
}

export function listTemplates(params?: TemplateListParams) {
    return request<TemplateListResponse>({
        url: '/content/templates/list',
        method: 'get',
        params
    })
}

export function addTemplate(data: AddTemplatePayload) {
    return request({
        url: '/content/templates/add',
        method: 'post',
        data
    })
}

export function updateTemplate(data: UpdateTemplatePayload) {
    return request({
        url: '/content/templates/edit',
        method: 'post',
        data
    })
}

export function deleteTemplate(ids: string | number) {
    return request({
        url: `/content/templates/${ids}`,
        method: 'delete'
    })
}

export function parseTemplateRows(payload: TemplateListResponse | any): TemplateItem[] {
    const rows = payload?.rows ?? payload?.data ?? payload
    if (Array.isArray(rows)) return rows
    if (Array.isArray(rows?.records)) return rows.records
    if (Array.isArray(rows?.list)) return rows.list
    if (Array.isArray(rows?.items)) return rows.items
    return []
}
