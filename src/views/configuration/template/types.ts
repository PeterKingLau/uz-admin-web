export interface RepresentativeItem {
    name: string
    description: string
    image: string
}

export interface TemplateForm {
    id?: number
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

export interface QueryParams {
    pageNum: number
    pageSize: number
    name: string
    code: string
}

export interface DimensionOption {
    label: string
    value: string
}
