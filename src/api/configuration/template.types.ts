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
