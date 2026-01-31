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
    interestType?: string
    abilityLevel?: number | string
    valueType?: string
    personalityTrait?: string
    status?: string
}

export interface RepresentativeItem {
    name: string
    description: string
    image: string
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
    representativeList: RepresentativeItem[]
}

export interface UpdateTemplatePayload extends AddTemplatePayload {
    id: number
}

export interface InterestTypeItem {
    code: string
    name: string
    description?: string
    color?: string
    [key: string]: any
}

export interface InterestTypeResponse {
    code?: number
    msg?: string
    data?: InterestTypeItem[] | Record<string, any>
    rows?: InterestTypeItem[]
}

// ========== 模板相关接口 ==========

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

export function getInterestTypes() {
    return request<InterestTypeResponse>({
        url: '/content/interestTypes/list',
        method: 'get'
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

export function parseInterestTypes(payload: InterestTypeResponse | any): InterestTypeItem[] {
    const candidates = [payload?.data, payload?.rows, payload?.list, payload?.data?.list, payload?.data?.rows, payload]

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate.map(item => normalizeInterestTypeItem(item))
        }
    }

    return []
}

function normalizeInterestTypeItem(item: any): InterestTypeItem {
    return {
        code: item?.code ?? item?.typeCode ?? item?.interestCode ?? item?.interestType ?? '',
        name: item?.name ?? item?.typeName ?? item?.interestName ?? item?.label ?? '',
        description: item?.description ?? item?.desc ?? item?.remark ?? '',
        color: item?.color ?? item?.tagColor ?? item?.tagType ?? ''
    }
}
