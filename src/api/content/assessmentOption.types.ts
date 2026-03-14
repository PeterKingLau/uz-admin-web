export interface AssessmentOptionItem {
    [key: string]: any
}

export interface AssessmentOptionListParams {
    questionId: number
}

export interface AssessmentOptionListResponse {
    code?: number
    msg?: string
    total?: number
    data?: AssessmentOptionItem[] | Record<string, any>
    rows?: AssessmentOptionItem[]
}

export interface AddAssessmentOptionPayload {
    questionId: number
    content: string
    optionKey: string
    scoreValue: number
    sortOrder: number
}

export interface UpdateAssessmentOptionPayload {
    id: number
    content: string
    optionKey: string
    scoreValue: number
    sortOrder: number
}
