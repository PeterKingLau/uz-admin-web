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

function safeParseJson<T = any>(value: unknown): T | unknown {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    if (!trimmed) return value
    const isJsonLike =
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}'))
    if (!isJsonLike) return value
    try {
        return JSON.parse(trimmed) as T
    } catch {
        return value
    }
}

function pickString(...values: unknown[]): string {
    for (const value of values) {
        const normalized = String(value ?? '').trim()
        if (normalized) return normalized
    }
    return ''
}

function normalizeRepresentativeList(value: unknown): RepresentativeItem[] {
    const parsedValue = safeParseJson(value)
    if (!Array.isArray(parsedValue)) return []

    return parsedValue
        .map((item: any) => ({
            name: pickString(item?.name, item?.personName, item?.representativeName, item?.title),
            description: pickString(item?.description, item?.desc, item?.remark, item?.introduction, item?.summary),
            image: pickString(item?.image, item?.imageUrl, item?.avatar, item?.avatarUrl, item?.url, item?.fileUrl, item?.picture)
        }))
        .filter(item => item.name || item.description || item.image)
}

function normalizeTemplateItem(item: any): TemplateItem {
    if (!item || typeof item !== 'object') return item

    return {
        ...item,
        representativeList: normalizeRepresentativeList(
            item.representativeList ?? item.representatives ?? item.representativeInfos ?? item.representativeInfoList
        )
    }
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
    if (Array.isArray(rows)) return rows.map(item => normalizeTemplateItem(item))
    if (Array.isArray(rows?.records)) return rows.records.map((item: TemplateItem) => normalizeTemplateItem(item))
    if (Array.isArray(rows?.list)) return rows.list.map((item: TemplateItem) => normalizeTemplateItem(item))
    if (Array.isArray(rows?.items)) return rows.items.map((item: TemplateItem) => normalizeTemplateItem(item))
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
